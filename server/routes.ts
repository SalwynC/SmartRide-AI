import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerChatRoutes } from "./replit_integrations/chat";
import { insertUserSchema, bookingRequestSchema } from "@shared/schema";

// --- HEURISTIC LOGIC / "AI" SIMULATION ---
function calculateFairnessScore(surge: number, waitTime: number): number {
  // Simple heuristic: higher surge = lower fairness, higher wait = lower fairness
  const score = 10 - (surge - 1) * 5 - (waitTime / 10);
  return Math.max(1, Math.min(10, score)); // Clamp 1-10
}

function calculateCarbon(distance: number): number {
  return distance * 0.12; // 0.12 kg CO2 per km
}

function predictWaitTime(demand: number, supply: number): number {
  const ratio = demand / (supply || 1); // Avoid div/0
  return Math.min(15, 2 + ratio * 3); // Base 2 mins + factor
}

function calculateCancellationProb(waitTime: number, surge: number): number {
  // Higher wait/surge => higher probability
  return Math.min(0.9, (waitTime * 0.05) + ((surge - 1) * 0.2));
}

// --- SEED DATA ---
async function seedDatabase() {
  const existingZones = await storage.getZones();
  if (existingZones.length === 0) {
    console.log("Seeding zones...");
    const zones = [
      { name: "Downtown", lat: 40.7128, lng: -74.0060, demandScore: 8.5, trafficIndex: 7.2, availableDrivers: 15 },
      { name: "Airport", lat: 40.6413, lng: -73.7781, demandScore: 9.2, trafficIndex: 4.5, availableDrivers: 25 },
      { name: "Suburbs", lat: 40.8, lng: -74.1, demandScore: 3.5, trafficIndex: 2.1, availableDrivers: 5 },
      { name: "Tech Park", lat: 40.75, lng: -73.98, demandScore: 6.0, trafficIndex: 5.5, availableDrivers: 10 },
    ];
    for (const z of zones) {
      await storage.createZone(z);
    }
  }

  const admin = await storage.getUserByUsername("admin");
  if (!admin) {
    console.log("Seeding admin...");
    await storage.createUser({ username: "admin", password: "password", role: "admin" });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register AI Chat Routes (from integration)
  registerChatRoutes(app);

  // Seed DB on startup
  seedDatabase().catch(console.error);

  // --- USERS ---
  app.post(api.users.login.path, async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      res.json(user);
    } catch (e) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(api.users.register.path, async (req, res) => {
    try {
      const input = insertUserSchema.parse(req.body);
      // Check if exists
      const existing = await storage.getUserByUsername(input.username);
      if (existing) {
        return res.status(400).json({ message: "Username taken" });
      }
      const user = await storage.createUser(input);
      res.status(201).json(user);
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ message: e.errors[0].message });
        }
        res.status(500).json({ message: "Internal error" });
    }
  });

  app.get(api.users.get.path, async (req, res) => {
      const user = await storage.getUser(Number(req.params.id));
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
  });

  // --- ZONES ---
  app.get(api.zones.list.path, async (req, res) => {
    const zones = await storage.getZones();
    // Simulate dynamic updates randomly
    const updatedZones = zones.map(z => ({
      ...z,
      demandScore: Math.min(10, Math.max(0, z.demandScore! + (Math.random() - 0.5))),
      trafficIndex: Math.min(10, Math.max(0, z.trafficIndex! + (Math.random() - 0.5))),
    }));
    res.json(updatedZones);
  });

  // --- RIDES: PREDICT (Get Quote) ---
  app.post(api.rides.predict.path, async (req, res) => {
    try {
      const input = bookingRequestSchema.parse(req.body);
      
      // Simulation Logic
      const isPeak = input.simulatedPeak ?? (new Date().getHours() >= 17 && new Date().getHours() <= 19); // Default peak 5-7pm
      const traffic = input.simulatedTraffic ?? 5.0; // Default medium traffic
      
      const demand = isPeak ? 150 : 50; // Requests per hour
      const supply = 30; // Available drivers
      
      const ratio = demand / supply;
      let surge = 1.0;
      if (ratio > 1.5) surge += 0.3;
      if (isPeak) surge += 0.15;
      if (traffic > 7) surge += 0.1;

      const baseRatePerKm = 12; // ₹12/km
      const baseFare = 50; // ₹50 base

      const distanceCost = input.distanceKm * baseRatePerKm;
      const finalFare = (baseFare + distanceCost) * surge;

      const waitTime = predictWaitTime(demand, supply);
      const duration = (input.distanceKm / (30 / (traffic/2 + 1))) * 60; // Simple speed calc

      const quote = {
        distanceKm: input.distanceKm,
        predictedWaitTime: parseFloat(waitTime.toFixed(1)),
        predictedDuration: parseFloat(duration.toFixed(0)),
        baseFare: baseFare,
        surgeMultiplier: parseFloat(surge.toFixed(2)),
        finalFare: parseFloat(finalFare.toFixed(2)),
        carbonEmissions: parseFloat(calculateCarbon(input.distanceKm).toFixed(2)),
        cancellationProb: parseFloat(calculateCancellationProb(waitTime, surge).toFixed(2)),
        fairnessScore: parseFloat(calculateFairnessScore(surge, waitTime).toFixed(1)),
        trafficIndex: traffic,
        isPeak: isPeak
      };

      res.json(quote);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      res.status(500).json({ message: "Prediction failed" });
    }
  });

  // --- RIDES: CREATE ---
  app.post(api.rides.create.path, async (req, res) => {
    try {
      const input = bookingRequestSchema.parse(req.body);
      
      // Re-run minimal logic or trust inputs? Ideally re-run.
      // For MVP, we'll re-calculate the fare to ensure server-side truth.
      // (Simplified duplication of logic above)
      const isPeak = input.simulatedPeak ?? false;
      const traffic = input.simulatedTraffic ?? 5;
      let surge = 1.0;
      if (isPeak) surge += 0.15;
      
      const fare = (50 + input.distanceKm * 12) * surge;
      
      const ride = await storage.createRide({
        passengerId: input.passengerId,
        pickupAddress: input.pickupAddress,
        dropAddress: input.dropAddress,
        distanceKm: input.distanceKm,
        baseFare: 50,
        surgeMultiplier: surge,
        finalFare: fare,
        status: "pending",
        // Default AI values
        predictedWaitTime: 5,
        predictedDuration: 15,
        cancellationProb: 0.1,
        carbonEmissions: input.distanceKm * 0.12,
        pricingFairnessScore: 9.0
      });
      
      res.status(201).json(ride);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      res.status(500).json({ message: "Booking failed" });
    }
  });

  // --- RIDES: LIST ---
  app.get(api.rides.list.path, async (req, res) => {
    const userId = req.query.userId ? Number(req.query.userId) : undefined;
    if (userId) {
      const rides = await storage.getRidesByUser(userId);
      return res.json(rides);
    }
    // If no user, maybe admin? Or just return empty for safety if not admin auth'd (omitted for MVP)
    res.json([]);
  });
  
  app.get(api.rides.get.path, async (req, res) => {
      const ride = await storage.getRide(Number(req.params.id));
      if (!ride) return res.status(404).json({ message: "Ride not found" });
      res.json(ride);
  });

  // --- ADMIN ---
  app.get(api.admin.stats.path, async (req, res) => {
    const allRides = await storage.getAllRides();
    const zones = await storage.getZones();
    
    const totalRides = allRides.length;
    const revenue = allRides.reduce((acc, r) => acc + r.finalFare, 0);
    const avgSurge = allRides.length ? allRides.reduce((acc, r) => acc + (r.surgeMultiplier || 1), 0) / allRides.length : 1;
    
    res.json({
      totalRides,
      activeDrivers: 42, // Mock
      revenue: parseFloat(revenue.toFixed(2)),
      avgSurge: parseFloat(avgSurge.toFixed(2)),
      avgWaitTime: 4.5, // Mock
      zoneStats: zones
    });
  });

  return httpServer;
}
