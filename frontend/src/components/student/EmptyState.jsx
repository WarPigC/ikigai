import React from "react";

export default function EmptyState({ hasFilters }) {
  return (
    <div className="p-6 bg-white border border-dashed border-purple-200 rounded-xl text-center text-gray-500 mt-4">
      {hasFilters 
        ? "No participants match your search criteria." 
        : "No participants have been added to this track yet."}
    </div>
  );
}
