"use client";

import { useState, useMemo, useEffect, useCallback } from "react";

interface UseFilterOptions<T extends string = string> {
  filters: { key: T; label: string }[];
  defaultFilter?: T;
  items: any[];
  searchFields?: string[];
  perPage?: number;
}

interface UseFilterResult<T extends string = string> {
  filter: T;
  setFilter: (key: T) => void;
  search: string;
  setSearch: (value: string) => void;
  page: number;
  setPage: (page: number) => void;
  filteredItems: any[];
  paginatedItems: any[];
  totalPages: number;
  totalItems: number;
  counts: Record<T, number>;
  reset: () => void;
}

/**
 * Reusable hook for filter + search + pagination logic.
 *
 * @example
 * const { filter, setFilter, search, setSearch, page, paginatedItems, counts } = useFilter({
 *   filters: [
 *     { key: 'all', label: 'All' },
 *     { key: 'active', label: 'Active' },
 *   ],
 *   items: clients,
 *   searchFields: ['name', 'email'],
 *   perPage: 8,
 * });
 */
export function useFilter<T extends string = string>({
  filters,
  defaultFilter,
  items,
  searchFields = ["name"],
  perPage = 8,
}: UseFilterOptions<T>): UseFilterResult<T> {
  const [filter, setFilterState] = useState<T>(defaultFilter ?? (filters[0]?.key as T));
  const [search, setSearchState] = useState("");
  const [page, setPageState] = useState(1);

  const setFilter = useCallback(
    (key: T) => {
      setFilterState(key);
      setPageState(1);
    },
    [],
  );

  const setSearch = useCallback(
    (value: string) => {
      setSearchState(value);
      setPageState(1);
    },
    [],
  );

  const setPage = useCallback((p: number) => {
    setPageState(p);
  }, []);

  // Search filter
  const searchedItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      searchFields.some((field) => {
        const val = item?.[field];
        if (typeof val === "string") return val.toLowerCase().includes(term);
        return false;
      }),
    );
  }, [items, search, searchFields]);

  // Count per filter key — computed BEFORE the active filter is applied
  const counts = useMemo(() => {
    const result = {} as Record<T, number>;
    for (const f of filters) {
      result[f.key] = searchedItems.length;
    }
    return result;
  }, [searchedItems, filters]);

  const filteredItems = searchedItems;
  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredItems.slice(start, start + perPage);
  }, [filteredItems, page, perPage]);

  const reset = useCallback(() => {
    setFilterState(defaultFilter ?? (filters[0]?.key as T));
    setSearchState("");
    setPageState(1);
  }, [defaultFilter, filters]);

  // Clamp page if data shrinks
  useEffect(() => {
    if (page > totalPages) setPageState(totalPages);
  }, [page, totalPages]);

  return {
    filter,
    setFilter,
    search,
    setSearch,
    page,
    setPage,
    filteredItems,
    paginatedItems,
    totalPages,
    totalItems,
    counts,
    reset,
  };
}
