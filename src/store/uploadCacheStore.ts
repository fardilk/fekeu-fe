import { create } from 'zustand';

interface UploadCacheState {
  file: File | null;
  setFile: (file: File | null) => void;
  clear: () => void;
}

export const useUploadCacheStore = create<UploadCacheState>((set) => ({
  file: null,
  setFile: (file) => set({ file }),
  clear: () => set({ file: null }),
}));
