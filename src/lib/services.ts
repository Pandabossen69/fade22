import type { Service, ServiceId } from "./types";

export const services: Service[] = [
  { id: "thai", nameTh: "ตัดผม คนไทย", nameEn: "Haircut · Thai", priceThb: 120, durationMin: 30, slotCount: 1 },
  { id: "foreigner", nameTh: "ตัดผม ต่างชาติ", nameEn: "Haircut · Foreigner", priceThb: 150, durationMin: 30, slotCount: 1 },
  { id: "kids", nameTh: "ตัดผมเด็ก", nameEn: "Kids cut", priceThb: 100, durationMin: 25, slotCount: 1 },
  { id: "wash", nameTh: "สระ+เซ็ต", nameEn: "Wash & style", priceThb: 80, durationMin: 15, slotCount: 1 },
];

export function getService(id: string): Service | null {
  return services.find((s) => s.id === id) ?? null;
}

export function isServiceId(id: string): id is ServiceId {
  return services.some((s) => s.id === id);
}
