import { z } from 'zod';
import { 
  insertUserSchema, 
  users, 
  rides, 
  zones, 
  bookingRequestSchema 
} from './schema';

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
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.validation, // Invalid credentials
      },
    },
    register: {
      method: 'POST' as const,
      path: '/api/users/register' as const,
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
        method: 'GET' as const,
        path: '/api/users/:id' as const,
        responses: {
            200: z.custom<typeof users.$inferSelect>(),
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
        200: z.array(z.custom<typeof zones.$inferSelect>()),
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
        200: z.custom<{
          distanceKm: number;
          predictedWaitTime: number;
          predictedDuration: number;
          baseFare: number;
          surgeMultiplier: number;
          finalFare: number;
          carbonEmissions: number;
          cancellationProb: number;
          fairnessScore: number;
          trafficIndex: number;
          isPeak: boolean;
        }>(),
      },
    },
    // 2. Confirm Booking
    create: {
      method: 'POST' as const,
      path: '/api/rides' as const,
      input: bookingRequestSchema, // Re-send the request to finalize
      responses: {
        201: z.custom<typeof rides.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    // 3. List Rides (Passenger History)
    list: {
      method: 'GET' as const,
      path: '/api/rides' as const,
      input: z.object({ userId: z.coerce.number() }).optional(), // Filter by user
      responses: {
        200: z.array(z.custom<typeof rides.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/rides/:id' as const,
      responses: {
        200: z.custom<typeof rides.$inferSelect>(),
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
        200: z.custom<{
          totalRides: number;
          activeDrivers: number;
          avgSurge: number;
          avgWaitTime: number;
          revenue: number;
          zoneStats: typeof zones.$inferSelect[];
        }>(),
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
