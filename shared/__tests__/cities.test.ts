import { describe, it, expect } from "vitest";
import { INDIAN_CITIES, getCityInfo, CITY_LIST, getCityZones, type City } from "../cities";

describe("Indian Cities Data", () => {
  it("has 7 cities", () => {
    expect(Object.keys(INDIAN_CITIES).length).toBe(7);
  });

  it("all cities have zones", () => {
    for (const [key, city] of Object.entries(INDIAN_CITIES) as [string, City][]) {
      expect(city.zones.length).toBeGreaterThan(0);
      expect(city.displayName).toBeTruthy();
      expect(city.baseFare).toBeGreaterThan(0);
      expect(city.ratePerKm).toBeGreaterThan(0);
    }
  });

  it("all zones have valid coordinates", () => {
    for (const city of Object.values(INDIAN_CITIES) as City[]) {
      for (const zone of city.zones) {
        expect(zone.lat).toBeGreaterThan(0);
        expect(zone.lng).toBeGreaterThan(0);
        expect(zone.name).toBeTruthy();
      }
    }
  });

  it("getCityInfo returns correct city", () => {
    const delhi = getCityInfo("delhi");
    expect(delhi.displayName).toBe("Delhi NCR");
    expect(delhi.baseFare).toBe(30);
  });

  it("getCityInfo defaults to Delhi for unknown city", () => {
    const unknown = getCityInfo("atlantis");
    expect(unknown.displayName).toBe("Delhi NCR");
  });

  it("CITY_LIST has all cities", () => {
    expect(CITY_LIST.length).toBe(7);
    expect(CITY_LIST.map((c: { key: string }) => c.key)).toContain("delhi");
    expect(CITY_LIST.map((c: { key: string }) => c.key)).toContain("mumbai");
  });

  it("getCityZones returns zones for valid city", () => {
    const zones = getCityZones("mumbai");
    expect(zones.length).toBeGreaterThan(0);
    expect(zones[0].name).toBeTruthy();
  });
});
