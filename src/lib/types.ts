export type Lang = "th" | "en";

export type ServiceId = "thai" | "foreigner" | "kids" | "wash";

export type Service = {
  id: ServiceId;
  nameTh: string;
  nameEn: string;
  priceThb: number;
  durationMin: number;
  slotCount: number;
};

export type Booking = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  serviceId: ServiceId;
  date: string;
  time: string;
  slotStarts: string[];
  notes: string;
};

export type BookingInput = {
  name: string;
  phone: string;
  serviceId: ServiceId;
  date: string;
  time: string;
  notes: string;
};
