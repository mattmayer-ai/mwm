import { create } from 'zustand';
import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

export interface ProjectFilters {
  role?: string;
  industry?: string;
  skills: string[];
  year?: number;
}

interface FiltersStore {
  filters: ProjectFilters;
  setRole: (role?: string) => void;
  setIndustry: (industry?: string) => void;
  setSkills: (skills: string[]) => void;
  setYear: (year?: number) => void;
  clearFilters: () => void;
  syncFromURL: (searchParams: URLSearchParams) => void;
  toURLParams: () => URLSearchParams;
}

const defaultFilters: ProjectFilters = {
  skills: [],
};

export const useFiltersStore = create<FiltersStore>((set, get) => ({
  filters: defaultFilters,

  setRole: (role) => {
    set((state) => ({
      filters: { ...state.filters, role: role || undefined },
    }));
  },

  setIndustry: (industry) => {
    set((state) => ({
      filters: { ...state.filters, industry: industry || undefined },
    }));
  },

  setSkills: (skills) => {
    set((state) => ({
      filters: { ...state.filters, skills },
    }));
  },

  setYear: (year) => {
    set((state) => ({
      filters: { ...state.filters, year: year || undefined },
    }));
  },

  clearFilters: () => {
    set({ filters: defaultFilters });
  },

  syncFromURL: (searchParams: URLSearchParams) => {
    const filters: ProjectFilters = {
      role: searchParams.get('role') || undefined,
      industry: searchParams.get('industry') || undefined,
      skills: searchParams.get('skills')?.split(',').filter(Boolean) || [],
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined,
    };
    set({ filters });
  },

  toURLParams: () => {
    const { filters } = get();
    const params = new URLSearchParams();
    
    if (filters.role) params.set('role', filters.role);
    if (filters.industry) params.set('industry', filters.industry);
    if (filters.skills.length > 0) params.set('skills', filters.skills.join(','));
    if (filters.year) params.set('year', filters.year.toString());
    
    return params;
  },
}));

/**
 * Hook to sync filters with URL
 */
export function useFiltersFromURL() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { syncFromURL, toURLParams } = useFiltersStore();

  // Sync from URL on mount
  useEffect(() => {
    syncFromURL(searchParams);
  }, []); // Only on mount

  // Update URL when filters change (debounced)
  const { filters } = useFiltersStore();
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newParams = toURLParams();
      setSearchParams(newParams, { replace: true });
    }, 150); // 150ms debounce

    return () => clearTimeout(timeoutId);
  }, [filters, toURLParams, setSearchParams]);
}

