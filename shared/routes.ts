import { z } from "zod";

const roleSchema = z.enum(["passenger", "driver", "admin"]);

const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  password: z.string(),
  role: roleSchema,
  createdAt: z.union([z.string(), z.date()]).optional().nullable(),
});

const zoneSchema = z.object({
  id: z.number(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  demandScore: z.number().optional().nullable(),
  trafficIndex: z.number().optional().nullable(),
  availableDrivers: z.number().optional().nullable(),
});

const rideStatusSchema = z.enum([
  "pending",
  "accepted",
  "in_progress",
  "completed",
  "cancelled",
]);

const rideSchema = z.object({
  id: z.number(),
  passengerId: z.number(),
  driverId: z.number().optional().nullable(),
  pickupAddress: z.string(),
  dropAddress: z.string(),
  distanceKm: z.number(),
  predictedWaitTime: z.number().optional().nullable(),
  predictedDuration: z.number().optional().nullable(),
  cancellationProb: z.number().optional().nullable(),
  carbonEmissions: z.number().optional().nullable(),
  baseFare: z.number(),
  surgeMultiplier: z.number().optional().nullable(),
  finalFare: z.number(),
  pricingFairnessScore: z.number().optional().nullable(),
  status: rideStatusSchema.optional().nullable(),
  createdAt: z.union([z.string(), z.date()]).optional().nullable(),
});

export const bookingRequestSchema = z.object({
  pickupAddress: z.string().min(1, "Pickup address is required"),
  dropAddress: z.string().min(1, "Drop address is required"),
  distanceKm: z.number().positive("Distance must be positive"),
  passengerId: z.number(),
  simulatedTraffic: z.number().min(0).max(10).optional(),
  simulatedPeak: z.boolean().optional(),
});

export type BookingRequest = z.infer<typeof bookingRequestSchema>;

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  // --- USERS / AUTH (Simple simulation) ---
  users: {
    login: {
      method: 'POST' as const,
      path: '/api/users/login' as const,
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: userSchema,
        401: errorSchemas.validation, // Invalid credentials
      },
    },
    register: {
      method: 'POST' as const,
      path: '/api/users/register' as const,
      input: z.object({
        username: z.string().min(1),
        password: z.string().min(1),
        role: roleSchema.optional(),
      }),
      responses: {
        201: userSchema,
        400: errorSchemas.validation,
      },
    },
    get: {
        method: 'GET' as const,
        path: '/api/users/:id' as const,
        responses: {
            200: userSchema,
            404: errorSchemas.notFound
        }
    }
  },

  // --- ZONES (Driver Dashboard / Heatmap) ---
  zones: {
    list: {
      method: 'GET' as const,
      path: '/api/zones' as const,
      responses: {
        200: z.array(zoneSchema),
      },
    },
  },

  // --- RIDES (Booking & History) ---
  rides: {
    // 1. Get a Quote (AI Prediction)
    predict: {
      method: 'POST' as const,
      path: '/api/rides/predict' as const,
      input: bookingRequestSchema,
      responses: {
        200: z.object({
          distanceKm: z.number(),
          predictedWaitTime: z.number(),
          predictedDuration: z.number(),
          baseFare: z.number(),
          surgeMultiplier: z.number(),
          finalFare: z.number(),
          carbonEmissions: z.number(),
          cancellationProb: z.number(),
          fairnessScore: z.number(),
          trafficIndex: z.number(),
          isPeak: z.boolean(),
        }),
      },
    },
    // 2. Confirm Booking
    create: {
      method: 'POST' as const,
      path: '/api/rides' as const,
      input: bookingRequestSchema, // Re-send the request to finalize
      responses: {
        201: rideSchema,
        400: errorSchemas.validation,
      },
    },
    // 3. List Rides (Passenger History)
    list: {
      method: 'GET' as const,
      path: '/api/rides' as const,
      input: z.object({ userId: z.coerce.number() }).optional(), // Filter by user
      responses: {
        200: z.array(rideSchema),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/rides/:id' as const,
      responses: {
        200: rideSchema,
        404: errorSchemas.notFound,
      },
    },
  },

  // --- ADMIN ---
  admin: {
    stats: {
      method: 'GET' as const,
      path: '/api/admin/stats' as const,
      responses: {
        200: z.object({
          totalRides: z.number(),
          activeDrivers: z.number(),
          avgSurge: z.number(),
          avgWaitTime: z.number(),
          revenue: z.number(),
          zoneStats: z.array(zoneSchema),
        }),
      },
    },
  },
};

// ============================================
// HELPER
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
