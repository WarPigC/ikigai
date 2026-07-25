import React from "react";

export default function LoadingState() {
  return (
    <div className="p-6 bg-white border border-dashed border-purple-200 rounded-xl text-center text-gray-500 mt-4">
      <span className="animate-pulse">Loading participants...</span>
    </div>
  );
}
