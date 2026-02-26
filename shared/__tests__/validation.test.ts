import { describe, it, expect } from "vitest";
import { bookingRequestSchema } from "../routes";

describe("Booking Request Validation", () => {
  it("accepts valid booking data", () => {
    const data = {
      pickupAddress: "Connaught Place",
      dropAddress: "Hauz Khas",
      distanceKm: 9.35,
      passengerId: 1,
    };
    const result = bookingRequestSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects empty pickup address", () => {
    const data = {
      pickupAddress: "",
      dropAddress: "Hauz Khas",
      distanceKm: 5,
      passengerId: 1,
    };
    const result = bookingRequestSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects negative distance", () => {
    const data = {
      pickupAddress: "A",
      dropAddress: "B",
      distanceKm: -1,
      passengerId: 1,
    };
    const result = bookingRequestSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("accepts optional simulation fields", () => {
    const data = {
      pickupAddress: "Bandra West",
      dropAddress: "Colaba",
      distanceKm: 15,
      passengerId: 2,
      simulatedTraffic: 7,
      simulatedPeak: true,
    };
    const result = bookingRequestSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.simulatedTraffic).toBe(7);
      expect(result.data.simulatedPeak).toBe(true);
    }
  });

  it("rejects traffic above 10", () => {
    const data = {
      pickupAddress: "A",
      dropAddress: "B",
      distanceKm: 5,
      passengerId: 1,
      simulatedTraffic: 15,
    };
    const result = bookingRequestSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
