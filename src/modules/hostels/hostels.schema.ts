import { z } from 'zod';

const facilitiesSchema = z.object({
  hotColdWaterBath: z.boolean().default(false),
  drinkingWater: z.boolean().default(false),
  electricityBackup: z.boolean().default(false),
  electricityType: z.enum(['INCLUDED', 'SELF']).default('INCLUDED'),
  electricityRatePerUnit: z.number().nullable().optional(),
  wifiEnabled: z.boolean().default(false),
  wifiPlan: z.string().nullable().optional(),
  wifiMaxUsers: z.number().nullable().optional(),
  wifiAvgSpeed: z.string().nullable().optional(),
  customFacilities: z.array(z.string()).default([]),
});

export const createHostelSchema = z.object({
  hostelName: z.string().min(1),
  city: z.string().min(1),
  address: z.string().min(1),
  nearbyLocations: z.array(z.string()).default([]),
  totalRooms: z.number().int().positive(),
  hostelType: z.enum(['SHARED', 'PRIVATE', 'SHARED_FULLROOM']),
  hostelFor: z.enum(['BOYS', 'GIRLS']),
  personsInRoom: z.number().int().positive(),
  roomPrice: z.number().nullable().optional(),
  pricePerHeadShared: z.number().nullable().optional(),
  pricePerHeadFullRoom: z.number().nullable().optional(),
  fullRoomPriceDiscounted: z.number().nullable().optional(),
  facilities: facilitiesSchema,
  roomImages: z.array(z.string().url()).min(1).max(10),
  rules: z.string().optional(),
  seoKeywords: z.array(z.string()).default([]),
}).refine(data => {
  if (data.hostelType === 'PRIVATE' && !data.roomPrice) {
    return false;
  }
  if (data.hostelType === 'SHARED' && !data.pricePerHeadShared) {
    return false;
  }
  if (data.hostelType === 'SHARED_FULLROOM' && !data.pricePerHeadFullRoom) {
    return false;
  }
  return true;
}, {
  message: 'Price fields must match hostel type',
});

export const updateHostelSchema = createHostelSchema.partial();

export const searchHostelsSchema = z.object({
  city: z.string().optional(),
  nearbyLocation: z.string().optional(),
  hostelType: z.enum(['SHARED', 'PRIVATE', 'SHARED_FULLROOM']).optional(),
  hostelFor: z.enum(['BOYS', 'GIRLS']).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
});

export type CreateHostelInput = z.infer<typeof createHostelSchema>;
export type UpdateHostelInput = z.infer<typeof updateHostelSchema>;
export type SearchHostelsInput = z.infer<typeof searchHostelsSchema>;