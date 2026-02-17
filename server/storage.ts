import { db } from "./db";
import {
  users,
  rides,
  zones,
  conversations,
  messages,
  type User,
  type InsertUser,
  type Ride,
  type InsertRide,
  type Zone,
  type InsertZone,
  type Conversation,
  type Message
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  
  // Rides
  getRide(id: number): Promise<Ride | undefined>;
  getRidesByUser(userId: number): Promise<Ride[]>;
  createRide(ride: InsertRide): Promise<Ride>;
  updateRideStatus(id: number, status: string): Promise<Ride>;
  getAllRides(): Promise<Ride[]>; // For admin stats
  
  // Zones
  getZones(): Promise<Zone[]>;
  getZone(id: number): Promise<Zone | undefined>;
  createZone(zone: InsertZone): Promise<Zone>;
  updateZoneStats(id: number, demandScore: number, trafficIndex: number): Promise<Zone>;
}

export class DatabaseStorage implements IStorage {
  // --- Users ---
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // --- Rides ---
  async getRide(id: number): Promise<Ride | undefined> {
    const [ride] = await db.select().from(rides).where(eq(rides.id, id));
    return ride;
  }

  async getRidesByUser(userId: number): Promise<Ride[]> {
    return db
      .select()
      .from(rides)
      .where(eq(rides.passengerId, userId))
      .orderBy(desc(rides.createdAt));
  }

  async createRide(insertRide: InsertRide): Promise<Ride> {
    const [ride] = await db.insert(rides).values(insertRide).returning();
    return ride;
  }

  async updateRideStatus(id: number, status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled"): Promise<Ride> {
    const [ride] = await db
      .update(rides)
      .set({ status })
      .where(eq(rides.id, id))
      .returning();
    return ride;
  }
  
  async getAllRides(): Promise<Ride[]> {
      return db.select().from(rides).orderBy(desc(rides.createdAt));
  }

  // --- Zones ---
  async getZones(): Promise<Zone[]> {
    return db.select().from(zones);
  }

  async getZone(id: number): Promise<Zone | undefined> {
    const [zone] = await db.select().from(zones).where(eq(zones.id, id));
    return zone;
  }

  async createZone(insertZone: InsertZone): Promise<Zone> {
    const [zone] = await db.insert(zones).values(insertZone).returning();
    return zone;
  }

  async updateZoneStats(id: number, demandScore: number, trafficIndex: number): Promise<Zone> {
    const [zone] = await db
      .update(zones)
      .set({ demandScore, trafficIndex })
      .where(eq(zones.id, id))
      .returning();
    return zone;
  }
}

export const storage = new DatabaseStorage();
