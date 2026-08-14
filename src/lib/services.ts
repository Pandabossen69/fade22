import type { Service, ServiceId } from "./types";

export const services: Service[] = [
  { id: "fade", nameTh: "เฟด", nameEn: "Fade", priceThb: 200, durationMin: 30, slotCount: 1 },
  { id: "fade-beard", nameTh: "เฟด+เครา", nameEn: "Fade + Beard", priceThb: 300, durationMin: 45, slotCount: 2 },
  { id: "kids", nameTh: "ตัดผมเด็ก", nameEn: "Kids Cut", priceThb: 150, durationMin: 25, slotCount: 1 },
  { id: "beard", nameTh: "โกนหนวดแต่งเครา", nameEn: "Beard Trim", priceThb: 100, durationMin: 20, slotCount: 1 },
  { id: "wash", nameTh: "สระ+เซ็ต", nameEn: "Wash & Style", priceThb: 80, durationMin: 15, slotCount: 1 },
];

export function getService(id: string): Service | null {
  return services.find((s) => s.id === id) ?? null;
}

export function isServiceId(id: string): id is ServiceId {
  return services.some((s) => s.id === id);
}
