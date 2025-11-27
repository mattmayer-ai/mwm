import { create } from 'zustand';
import type { Project } from '@lib/projects';

export type ArtifactType = 'portfolio' | 'experience';

export interface ExperienceItem {
  company: string;
  range: string;
  role: string;
  copy: string[];
}

export interface Artifact {
  id: string;
  type: ArtifactType;
  data: Project | ExperienceItem;
  position: { x: number; y: number };
  visible: boolean;
  zIndex: number;
  createdAt: number;
}

interface ArtifactsState {
  artifacts: Artifact[];
  addArtifact: (artifact: Omit<Artifact, 'id' | 'createdAt'>) => void;
  removeArtifact: (id: string) => void;
  updateArtifactPosition: (id: string, position: { x: number; y: number }) => void;
  toggleArtifactVisibility: (id: string) => void;
  clearAllArtifacts: () => void;
  loadArtifacts: () => void;
}

const STORAGE_KEY = 'mwm-canvas-artifacts';
const MAX_ARTIFACTS = 20;

function generateId(): string {
  return `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useArtifactsStore = create<ArtifactsState>((set, get) => ({
  artifacts: [],

  loadArtifacts: () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Artifact[];
        set({ artifacts: parsed });
      }
    } catch (error) {
      console.error('Failed to load artifacts from localStorage:', error);
    }
  },

  addArtifact: (artifactData) => {
    const { artifacts } = get();
    if (artifacts.length >= MAX_ARTIFACTS) {
      console.warn(`Maximum artifacts limit (${MAX_ARTIFACTS}) reached`);
      return;
    }

    const newArtifact: Artifact = {
      ...artifactData,
      id: generateId(),
      createdAt: Date.now(),
    };

    const updated = [...artifacts, newArtifact];
    set({ artifacts: updated });

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save artifacts to localStorage:', error);
      }
    }
  },

  removeArtifact: (id) => {
    const { artifacts } = get();
    const updated = artifacts.filter((a) => a.id !== id);
    set({ artifacts: updated });

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save artifacts to localStorage:', error);
      }
    }
  },

  updateArtifactPosition: (id, position) => {
    const { artifacts } = get();
    const updated = artifacts.map((a) =>
      a.id === id ? { ...a, position } : a
    );
    set({ artifacts: updated });

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save artifacts to localStorage:', error);
      }
    }
  },

  toggleArtifactVisibility: (id) => {
    const { artifacts } = get();
    const updated = artifacts.map((a) =>
      a.id === id ? { ...a, visible: !a.visible } : a
    );
    set({ artifacts: updated });

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save artifacts to localStorage:', error);
      }
    }
  },

  clearAllArtifacts: () => {
    set({ artifacts: [] });
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error('Failed to clear artifacts from localStorage:', error);
      }
    }
  },
}));

// Load artifacts on module initialization
if (typeof window !== 'undefined') {
  useArtifactsStore.getState().loadArtifacts();
}

