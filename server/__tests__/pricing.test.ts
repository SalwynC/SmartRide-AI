import { describe, it, expect } from "vitest";

// Test the Haversine distance calculation (same formula used in server/routes.ts)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateFairnessScore(surge: number, waitTime: number): number {
  const score = 10 - (surge - 1) * 5 - (waitTime / 10);
  return Math.max(1, Math.min(10, score));
}

function calculateCarbon(distance: number): number {
  return distance * 0.12;
}

function predictWaitTime(demand: number, supply: number): number {
  const ratio = demand / (supply || 1);
  return Math.min(15, 2 + ratio * 3);
}

function calculateCancellationProb(waitTime: number, surge: number): number {
  return Math.min(0.9, (waitTime * 0.05) + ((surge - 1) * 0.2));
}

describe("Haversine Distance", () => {
  it("calculates distance between Connaught Place and Hauz Khas correctly", () => {
    const dist = calculateDistance(28.6315, 77.2167, 28.5494, 77.1960);
    expect(dist).toBeGreaterThan(8);
    expect(dist).toBeLessThan(12);
  });

  it("returns 0 for same coordinates", () => {
    const dist = calculateDistance(28.6315, 77.2167, 28.6315, 77.2167);
    expect(dist).toBeCloseTo(0, 5);
  });

  it("handles cross-city distances", () => {
    // Delhi to Mumbai (roughly 1,140 km)
    const dist = calculateDistance(28.6139, 77.2090, 19.0760, 72.8777);
    expect(dist).toBeGreaterThan(1000);
    expect(dist).toBeLessThan(1300);
  });
});

describe("Fairness Score", () => {
  it("gives perfect score with no surge and low wait", () => {
    const score = calculateFairnessScore(1.0, 0);
    expect(score).toBe(10);
  });

  it("decreases with higher surge", () => {
    const base = calculateFairnessScore(1.0, 5);
    const high = calculateFairnessScore(2.0, 5);
    expect(high).toBeLessThan(base);
  });

  it("clamps to minimum of 1", () => {
    const score = calculateFairnessScore(3.0, 100);
    expect(score).toBe(1);
  });
});

describe("Carbon Emissions", () => {
  it("calculates correctly at 0.12 kg/km", () => {
    expect(calculateCarbon(10)).toBeCloseTo(1.2);
    expect(calculateCarbon(0)).toBe(0);
    expect(calculateCarbon(25)).toBeCloseTo(3.0);
  });
});

describe("Wait Time Prediction", () => {
  it("returns minimum ~2 mins with low demand", () => {
    const wait = predictWaitTime(10, 30);
    expect(wait).toBeGreaterThanOrEqual(2);
    expect(wait).toBeLessThan(5);
  });

  it("caps at 15 mins with extreme demand", () => {
    const wait = predictWaitTime(1000, 1);
    expect(wait).toBe(15);
  });

  it("handles zero supply without crashing", () => {
    const wait = predictWaitTime(100, 0);
    expect(wait).toBe(15);
  });
});

describe("Cancellation Probability", () => {
  it("stays below 0.9", () => {
    const prob = calculateCancellationProb(100, 5);
    expect(prob).toBeLessThanOrEqual(0.9);
  });

  it("increases with surge", () => {
    const low = calculateCancellationProb(5, 1.0);
    const high = calculateCancellationProb(5, 2.0);
    expect(high).toBeGreaterThan(low);
  });
});
