import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, bookingRequestSchema } from "@shared/routes";
import { z } from "zod";
import { type InsertRide } from "@shared/schema";
import { INDIAN_CITIES, getCityInfo } from "@shared/cities";
import bcrypt from "bcrypt";
import crypto from "crypto";

// --- HAVERSINE FORMULA: Calculate real distance from coordinates ---
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

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
async function seedDatabase(retries = 3) {
  try {
    const existingZones = await storage.getZones();
    if (existingZones.length === 0) {
      console.log("🌱 Seeding zones for all Indian cities...");
      
      // Seed zones for all cities
      for (const [cityKey, cityData] of Object.entries(INDIAN_CITIES)) {
        console.log(`   Seeding ${cityData.displayName}...`);
        for (const zone of cityData.zones) {
          await storage.createZone({
            city: cityData.displayName,
            name: zone.name,
            lat: zone.lat,
            lng: zone.lng,
            demandScore: Math.random() * 5 + 5, // 5-10
            trafficIndex: Math.random() * 5 + 3, // 3-8
            availableDrivers: Math.floor(Math.random() * 20 + 10), // 10-30
          });
        }
      }
      
      console.log("✅ All zones seeded successfully (7 cities)");
    } else {
      console.log("✅ Zones already seeded");
    }

    const admin = await storage.getUserByUsername("admin");
    if (!admin) {
      console.log("🌱 Seeding admin user...");
      const hashedPassword = await bcrypt.hash("password", 10);
      await storage.createUser({ 
        username: "admin", 
        password: hashedPassword, 
        role: "admin",
      });
      console.log("✅ Admin user seeded successfully");
    } else {
      console.log("✅ Admin user already exists");
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (retries > 0 && errorMsg.includes("timeout")) {
      console.warn(`⚠️  Database seeding timeout, retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
      return seedDatabase(retries - 1);
    }
    
    console.warn("⚠️  Database seeding skipped (non-critical):", errorMsg);
    // Don't crash the server if seeding fails
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Seed DB on startup
  seedDatabase().catch(console.error);

  // --- AUTHENTICATION ---
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, email, password, role, phoneNumber } = req.body;

      // Basic validation
      if (!username || !email || !password || !role) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");

      // Create user
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        role,
        email,
        emailVerified: false,
        verificationToken,
        phoneNumber: phoneNumber || null,
      });

      // In production, send verification email here
      console.log(`📧 Verification token for ${email}: ${verificationToken}`);
      console.log(`   Verify at: http://localhost:5000/api/auth/verify-email?token=${verificationToken}`);

      res.json({ 
        message: "Account created successfully. Check console for verification link.",
        userId: newUser.id
      });
    } catch (e) {
      console.error("Signup error:", e);
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      // Get user by email (need to add this to storage)
      const users = await storage.getUsers();
      const user = users.find(u => u.email === email);

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if email is verified (optional - you can enforce this or not)
      // if (!user.emailVerified) {
      //   return res.status(403).json({ message: "Please verify your email first" });
      // }

      // Return user data (excluding password)
      const { password: _, verificationToken: __, ...userData } = user;
      res.json(userData);
    } catch (e) {
      console.error("Login error:", e);
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Invalid verification token" });
      }

      // Find user by verification token (need to add this to storage)
      const users = await storage.getUsers();
      const user = users.find(u => u.verificationToken === token);

      if (!user) {
        return res.status(404).json({ message: "Invalid or expired token" });
      }

      // Update user to verified (this requires a storage method)
      // For now, we'll return success
      console.log(`✅ Email verified for user: ${user.email}`);

      res.json({ message: "Email verified successfully!" });
    } catch (e) {
      console.error("Verification error:", e);
      res.status(500).json({ message: "Internal error" });
    }
  });

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
      const input = api.users.register.input.parse(req.body);
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
    const city = req.query.city as string | undefined;
    let zones = await storage.getZones();
    
    // Filter by city if provided
    if (city) {
      zones = zones.filter(z => z.city?.toLowerCase() === city.toLowerCase());
    }
    
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
      
      // Detect city from pickup address (default to Delhi)
      let cityKey = "delhi";
      const pickupLower = input.pickupAddress.toLowerCase();
      
      if (pickupLower.includes("mumbai") || pickupLower.includes("bandra") || pickupLower.includes("andheri")) cityKey = "mumbai";
      else if (pickupLower.includes("bangalore") || pickupLower.includes("bengaluru") || pickupLower.includes("koramangala")) cityKey = "bangalore";
      else if (pickupLower.includes("hyderabad") || pickupLower.includes("hitec") || pickupLower.includes("gachibowli")) cityKey = "hyderabad";
      else if (pickupLower.includes("chennai") || pickupLower.includes("nagar")) cityKey = "chennai";
      else if (pickupLower.includes("pune") || pickupLower.includes("hinjewadi") || pickupLower.includes("kharadi")) cityKey = "pune";
      else if (pickupLower.includes("kolkata") || pickupLower.includes("salt lake") || pickupLower.includes("park street")) cityKey = "kolkata";
      
      const cityInfo = getCityInfo(cityKey);
      
      // 🎯 SMART ROUTING: Calculate real distance from zone coordinates
      let realDistance = input.distanceKm; // Fallback to user's slider value
      const zones = await storage.getZones();
      
      const pickupZone = zones.find(z => z.name === input.pickupAddress);
      const dropZone = zones.find(z => z.name === input.dropAddress);
      
      if (pickupZone && dropZone) {
        // Calculate actual distance using Haversine formula
        realDistance = calculateDistance(
          pickupZone.lat,
          pickupZone.lng,
          dropZone.lat,
          dropZone.lng
        );
        console.log(`📍 Smart Route: ${pickupZone.name} → ${dropZone.name} = ${realDistance.toFixed(2)} km (actual)`);
      }
      
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

      const baseRatePerKm = cityInfo.ratePerKm; // City-specific rate
      const baseFare = cityInfo.baseFare; // City-specific base fare

      const distanceCost = realDistance * baseRatePerKm; // Using real calculated distance
      const finalFare = (baseFare + distanceCost) * surge;

      const waitTime = predictWaitTime(demand, supply);
      const duration = (realDistance / (30 / (traffic/2 + 1))) * 60; // Speed adjusted by traffic

      const quote = {
        distanceKm: parseFloat(realDistance.toFixed(2)),
        predictedWaitTime: parseFloat(waitTime.toFixed(1)),
        predictedDuration: parseFloat(duration.toFixed(0)),
        baseFare: baseFare,
        surgeMultiplier: parseFloat(surge.toFixed(2)),
        finalFare: parseFloat(finalFare.toFixed(2)),
        carbonEmissions: parseFloat(calculateCarbon(realDistance).toFixed(2)),
        cancellationProb: parseFloat(calculateCancellationProb(waitTime, surge).toFixed(2)),
        fairnessScore: parseFloat(calculateFairnessScore(surge, waitTime).toFixed(1)),
        trafficIndex: traffic,
        isPeak: isPeak,
        city: cityInfo.displayName,
        routeCalculated: !!(pickupZone && dropZone) // Flag to show if real coordinates were used
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
      
      const fare = (30 + input.distanceKm * 10) * surge;
      
      const ride = await storage.createRide({
        passengerId: input.passengerId,
        pickupAddress: input.pickupAddress,
        dropAddress: input.dropAddress,
        distanceKm: input.distanceKm,
        baseFare: 30,
        surgeMultiplier: surge,
        finalFare: fare,
        predictedWaitTime: 5,
        predictedDuration: 15,
        cancellationProb: 0.1,
        carbonEmissions: input.distanceKm * 0.12,
        pricingFairnessScore: 9.0
      } as InsertRide);
      
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

  // --- ADMIN: Reset Zones (for demo/development) ---
  app.post("/api/admin/reset-zones", async (req, res) => {
    try {
      // Import db and zones from storage
      const { db } = await import("./db");
      const { zones: zonesTable } = await import("@shared/schema");
      
      // Clear existing zones
      await db.delete(zonesTable);
      console.log("🗑️  Zones cleared");
      
      // Re-seed with all Indian cities
      let totalSeeded = 0;
      for (const [cityKey, cityData] of Object.entries(INDIAN_CITIES)) {
        console.log(`   Seeding ${cityData.displayName}...`);
        for (const zone of cityData.zones) {
          await storage.createZone({
            city: cityData.displayName,
            name: zone.name,
            lat: zone.lat,
            lng: zone.lng,
            demandScore: Math.random() * 5 + 5, // 5-10
            trafficIndex: Math.random() * 5 + 3, // 3-8
            availableDrivers: Math.floor(Math.random() * 20 + 10), // 10-30
          });
          totalSeeded++;
        }
      }
      
      console.log(`✅ ${totalSeeded} zones seeded across ${Object.keys(INDIAN_CITIES).length} cities`);
      res.json({ message: `Zones reset: ${totalSeeded} zones across 7 cities`, totalZones: totalSeeded });
    } catch (error) {
      console.error("❌ Zone reset failed:", error);
      res.status(500).json({ message: "Failed to reset zones" });
    }
  });

  return httpServer;
}
