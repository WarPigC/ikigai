import React from "react";

export default function ParticipantPaperBadge({ paperId }) {
  return (
    <span
      className="inline-flex items-center justify-center px-2 py-1 w-8 h-8 md:w-auto md:h-auto rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold whitespace-nowrap"
      title="Paper ID"
    >
      {paperId}
    </span>
  );
}
