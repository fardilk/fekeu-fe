import { create } from 'zustand';

type UIState = {
  uploading: boolean;
  setUploading: (v: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  uploading: false,
  setUploading: (v: boolean) => set({ uploading: v }),
}));

export default useUIStore;
