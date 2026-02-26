import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, bookingRequestSchema } from "@shared/routes";
import { z } from "zod";
import { INDIAN_CITIES, getCityInfo } from "@shared/cities";
import bcrypt from "bcrypt";
import crypto from "crypto";

// Chat store uses database (chatMessages table) for persistence

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

// --- CITY DETECTION from address string ---
function detectCityKey(address: string): string {
  const lower = address.toLowerCase();
  if (lower.includes("mumbai") || lower.includes("bandra") || lower.includes("andheri")) return "mumbai";
  if (lower.includes("bangalore") || lower.includes("bengaluru") || lower.includes("koramangala")) return "bangalore";
  if (lower.includes("hyderabad") || lower.includes("hitec") || lower.includes("gachibowli")) return "hyderabad";
  if (lower.includes("chennai") || lower.includes("nagar")) return "chennai";
  if (lower.includes("pune") || lower.includes("hinjewadi") || lower.includes("kharadi")) return "pune";
  if (lower.includes("kolkata") || lower.includes("salt lake") || lower.includes("park street")) return "kolkata";
  return "delhi";
}

// --- UNIFIED FARE CALCULATION ---
interface FareInput {
  pickupAddress: string;
  dropAddress: string;
  distanceKm: number;
  simulatedPeak?: boolean;
  simulatedTraffic?: number;
}
interface FareResult {
  distanceKm: number;
  baseFare: number;
  surgeMultiplier: number;
  finalFare: number;
  predictedWaitTime: number;
  predictedDuration: number;
  carbonEmissions: number;
  cancellationProb: number;
  fairnessScore: number;
  trafficIndex: number;
  isPeak: boolean;
  city: string;
  routeCalculated: boolean;
}
async function calculateFare(input: FareInput): Promise<FareResult> {
  const cityKey = detectCityKey(input.pickupAddress);
  const cityInfo = getCityInfo(cityKey);

  // Smart routing: calculate real distance from zone coordinates
  let realDistance = input.distanceKm;
  const zones = await storage.getZones();
  const pickupZone = zones.find(z => z.name === input.pickupAddress);
  const dropZone = zones.find(z => z.name === input.dropAddress);

  if (pickupZone && dropZone) {
    realDistance = calculateDistance(pickupZone.lat, pickupZone.lng, dropZone.lat, dropZone.lng);
  }

  const isPeak = input.simulatedPeak ?? (new Date().getHours() >= 17 && new Date().getHours() <= 19);
  const traffic = input.simulatedTraffic ?? 5.0;

  const demand = isPeak ? 150 : 50;
  const supply = 30;
  const ratio = demand / supply;
  let surge = 1.0;
  if (ratio > 1.5) surge += 0.3;
  if (isPeak) surge += 0.15;
  if (traffic > 7) surge += 0.1;

  const distanceCost = realDistance * cityInfo.ratePerKm;
  const finalFare = (cityInfo.baseFare + distanceCost) * surge;
  const waitTime = predictWaitTime(demand, supply);
  const duration = (realDistance / (30 / (traffic / 2 + 1))) * 60;

  return {
    distanceKm: parseFloat(realDistance.toFixed(2)),
    baseFare: cityInfo.baseFare,
    surgeMultiplier: parseFloat(surge.toFixed(2)),
    finalFare: parseFloat(finalFare.toFixed(2)),
    predictedWaitTime: parseFloat(waitTime.toFixed(1)),
    predictedDuration: parseFloat(duration.toFixed(0)),
    carbonEmissions: parseFloat(calculateCarbon(realDistance).toFixed(2)),
    cancellationProb: parseFloat(calculateCancellationProb(waitTime, surge).toFixed(2)),
    fairnessScore: parseFloat(calculateFairnessScore(surge, waitTime).toFixed(1)),
    trafficIndex: traffic,
    isPeak,
    city: cityInfo.displayName,
    routeCalculated: !!(pickupZone && dropZone),
  };
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

  // --- AUTH MIDDLEWARE (lightweight — checks x-user-id header) ---
  // In production, replace with JWT verification
  async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const user = await storage.getUser(Number(userId));
    if (!user) {
      return res.status(401).json({ message: "Invalid user" });
    }
    (req as any).authenticatedUser = user;
    next();
  }

  async function requireAdmin(req: Request, res: Response, next: NextFunction) {
    await requireAuth(req, res, (() => {
      if ((req as any).authenticatedUser?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      next();
    }) as NextFunction);
  }

  function requireRole(...roles: string[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
      await requireAuth(req, res, (() => {
        const userRole = (req as any).authenticatedUser?.role;
        if (!roles.includes(userRole)) {
          return res.status(403).json({ message: `Requires ${roles.join(" or ")} role` });
        }
        next();
      }) as NextFunction);
    };
  }

  // --- RATE LIMITER for auth endpoints ---
  const authAttempts = new Map<string, { count: number; resetAt: number }>();
  const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
  const RATE_LIMIT_MAX = 15; // max attempts per window

  function rateLimit(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
    const now = Date.now();
    const entry = authAttempts.get(ip);

    if (entry && now < entry.resetAt) {
      if (entry.count >= RATE_LIMIT_MAX) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        res.setHeader("Retry-After", String(retryAfter));
        return res.status(429).json({ message: "Too many attempts. Try again later.", retryAfter });
      }
      entry.count++;
    } else {
      authAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    }

    // Periodically clean up expired entries
    if (authAttempts.size > 1000) {
      Array.from(authAttempts.entries()).forEach(([key, val]) => {
        if (now >= val.resetAt) authAttempts.delete(key);
      });
    }

    next();
  }

  // --- AUTHENTICATION ---
  app.post("/api/auth/signup", rateLimit, async (req, res) => {
    try {
      const { username, email, password, role, phoneNumber } = req.body;

      // Basic validation
      if (!username || !email || !password || !role) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Only allow passenger/driver signup (admin is seeded)
      if (!["passenger", "driver"].includes(role)) {
        return res.status(400).json({ message: "Role must be passenger or driver" });
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

  app.post("/api/auth/login", rateLimit, async (req, res) => {
    try {
      const { email, password } = req.body;

      // Look up user by email directly (indexed query)
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check password with bcrypt
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Return user data (excluding sensitive fields)
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

      // Find user by verification token
      const users = await storage.getUsers();
      const user = users.find(u => u.verificationToken === token);

      if (!user) {
        return res.status(404).json({ message: "Invalid or expired token" });
      }

      // Actually update user to verified in the database
      await storage.updateUser(user.id, { 
        emailVerified: true, 
        verificationToken: null 
      });

      res.json({ message: "Email verified successfully!" });
    } catch (e) {
      console.error("Verification error:", e);
      res.status(500).json({ message: "Internal error" });
    }
  });

  // --- USERS ---
  // Legacy plaintext login removed for security — use /api/auth/login with bcrypt instead
  // Legacy /api/users/register removed — use /api/auth/signup instead

  app.get(api.users.get.path, requireAuth, async (req, res) => {
      const user = await storage.getUser(Number(req.params.id));
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
  });

  // --- USERS: UPDATE PROFILE ---
  app.patch("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const targetId = Number(req.params.id);
      const caller = (req as any).authenticatedUser;

      // Only allow users to update their own profile
      if (caller.id !== targetId) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }

      const { username, email, phoneNumber, currentPassword, newPassword } = req.body;

      const updateData: Record<string, any> = {};
      if (username !== undefined) updateData.username = username;
      if (email !== undefined) updateData.email = email;
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;

      // Handle password change
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: "Current password is required to set a new password" });
        }
        const valid = await bcrypt.compare(currentPassword, caller.password);
        if (!valid) {
          return res.status(401).json({ message: "Current password is incorrect" });
        }
        updateData.password = await bcrypt.hash(newPassword, 10);
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No fields to update" });
      }

      const updated = await storage.updateUser(targetId, updateData);
      // Never send password back
      const { password: _pw, ...safeUser } = updated;
      res.json(safeUser);
    } catch (e: any) {
      if (e?.message?.includes("unique")) {
        return res.status(409).json({ message: "Username already taken" });
      }
      console.error("Update user error:", e);
      res.status(500).json({ message: "Failed to update profile" });
    }
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
      const fare = await calculateFare(input);
      res.json(fare);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      res.status(500).json({ message: "Prediction failed" });
    }
  });

  // --- RIDES: CREATE (passenger only) ---
  app.post(api.rides.create.path, requireRole("passenger"), async (req, res) => {
    try {
      const input = bookingRequestSchema.parse(req.body);
      const fare = await calculateFare(input);
      
      const ride = await storage.createRide({
        passengerId: input.passengerId,
        pickupAddress: input.pickupAddress,
        dropAddress: input.dropAddress,
        distanceKm: fare.distanceKm,
        baseFare: fare.baseFare,
        surgeMultiplier: fare.surgeMultiplier,
        finalFare: fare.finalFare,
        predictedWaitTime: fare.predictedWaitTime,
        predictedDuration: fare.predictedDuration,
        cancellationProb: fare.cancellationProb,
        carbonEmissions: fare.carbonEmissions,
        pricingFairnessScore: fare.fairnessScore,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
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
    const driverId = req.query.driverId ? Number(req.query.driverId) : undefined;
    const status = req.query.status as string | undefined;
    
    if (userId) {
      const rides = await storage.getRidesByUser(userId);
      return res.json(rides);
    }
    if (driverId) {
      const rides = await storage.getRidesByDriver(driverId);
      return res.json(rides);
    }
    if (status === "pending") {
      const rides = await storage.getPendingRides();
      return res.json(rides);
    }
    // Return all rides for admin views
    const allRides = await storage.getAllRides();
    res.json(allRides);
  });
  
  app.get(api.rides.get.path, async (req, res) => {
      const ride = await storage.getRide(Number(req.params.id));
      if (!ride) return res.status(404).json({ message: "Ride not found" });
      res.json(ride);
  });

  // --- ADMIN ---
  app.get(api.admin.stats.path, requireAdmin, async (req, res) => {
    const allRides = await storage.getAllRides();
    const zones = await storage.getZones();
    
    const totalRides = allRides.length;
    const revenue = allRides.reduce((acc, r) => acc + r.finalFare, 0);
    const avgSurge = allRides.length ? allRides.reduce((acc, r) => acc + (r.surgeMultiplier || 1), 0) / allRides.length : 1;
    
    // Real driver count from DB
    const users = await storage.getUsers();
    const activeDrivers = users.filter(u => u.role === "driver").length;
    
    // Real avg wait time from rides
    const ridesWithWait = allRides.filter(r => (r.predictedWaitTime ?? 0) > 0);
    const avgWaitTime = ridesWithWait.length
      ? ridesWithWait.reduce((sum, r) => sum + (r.predictedWaitTime ?? 0), 0) / ridesWithWait.length
      : 0;
    
    res.json({
      totalRides,
      activeDrivers,
      revenue: parseFloat(revenue.toFixed(2)),
      avgSurge: parseFloat(avgSurge.toFixed(2)),
      avgWaitTime: parseFloat(avgWaitTime.toFixed(1)),
      zoneStats: zones
    });
  });

  // --- ADMIN: Real-time analytics charts data ---
  app.get("/api/admin/analytics", requireAdmin, async (req, res) => {
    const allRides = await storage.getAllRides();
    const zones = await storage.getZones();

    // 1) Demand by time-of-day: bucket rides by creation hour
    const hourBuckets: Record<string, number> = {};
    for (let h = 6; h <= 22; h += 2) {
      const label = `${h.toString().padStart(2, "0")}:00`;
      hourBuckets[label] = 0;
    }
    for (const ride of allRides) {
      const hr = new Date(ride.createdAt!).getHours();
      const bucket = Math.floor(hr / 2) * 2;
      const clamped = Math.min(22, Math.max(6, bucket));
      const label = `${clamped.toString().padStart(2, "0")}:00`;
      hourBuckets[label] = (hourBuckets[label] || 0) + 1;
    }
    const demandByHour = Object.entries(hourBuckets).map(([time, demand]) => ({ time, demand }));

    // 2) Wait times by zone: use real ride data matched to zones
    const zoneWaitMap: Record<string, { total: number; count: number }> = {};
    for (const ride of allRides) {
      const zone = ride.pickupAddress;
      if (!zoneWaitMap[zone]) zoneWaitMap[zone] = { total: 0, count: 0 };
      zoneWaitMap[zone].total += ride.predictedWaitTime ?? 0;
      zoneWaitMap[zone].count += 1;
    }
    const waitByZone = Object.entries(zoneWaitMap)
      .map(([zone, data]) => ({ zone, minutes: parseFloat((data.total / data.count).toFixed(1)) }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 6);

    // 3) Fleet utilization from zones
    const totalDrivers = zones.reduce((sum, z) => sum + (z.availableDrivers || 0), 0);
    const busyDrivers = allRides.filter(r => r.status === "in_progress" || r.status === "accepted").length;
    const activePercent = totalDrivers > 0 ? Math.round((busyDrivers / totalDrivers) * 100) : 0;
    const idlePercent = Math.max(0, 100 - activePercent - 10);
    const offlinePercent = 100 - activePercent - idlePercent;
    const fleetUtilization = [
      { name: "Active", value: activePercent, fill: "#14b8a6" },
      { name: "Idle", value: idlePercent, fill: "#f59e0b" },
      { name: "Offline", value: offlinePercent, fill: "#64748b" },
    ];

    // 4) Revenue mix from real rides
    const surgeRides = allRides.filter(r => (r.surgeMultiplier || 1) > 1.1);
    const normalRides = allRides.filter(r => (r.surgeMultiplier || 1) <= 1.1);
    const surgeRevenue = surgeRides.reduce((s, r) => s + r.finalFare, 0);
    const normalRevenue = normalRides.reduce((s, r) => s + r.finalFare, 0);
    const totalRevenue = surgeRevenue + normalRevenue || 1;
    const revenueMix = [
      { name: "Standard", value: Math.round((normalRevenue / totalRevenue) * 100), fill: "#14b8a6" },
      { name: "Surge", value: Math.round((surgeRevenue / totalRevenue) * 100), fill: "#f59e0b" },
    ];

    res.json({ demandByHour, waitByZone, fleetUtilization, revenueMix });
  });

  // --- ADMIN: Reset Zones (for demo/development) ---
  app.post("/api/admin/reset-zones", requireAdmin, async (req, res) => {
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

  // ============================================
  // NEW FEATURE: RATINGS & REVIEWS
  // ============================================
  app.post("/api/ratings", requireAuth, async (req, res) => {
    try {
      const { rideId, passengerId, driverId, stars, comment } = req.body;
      if (!rideId || !passengerId || !stars || stars < 1 || stars > 5) {
        return res.status(400).json({ message: "Invalid rating data" });
      }
      
      // Prevent duplicate ratings for the same ride
      const existingRatings = await storage.getRatingsByRide(rideId);
      const alreadyRated = existingRatings.some(r => r.passengerId === passengerId);
      if (alreadyRated) {
        return res.status(409).json({ message: "You have already rated this ride" });
      }
      
      const rating = await storage.createRating({
        rideId,
        passengerId,
        driverId: driverId || null,
        stars,
        comment: comment || null,
      });

      // Create notification for driver
      if (driverId) {
        await storage.createNotification({
          userId: driverId,
          type: "ride_update",
          title: "New Rating Received",
          message: `You received a ${stars}-star rating${comment ? `: "${comment}"` : ""}`,
          rideId,
        });
      }

      res.status(201).json(rating);
    } catch (e) {
      console.error("Rating error:", e);
      res.status(500).json({ message: "Failed to submit rating" });
    }
  });

  app.get("/api/ratings/ride/:rideId", async (req, res) => {
    const ratings = await storage.getRatingsByRide(Number(req.params.rideId));
    res.json(ratings);
  });

  app.get("/api/ratings/driver/:driverId", async (req, res) => {
    const ratings = await storage.getRatingsByDriver(Number(req.params.driverId));
    const avg = await storage.getAverageRating(Number(req.params.driverId));
    res.json({ ratings, averageRating: parseFloat(avg.toFixed(2)) });
  });

  // ============================================
  // NEW FEATURE: NOTIFICATIONS
  // ============================================
  app.get("/api/notifications/:userId", requireAuth, async (req, res) => {
    const notifications = await storage.getNotificationsByUser(Number(req.params.userId));
    res.json(notifications);
  });

  app.get("/api/notifications/:userId/unread", requireAuth, async (req, res) => {
    const count = await storage.getUnreadCount(Number(req.params.userId));
    res.json({ count });
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const notification = await storage.markNotificationRead(Number(req.params.id));
      res.json(notification);
    } catch (e) {
      res.status(500).json({ message: "Failed to mark as read" });
    }
  });

  app.patch("/api/notifications/:userId/read-all", requireAuth, async (req, res) => {
    try {
      await storage.markAllRead(Number(req.params.userId));
      res.json({ message: "All notifications marked as read" });
    } catch (e) {
      res.status(500).json({ message: "Failed to mark all as read" });
    }
  });

  app.post("/api/notifications", requireAuth, async (req, res) => {
    try {
      const { userId, type, title, message, rideId } = req.body;
      const notification = await storage.createNotification({
        userId,
        type,
        title,
        message,
        rideId: rideId || null,
      });
      res.status(201).json(notification);
    } catch (e) {
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  // ============================================
  // NEW FEATURE: PAYMENTS
  // ============================================
  app.post("/api/payments", requireAuth, async (req, res) => {
    try {
      const { rideId, userId, amount, method, breakdown } = req.body;
      if (!rideId || !userId || !amount || !method) {
        return res.status(400).json({ message: "Missing payment details" });
      }
      
      // Generate txn ID upfront so client and server are in sync
      const txnId = `TXN${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const payment = await storage.createPayment({
        rideId,
        userId,
        amount,
        method,
        breakdown: breakdown || null,
      });

      // Simulate payment processing — update status after delay
      setTimeout(async () => {
        try {
          await storage.updatePaymentStatus(payment.id, "completed", txnId);
          await storage.createNotification({
            userId,
            type: "payment",
            title: "Payment Successful",
            message: `₹${Number(amount).toFixed(2)} paid via ${method.toUpperCase()}. Txn: ${txnId}`,
            rideId,
          });
        } catch (err) {
          console.error("Payment processing error:", err);
        }
      }, 1500);

      // Return payment with txn ID so client can show it immediately
      res.status(201).json({ ...payment, transactionId: txnId });
    } catch (e) {
      console.error("Payment error:", e);
      res.status(500).json({ message: "Payment failed" });
    }
  });

  app.get("/api/payments/ride/:rideId", requireAuth, async (req, res) => {
    const payment = await storage.getPaymentByRide(Number(req.params.rideId));
    if (!payment) return res.status(404).json({ message: "No payment found" });
    res.json(payment);
  });

  app.get("/api/payments/user/:userId", requireAuth, async (req, res) => {
    const payments = await storage.getPaymentsByUser(Number(req.params.userId));
    res.json(payments);
  });

  // ============================================
  // NEW FEATURE: RIDE TRACKING (Simulated)
  // ============================================
  app.get("/api/rides/:id/track", async (req, res) => {
    const ride = await storage.getRide(Number(req.params.id));
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    // Simulate real-time location based on ride status
    const zones = await storage.getZones();
    const pickupZone = zones.find(z => z.name === ride.pickupAddress);
    const dropZone = zones.find(z => z.name === ride.dropAddress);

    if (!pickupZone || !dropZone) {
      return res.json({
        status: ride.status,
        driverLocation: null,
        eta: null,
        progress: 0,
      });
    }

    // Simulate driver progress
    let progress = 0;
    if (ride.status === "accepted") progress = Math.random() * 0.2;
    else if (ride.status === "in_progress") progress = 0.2 + Math.random() * 0.7;
    else if (ride.status === "completed") progress = 1;

    const driverLat = pickupZone.lat + (dropZone.lat - pickupZone.lat) * progress;
    const driverLng = pickupZone.lng + (dropZone.lng - pickupZone.lng) * progress;

    // Fetch real driver info from DB
    let driverName = "Searching…";
    let driverRating = 0;
    let vehicleInfo = "";
    if (ride.driverId) {
      const driver = await storage.getUser(ride.driverId);
      if (driver) {
        driverName = driver.username;
        driverRating = await storage.getAverageRating(driver.id);
      }
      vehicleInfo = "White Suzuki Swift - DL 01 AB 1234"; // placeholder per driver
    }

    res.json({
      status: ride.status,
      driverLocation: { lat: driverLat, lng: driverLng },
      eta: Math.round((1 - progress) * (ride.predictedDuration || 15)),
      progress: parseFloat(progress.toFixed(2)),
      driverName,
      driverRating: parseFloat(driverRating.toFixed(2)),
      vehicleInfo,
      pickupLocation: { lat: pickupZone.lat, lng: pickupZone.lng },
      dropLocation: { lat: dropZone.lat, lng: dropZone.lng },
    });
  });

  // Update ride status (for simulation)
  // --- RIDES: ACCEPT (driver claims a pending ride) ---
  app.post("/api/rides/:id/accept", requireRole("driver"), async (req, res) => {
    try {
      const rideId = Number(req.params.id);
      const driver = (req as any).authenticatedUser;
      
      // Verify ride exists and is pending
      const ride = await storage.getRide(rideId);
      if (!ride) return res.status(404).json({ message: "Ride not found" });
      if (ride.status !== "pending") {
        return res.status(409).json({ message: "Ride already accepted by another driver" });
      }
      
      // Assign driver and set status to accepted
      const updatedRide = await storage.assignRideToDriver(rideId, driver.id);
      
      // Notify passenger
      await storage.createNotification({
        userId: ride.passengerId,
        type: "driver_arrival",
        title: "Driver Assigned!",
        message: `${driver.username} has accepted your ride and is on the way!`,
        rideId: ride.id,
      });
      
      res.json(updatedRide);
    } catch (e) {
      console.error("Accept ride error:", e);
      res.status(500).json({ message: "Failed to accept ride" });
    }
  });

  // --- RIDES: CANCEL (passenger cancels before ride starts) ---
  app.post("/api/rides/:id/cancel", requireAuth, async (req, res) => {
    try {
      const rideId = Number(req.params.id);
      const user = (req as any).authenticatedUser;

      const ride = await storage.getRide(rideId);
      if (!ride) return res.status(404).json({ message: "Ride not found" });

      // Only the passenger who booked can cancel
      if (ride.passengerId !== user.id) {
        return res.status(403).json({ message: "You can only cancel your own rides" });
      }

      // Only allow cancel for pending or accepted (not in_progress, completed, already cancelled)
      if (!["pending", "accepted"].includes(ride.status!)) {
        return res.status(409).json({ message: `Cannot cancel a ride that is ${ride.status}` });
      }

      const updatedRide = await storage.updateRideStatus(rideId, "cancelled");

      // Notify the driver if one was assigned
      if (ride.driverId) {
        await storage.createNotification({
          userId: ride.driverId,
          type: "ride_update",
          title: "Ride Cancelled",
          message: `The passenger has cancelled ride #${rideId}.`,
          rideId,
        });
      }

      // Notify the passenger too
      await storage.createNotification({
        userId: ride.passengerId,
        type: "ride_update",
        title: "Ride Cancelled",
        message: "Your ride has been cancelled successfully.",
        rideId,
      });

      res.json(updatedRide);
    } catch (e) {
      console.error("Cancel ride error:", e);
      res.status(500).json({ message: "Failed to cancel ride" });
    }
  });

  // --- RIDES: UPDATE STATUS (driver only — for start/complete) ---
  app.patch("/api/rides/:id/status", requireRole("driver"), async (req, res) => {
    try {
      const { status } = req.body;
      const driver = (req as any).authenticatedUser;
      const rideId = Number(req.params.id);
      
      // Verify the driver owns this ride
      const ride = await storage.getRide(rideId);
      if (!ride) return res.status(404).json({ message: "Ride not found" });
      if (ride.driverId !== driver.id) {
        return res.status(403).json({ message: "You can only update your own rides" });
      }
      
      const updatedRide = await storage.updateRideStatus(rideId, status);
      
      // Create notification for status change
      const statusMessages: Record<string, string> = {
        accepted: "A driver has been assigned to your ride!",
        in_progress: "Your ride has started. Enjoy your journey!",
        completed: "Your ride is complete. Don't forget to rate your driver!",
        cancelled: "Your ride has been cancelled.",
      };

      if (statusMessages[status]) {
        await storage.createNotification({
          userId: updatedRide.passengerId,
          type: "ride_update",
          title: status === "completed" ? "Ride Complete!" : "Ride Update",
          message: statusMessages[status],
          rideId: updatedRide.id,
        });
      }

      // Auto-create driver earnings when ride is completed
      if (status === "completed" && driver.id) {
        const commission = updatedRide.finalFare * 0.20; // 20% platform commission
        const netEarnings = updatedRide.finalFare - commission;
        const bonus = updatedRide.distanceKm > 15 ? 20 : 0; // Long-distance bonus
        await storage.createDriverEarning({
          driverId: driver.id,
          rideId: updatedRide.id,
          grossAmount: updatedRide.finalFare,
          commission: parseFloat(commission.toFixed(2)),
          netEarnings: parseFloat((netEarnings + bonus).toFixed(2)),
          bonusAmount: bonus,
        });
      }

      res.json(updatedRide);
    } catch (e) {
      res.status(500).json({ message: "Failed to update ride status" });
    }
  });

  // ============================================
  // NEW FEATURE: CHAT MESSAGES + AI CHATBOT
  // ============================================
  
  // AI Bot auto-reply logic
  function getAIBotReply(message: string): string {
    const msg = message.toLowerCase();
    
    if (msg.includes("eta") || msg.includes("how long") || msg.includes("time") || msg.includes("when")) {
      return "Based on current traffic conditions, estimated arrival is 4-6 minutes. I'll keep you updated! 🚗";
    }
    if (msg.includes("where") || msg.includes("location") || msg.includes("position")) {
      return "Your driver is currently en route and making good progress. You can track the live position on the map above! 📍";
    }
    if (msg.includes("cancel") || msg.includes("stop")) {
      return "I understand you'd like to cancel. Please use the cancel button in the ride tracker, or I can connect you with support. Would you like help with anything else?";
    }
    if (msg.includes("payment") || msg.includes("pay") || msg.includes("fare") || msg.includes("cost") || msg.includes("price")) {
      return "Payment will be processed when your ride is complete. We support UPI, Cards, Wallets, and Cash. The fare shown includes all applicable charges. 💳";
    }
    if (msg.includes("safe") || msg.includes("emergency") || msg.includes("help")) {
      return "Your safety is our top priority! 🛡️ In case of emergency, please call 112 directly. You can also use the SOS feature. Your ride is being tracked in real-time.";
    }
    if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
      return "Hello! 👋 I'm SmartRide AI Assistant. I can help you with ride status, ETA, payment info, and more. How can I assist you?";
    }
    if (msg.includes("thank") || msg.includes("thanks")) {
      return "You're welcome! Happy to help. Enjoy your ride! 😊";
    }
    if (msg.includes("route") || msg.includes("way") || msg.includes("path") || msg.includes("traffic")) {
      return "Your driver is taking the optimal route based on real-time traffic. Current traffic conditions are moderate. 🗺️";
    }
    if (msg.includes("rating") || msg.includes("review") || msg.includes("rate")) {
      return "You'll be able to rate your driver after the ride is complete. Your feedback helps us improve the service! ⭐";
    }
    if (msg.includes("driver") || msg.includes("name")) {
      return "Your driver's details are shown in the ride tracker above. They've been verified and have excellent ratings! 🏅";
    }
    // Default intelligent response
    return "Thanks for your message! I'm SmartRide AI — I can help with ride status, ETA, payment, safety, and more. What would you like to know? 🤖";
  }

  app.post("/api/chat/send", requireAuth, async (req, res) => {
    try {
      const { rideId, senderId, senderRole, message } = req.body;
      if (!rideId || !senderId || !message) {
        return res.status(400).json({ message: "Missing chat data" });
      }

      // Persist to database
      const saved = await storage.createChatMessage({
        rideId,
        senderId,
        senderRole: senderRole || "passenger",
        message,
      });

      // AI auto-reply for passenger messages
      if (senderRole === "passenger" || !senderRole) {
        await storage.createChatMessage({
          rideId,
          senderId: 0, // AI bot
          senderRole: "driver",
          message: getAIBotReply(message),
        });
      }

      res.status(201).json({
        id: saved.id,
        rideId: saved.rideId,
        senderId: saved.senderId,
        senderRole: saved.senderRole,
        message: saved.message,
        timestamp: saved.createdAt?.toISOString(),
      });
    } catch (e) {
      console.error("Chat send error:", e);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/chat/:rideId", requireAuth, async (req, res) => {
    try {
      const rideId = Number(req.params.rideId);
      const rows = await storage.getChatMessagesByRide(rideId);
      // Map to the shape the frontend expects
      const messages = rows.map(r => ({
        id: r.id,
        rideId: r.rideId,
        senderId: r.senderId,
        senderRole: r.senderRole,
        message: r.message,
        timestamp: r.createdAt?.toISOString(),
      }));
      res.json(messages);
    } catch (e) {
      console.error("Chat fetch error:", e);
      res.json([]);
    }
  });

  // ============================================
  // RIDE HISTORY & ANALYTICS
  // ============================================
  app.get("/api/analytics/user/:userId", requireAuth, async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const rides = await storage.getRidesByUser(userId);
      const payments = await storage.getPaymentsByUser(userId);

      const totalSpent = rides.reduce((sum, r) => sum + r.finalFare, 0);
      const totalRides = rides.length;
      const avgFare = totalRides > 0 ? totalSpent / totalRides : 0;
      const totalDistance = rides.reduce((sum, r) => sum + r.distanceKm, 0);
      const totalCarbon = rides.reduce((sum, r) => sum + (r.carbonEmissions || 0), 0);

      // Monthly spending breakdown
      const monthlySpending: Record<string, number> = {};
      rides.forEach(r => {
        const month = new Date(r.createdAt!).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        monthlySpending[month] = (monthlySpending[month] || 0) + r.finalFare;
      });

      // Popular routes
      const routeCounts: Record<string, number> = {};
      rides.forEach(r => {
        const route = `${r.pickupAddress} → ${r.dropAddress}`;
        routeCounts[route] = (routeCounts[route] || 0) + 1;
      });
      const popularRoutes = Object.entries(routeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([route, count]) => ({ route, count }));

      res.json({
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        totalRides,
        avgFare: parseFloat(avgFare.toFixed(2)),
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        totalCarbon: parseFloat(totalCarbon.toFixed(2)),
        monthlySpending: Object.entries(monthlySpending).map(([month, amount]) => ({ month, amount: parseFloat(amount.toFixed(2)) })),
        popularRoutes,
        rides,
      });
    } catch (e) {
      console.error("Analytics error:", e);
      res.status(500).json({ message: "Failed to load analytics" });
    }
  });

  // ============================================
  // RIDE SCHEDULING (book future rides)
  // ============================================
  app.get("/api/rides/scheduled/:userId", requireAuth, async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const scheduled = await storage.getScheduledRides(userId);
      res.json(scheduled);
    } catch (e) {
      console.error("Scheduled rides error:", e);
      res.status(500).json({ message: "Failed to load scheduled rides" });
    }
  });

  // ============================================
  // TRIP RECEIPTS / INVOICE
  // ============================================
  app.get("/api/rides/:id/receipt", requireAuth, async (req, res) => {
    try {
      const rideId = Number(req.params.id);
      const ride = await storage.getRide(rideId);
      if (!ride) return res.status(404).json({ message: "Ride not found" });

      // Only completed rides have receipts
      if (ride.status !== "completed") {
        return res.status(400).json({ message: "Receipt available only for completed rides" });
      }

      const payment = await storage.getPaymentByRide(rideId);
      const passenger = await storage.getUser(ride.passengerId);
      let driverName = "N/A";
      if (ride.driverId) {
        const driver = await storage.getUser(ride.driverId);
        if (driver) driverName = driver.username;
      }

      // Calculate breakdown
      const surgeAmount = ride.baseFare * ((ride.surgeMultiplier || 1) - 1);
      const distanceCost = ride.finalFare / (ride.surgeMultiplier || 1) - ride.baseFare;
      const gst = ride.finalFare * 0.05; // 5% GST
      const platformFee = 15; // flat
      const totalWithTax = ride.finalFare + gst + platformFee;

      const receipt = {
        receiptId: `SR-${ride.id}-${Date.now().toString(36).toUpperCase()}`,
        rideId: ride.id,
        date: ride.createdAt,
        passengerName: passenger?.username || "Unknown",
        driverName,
        pickup: ride.pickupAddress,
        drop: ride.dropAddress,
        distanceKm: ride.distanceKm,
        duration: ride.predictedDuration,
        breakdown: {
          baseFare: ride.baseFare,
          distanceCharge: parseFloat(distanceCost.toFixed(2)),
          surgeAmount: parseFloat(surgeAmount.toFixed(2)),
          surgeMultiplier: ride.surgeMultiplier || 1,
          subtotal: ride.finalFare,
          gst: parseFloat(gst.toFixed(2)),
          platformFee,
          total: parseFloat(totalWithTax.toFixed(2)),
        },
        payment: payment ? {
          method: payment.method,
          status: payment.status,
          transactionId: payment.transactionId,
          paidAt: payment.createdAt,
        } : null,
        carbonSaved: ride.carbonEmissions || 0,
        fairnessScore: ride.pricingFairnessScore || 0,
      };

      res.json(receipt);
    } catch (e) {
      console.error("Receipt error:", e);
      res.status(500).json({ message: "Failed to generate receipt" });
    }
  });

  // ============================================
  // DRIVER EARNINGS
  // ============================================
  app.get("/api/driver/earnings/:driverId", requireRole("driver"), async (req, res) => {
    try {
      const driverId = Number(req.params.driverId);
      const caller = (req as any).authenticatedUser;
      if (caller.id !== driverId) {
        return res.status(403).json({ message: "You can only view your own earnings" });
      }

      const earnings = await storage.getDriverEarnings(driverId);
      const summary = await storage.getDriverEarningsSummary(driverId);
      const completedRides = await storage.getRidesByDriver(driverId);
      const completed = completedRides.filter(r => r.status === "completed");

      // Daily earnings breakdown
      const dailyMap: Record<string, number> = {};
      earnings.forEach(e => {
        const day = new Date(e.createdAt!).toLocaleDateString("en-IN", { weekday: "short" });
        dailyMap[day] = (dailyMap[day] || 0) + e.netEarnings;
      });

      // Weekly trend
      const weeklyMap: Record<string, number> = {};
      earnings.forEach(e => {
        const week = `Week ${Math.ceil(new Date(e.createdAt!).getDate() / 7)}`;
        weeklyMap[week] = (weeklyMap[week] || 0) + e.netEarnings;
      });

      res.json({
        summary: {
          totalGross: parseFloat(summary.total.toFixed(2)),
          totalCommission: parseFloat(summary.commission.toFixed(2)),
          totalNet: parseFloat(summary.net.toFixed(2)),
          totalBonus: parseFloat(summary.bonus.toFixed(2)),
          totalRides: summary.count,
          avgPerRide: summary.count > 0 ? parseFloat((summary.net / summary.count).toFixed(2)) : 0,
        },
        earnings,
        dailyBreakdown: Object.entries(dailyMap).map(([day, amount]) => ({ day, amount: parseFloat(amount.toFixed(2)) })),
        weeklyBreakdown: Object.entries(weeklyMap).map(([week, amount]) => ({ week, amount: parseFloat(amount.toFixed(2)) })),
        completedRides: completed.length,
      });
    } catch (e) {
      console.error("Earnings error:", e);
      res.status(500).json({ message: "Failed to load earnings" });
    }
  });

  // ============================================
  // GPS SIMULATION (enhanced tracking with interpolation)
  // ============================================
  app.get("/api/rides/:id/gps", async (req, res) => {
    try {
      const ride = await storage.getRide(Number(req.params.id));
      if (!ride) return res.status(404).json({ message: "Ride not found" });

      const zones = await storage.getZones();
      const pickupZone = zones.find(z => z.name === ride.pickupAddress);
      const dropZone = zones.find(z => z.name === ride.dropAddress);

      if (!pickupZone || !dropZone) {
        return res.json({ coordinates: [], status: ride.status });
      }

      // Calculate elapsed time since ride status changed
      const elapsed = (Date.now() - new Date(ride.createdAt!).getTime()) / 1000;
      const totalDuration = (ride.predictedDuration || 30) * 60; // in seconds

      let progress = 0;
      if (ride.status === "accepted") {
        // Driver approaching pickup — simulate 0-20% progress
        progress = Math.min(0.2, elapsed / (totalDuration * 0.3));
      } else if (ride.status === "in_progress") {
        // Ride in progress — simulate 20-100%
        progress = 0.2 + Math.min(0.8, elapsed / totalDuration * 0.8);
      } else if (ride.status === "completed") {
        progress = 1;
      }

      // Generate intermediate GPS points along the route with slight randomness
      const numPoints = 20;
      const coordinates = [];
      for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        if (t > progress) break;
        
        // Linear interpolation with slight noise for realism
        const noise = () => (Math.random() - 0.5) * 0.002;
        coordinates.push({
          lat: pickupZone.lat + (dropZone.lat - pickupZone.lat) * t + noise(),
          lng: pickupZone.lng + (dropZone.lng - pickupZone.lng) * t + noise(),
          timestamp: new Date(new Date(ride.createdAt!).getTime() + t * totalDuration * 1000).toISOString(),
        });
      }

      // Current driver position (last point)
      const currentPos = coordinates.length > 0 ? coordinates[coordinates.length - 1] : { lat: pickupZone.lat, lng: pickupZone.lng };

      // Speed estimation
      const distanceCovered = ride.distanceKm * progress;
      const remainingKm = ride.distanceKm - distanceCovered;
      const avgSpeedKmh = 25 + Math.random() * 15; // 25-40 km/h in city
      const etaMinutes = remainingKm > 0 ? (remainingKm / avgSpeedKmh) * 60 : 0;

      res.json({
        status: ride.status,
        progress: parseFloat(progress.toFixed(3)),
        currentPosition: currentPos,
        coordinates,
        eta: parseFloat(etaMinutes.toFixed(1)),
        speed: parseFloat(avgSpeedKmh.toFixed(1)),
        distanceCovered: parseFloat(distanceCovered.toFixed(2)),
        remainingKm: parseFloat(remainingKm.toFixed(2)),
        heading: Math.atan2(
          dropZone.lng - pickupZone.lng,
          dropZone.lat - pickupZone.lat
        ) * (180 / Math.PI),
      });
    } catch (e) {
      console.error("GPS error:", e);
      res.status(500).json({ message: "Failed to get GPS data" });
    }
  });

  return httpServer;
}
