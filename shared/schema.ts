import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import chat models from the blueprint-generated file
export * from "./models/chat";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email"),
  password: text("password").notNull(), // Hashed password
  role: text("role", { enum: ["passenger", "driver", "admin"] }).default("passenger").notNull(),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  phoneNumber: text("phone_number"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const zones = pgTable("zones", {
  id: serial("id").primaryKey(),
  city: text("city").notNull().default("Delhi NCR"), // City name
  name: text("name").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  demandScore: real("demand_score").default(0), // 0-10
  trafficIndex: real("traffic_index").default(0), // 0-10
  availableDrivers: integer("available_drivers").default(0),
});

export const rides = pgTable("rides", {
  id: serial("id").primaryKey(),
  passengerId: integer("passenger_id").notNull(), // Foreign key to users
  driverId: integer("driver_id"), // Nullable until matched
  
  pickupAddress: text("pickup_address").notNull(),
  dropAddress: text("drop_address").notNull(),
  
  distanceKm: real("distance_km").notNull(),
  
  // AI/ML Predictions
  predictedWaitTime: real("predicted_wait_time"), // Minutes
  predictedDuration: real("predicted_duration"), // Minutes
  cancellationProb: real("cancellation_prob"), // 0-1
  carbonEmissions: real("carbon_emissions"), // kg CO2
  
  // Pricing
  baseFare: real("base_fare").notNull(),
  surgeMultiplier: real("surge_multiplier").default(1.0),
  finalFare: real("final_fare").notNull(),
  pricingFairnessScore: real("pricing_fairness_score"), // 0-10
  
  status: text("status", { enum: ["pending", "accepted", "in_progress", "completed", "cancelled"] }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const usersRelations = relations(users, ({ many }) => ({
  ridesAsPassenger: many(rides, { relationName: "passengerRides" }),
  ridesAsDriver: many(rides, { relationName: "driverRides" }),
}));

export const ridesRelations = relations(rides, ({ one }) => ({
  passenger: one(users, {
    fields: [rides.passengerId],
    references: [users.id],
    relationName: "passengerRides",
  }),
  driver: one(users, {
    fields: [rides.driverId],
    references: [users.id],
    relationName: "driverRides",
  }),
}));

// === BASE SCHEMAS ===
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertZoneSchema = createInsertSchema(zones).omit({ id: true });
export const insertRideSchema = createInsertSchema(rides).omit({ 
  id: true, 
  createdAt: true, 
  status: true,
  // These are calculated by backend/AI, usually not sent by client directly in creation
  predictedWaitTime: true,
  predictedDuration: true,
  cancellationProb: true,
  carbonEmissions: true,
  surgeMultiplier: true,
  finalFare: true,
  pricingFairnessScore: true,
  driverId: true
});

// === EXPLICIT API CONTRACT TYPES ===

// User types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginRequest = Pick<InsertUser, "username" | "password">;

// Zone types
export type Zone = typeof zones.$inferSelect;
export type InsertZone = z.infer<typeof insertZoneSchema>;

// Ride types
export type Ride = typeof rides.$inferSelect;
export type InsertRide = z.infer<typeof insertRideSchema>;

// Booking Request (Input from frontend form)
export const bookingRequestSchema = z.object({
  pickupAddress: z.string().min(1, "Pickup address is required"),
  dropAddress: z.string().min(1, "Drop address is required"),
  distanceKm: z.number().positive("Distance must be positive"),
  passengerId: z.number(),
  // Optional overrides for simulation
  simulatedTraffic: z.number().min(0).max(10).optional(),
  simulatedPeak: z.boolean().optional(),
});
export type BookingRequest = z.infer<typeof bookingRequestSchema>;

// AI Prediction Response (Pre-booking details)
export interface RideQuote {
  distanceKm: number;
  predictedWaitTime: number; // mins
  predictedDuration: number; // mins
  baseFare: number;
  surgeMultiplier: number;
  finalFare: number;
  carbonEmissions: number; // grams or kg
  cancellationProb: number;
  fairnessScore: number;
  trafficIndex: number;
  isPeak: boolean;
}

// Stats for Admin
export interface AdminStats {
  totalRides: number;
  activeDrivers: number;
  avgSurge: number;
  avgWaitTime: number;
  revenue: number;
  zoneStats: Zone[];
}
