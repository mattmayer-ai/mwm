import { useFiltersStore } from '../stores/filters.store';
import * as Select from '@radix-ui/react-select';
import { ChevronDown } from 'lucide-react';

interface FilterBarProps {
  availableRoles: string[];
  availableIndustries: string[];
  availableSkills: string[];
  availableYears: number[];
}

export function FilterBar({
  availableRoles,
  availableIndustries,
  availableYears,
}: FilterBarProps) {
  const { filters, setRole, setIndustry, setYear, clearFilters } = useFiltersStore();

  const hasActiveFilters =
    filters.role || filters.industry || filters.skills.length > 0 || filters.year;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <Select.Root value={filters.role || '__all__'} onValueChange={(value) => setRole(value === '__all__' ? undefined : value)}>
          <Select.Trigger className="inline-flex items-center justify-between px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md min-w-[120px]">
            <Select.Value placeholder="Role" />
            <Select.Icon>
              <ChevronDown className="w-4 h-4" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50">
              <Select.Viewport className="p-1">
                <Select.Item value="__all__" className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                  <Select.ItemText>All Roles</Select.ItemText>
                </Select.Item>
                {availableRoles.map((role) => (
                  <Select.Item
                    key={role}
                    value={role}
                    className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                  >
                    <Select.ItemText>{role}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>

        <Select.Root
          value={filters.industry || '__all__'}
          onValueChange={(value) => setIndustry(value === '__all__' ? undefined : value)}
        >
          <Select.Trigger className="inline-flex items-center justify-between px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md min-w-[120px]">
            <Select.Value placeholder="Industry" />
            <Select.Icon>
              <ChevronDown className="w-4 h-4" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50">
              <Select.Viewport className="p-1">
                <Select.Item value="__all__" className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                  <Select.ItemText>All Industries</Select.ItemText>
                </Select.Item>
                {availableIndustries.map((industry) => (
                  <Select.Item
                    key={industry}
                    value={industry}
                    className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                  >
                    <Select.ItemText>{industry}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>

        <Select.Root
          value={filters.year?.toString() || '__all__'}
          onValueChange={(value) => setYear(value === '__all__' ? undefined : parseInt(value, 10))}
        >
          <Select.Trigger className="inline-flex items-center justify-between px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md min-w-[100px]">
            <Select.Value placeholder="Year" />
            <Select.Icon>
              <ChevronDown className="w-4 h-4" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50">
              <Select.Viewport className="p-1">
                <Select.Item value="__all__" className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                  <Select.ItemText>All Years</Select.ItemText>
                </Select.Item>
                {availableYears.map((year) => (
                  <Select.Item
                    key={year}
                    value={year.toString()}
                    className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                  >
                    <Select.ItemText>{year}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

