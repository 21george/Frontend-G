import { useState, useMemo, useCallback } from "react";

interface UseClientSideFilterOptions<T> {
  data: T[];
  searchFn?: (item: T, query: string) => boolean;
  filterFn?: (item: T, filterKey: string) => boolean;
  perPage?: number;
}

interface UseClientSideFilterReturn<T> {
  paginatedData: T[];
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  totalItems: number;
  search: string;
  setSearch: (value: string) => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

export function useClientSideFilter<T>({
  data,
  searchFn,
  filterFn,
  perPage = 8,
}: UseClientSideFilterOptions<T>): UseClientSideFilterReturn<T> {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const handleSetSearch = useCallback(
    (value: string) => {
      setSearch(value);
      setPage(1);
    },
    [],
  );

  const handleSetFilter = useCallback(
    (filter: string) => {
      setActiveFilter(filter);
      setPage(1);
    },
    [],
  );

  const filtered = useMemo(() => {
    let items = data;

    if (activeFilter !== "all" && filterFn) {
      items = items.filter((item) => filterFn(item, activeFilter));
    }

    if (search.trim() && searchFn) {
      const q = search.trim().toLowerCase();
      items = items.filter((item) => searchFn(item, q));
    }

    return items;
  }, [data, search, activeFilter, searchFn, filterFn]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  const paginatedData = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  return {
    paginatedData,
    page,
    setPage,
    totalPages,
    totalItems,
    search,
    setSearch: handleSetSearch,
    activeFilter,
    setActiveFilter: handleSetFilter,
  };
}
