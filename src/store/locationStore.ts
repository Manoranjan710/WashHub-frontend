'use client';

import { create } from 'zustand';

type PermissionStatus = 'prompt' | 'granted' | 'denied';

interface LocationState {
  lat: number | null;
  lng: number | null;
  permission: PermissionStatus;
  setLocation: (lat: number, lng: number) => void;
  setPermission: (status: PermissionStatus) => void;
}

export const useLocationStore = create<LocationState>()((set) => ({
  lat: null,
  lng: null,
  permission: 'prompt',
  setLocation: (lat, lng) => set({ lat, lng, permission: 'granted' }),
  setPermission: (permission) => set({ permission }),
}));
