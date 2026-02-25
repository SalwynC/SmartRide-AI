import { db } from "./db";
import {
  users,
  rides,
  zones,
  ratings,
  notifications,
  payments,
  conversations,
  messages,
  type User,
  type InsertUser,
  type Ride,
  type InsertRide,
  type Zone,
  type InsertZone,
  type Rating,
  type InsertRating,
  type Notification,
  type InsertNotification,
  type Payment,
  type InsertPayment,
  type Conversation,
  type Message
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

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
  getAllRides(): Promise<Ride[]>;
  
  // Zones
  getZones(): Promise<Zone[]>;
  getZone(id: number): Promise<Zone | undefined>;
  createZone(zone: InsertZone): Promise<Zone>;
  updateZoneStats(id: number, demandScore: number, trafficIndex: number): Promise<Zone>;

  // Ratings
  createRating(rating: InsertRating): Promise<Rating>;
  getRatingsByRide(rideId: number): Promise<Rating[]>;
  getRatingsByDriver(driverId: number): Promise<Rating[]>;
  getAverageRating(driverId: number): Promise<number>;

  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  markNotificationRead(id: number): Promise<Notification>;
  markAllRead(userId: number): Promise<void>;
  getUnreadCount(userId: number): Promise<number>;

  // Payments
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentByRide(rideId: number): Promise<Payment | undefined>;
  getPaymentsByUser(userId: number): Promise<Payment[]>;
  updatePaymentStatus(id: number, status: string, transactionId?: string): Promise<Payment>;
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

  // --- Ratings ---
  async createRating(insertRating: InsertRating): Promise<Rating> {
    const [rating] = await db.insert(ratings).values(insertRating).returning();
    return rating;
  }

  async getRatingsByRide(rideId: number): Promise<Rating[]> {
    return db.select().from(ratings).where(eq(ratings.rideId, rideId));
  }

  async getRatingsByDriver(driverId: number): Promise<Rating[]> {
    return db.select().from(ratings).where(eq(ratings.driverId, driverId)).orderBy(desc(ratings.createdAt));
  }

  async getAverageRating(driverId: number): Promise<number> {
    const driverRatings = await this.getRatingsByDriver(driverId);
    if (driverRatings.length === 0) return 5.0;
    const total = driverRatings.reduce((sum, r) => sum + r.stars, 0);
    return total / driverRatings.length;
  }

  // --- Notifications ---
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async markNotificationRead(id: number): Promise<Notification> {
    const [notification] = await db.update(notifications).set({ read: true }).where(eq(notifications.id, id)).returning();
    return notification;
  }

  async markAllRead(userId: number): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
  }

  async getUnreadCount(userId: number): Promise<number> {
    const unread = await db.select().from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return unread.length;
  }

  // --- Payments ---
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(insertPayment).returning();
    return payment;
  }

  async getPaymentByRide(rideId: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.rideId, rideId));
    return payment;
  }

  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
  }

  async updatePaymentStatus(id: number, status: "pending" | "completed" | "failed" | "refunded", transactionId?: string): Promise<Payment> {
    const update: any = { status };
    if (transactionId) update.transactionId = transactionId;
    const [payment] = await db.update(payments).set(update).where(eq(payments.id, id)).returning();
    return payment;
  }
}

export const storage = new DatabaseStorage();
