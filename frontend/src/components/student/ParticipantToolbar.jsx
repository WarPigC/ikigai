import React from "react";

export default function ParticipantToolbar({ search, setSearch, modeFilter, setModeFilter, sortBy, setSortBy, onAddParticipant }) {
  return (
    <div className="flex flex-wrap gap-3 items-center my-4">
      
      {/* Search */}
      <input
        type="text"
        placeholder="Search by Paper ID or Presenter"
        className="border rounded-md px-3 py-2 text-sm w-64"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Filter */}
      <select
        className="border rounded-md px-3 py-2 text-sm"
        value={modeFilter}
        onChange={(e) => setModeFilter(e.target.value)}
      >
        <option value="">All Modes</option>
        <option value="Online">Online</option>
        <option value="Offline">Offline</option>
      </select>

      {/* Sort */}
      <select
        className="border rounded-md px-3 py-2 text-sm"
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
      >
        <option value="">Sort by</option>
        <option value="presenter">Sort by Presenter</option>
        <option value="institute">Sort by Institute</option>
      </select>

    </div>
  );
}
