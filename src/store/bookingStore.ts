'use client';

import { create } from 'zustand';

interface BookingState {
  centerId: string | null;
  serviceId: string | null;
  slotId: string | null;
  vehicleId: string | null;
  setCenter: (id: string) => void;
  setService: (id: string) => void;
  setSlot: (id: string) => void;
  setVehicle: (id: string) => void;
  reset: () => void;
}

export const useBookingStore = create<BookingState>()((set) => ({
  centerId: null,
  serviceId: null,
  slotId: null,
  vehicleId: null,
  setCenter: (centerId) => set({ centerId }),
  setService: (serviceId) => set({ serviceId }),
  setSlot: (slotId) => set({ slotId }),
  setVehicle: (vehicleId) => set({ vehicleId }),
  reset: () => set({ centerId: null, serviceId: null, slotId: null, vehicleId: null }),
}));
