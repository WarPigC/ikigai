import { useState, useMemo } from "react";

export function useParticipantFilters(participants) {
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [sortBy, setSortBy] = useState("");

  const filteredParticipants = useMemo(() => {
    let result = [...participants];

    // Search
    const query = search.toLowerCase();
    if (query) {
      result = result.filter(
        (d) =>
          d.paperId?.toLowerCase().includes(query) ||
          d.presenterName?.toLowerCase().includes(query)
      );
    }

    // Mode Filter
    if (modeFilter) {
      result = result.filter((d) => d.mode === modeFilter);
    }

    // Sort
    if (sortBy === "presenter") {
      result.sort((a, b) =>
        (a.presenterName || "").localeCompare(b.presenterName || "")
      );
    } else if (sortBy === "institute") {
      result.sort((a, b) =>
        (a.institute || "").localeCompare(b.institute || "")
      );
    }

    return result;
  }, [participants, search, modeFilter, sortBy]);

  return {
    search,
    setSearch,
    modeFilter,
    setModeFilter,
    sortBy,
    setSortBy,
    filteredParticipants,
  };
}
