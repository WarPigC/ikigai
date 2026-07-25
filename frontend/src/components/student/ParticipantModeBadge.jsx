import React from "react";

export default function ParticipantModeBadge({ mode }) {
  const isOnline = mode === "Online";
  const badgeClass = isOnline
    ? "bg-green-100 text-green-700"
    : "bg-blue-100 text-blue-700";

  return (
    <span className={`${badgeClass} px-2 py-1 rounded-full text-xs font-semibold`}>
      {mode}
    </span>
  );
}
