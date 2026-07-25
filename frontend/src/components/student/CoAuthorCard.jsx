import React from 'react';

export default function CoAuthorCard({ author, index }) {
  return (
    <div className="p-3 bg-white border border-purple-100 rounded-lg shadow-sm">
      <div className="text-xs font-bold text-purple-600 mb-1">
        Co-Author {index + 1}
      </div>
      <div className="text-sm font-semibold">{author.name || "N/A"}</div>
      <div className="text-xs text-gray-600 mt-1 flex flex-col gap-1">
        <span>📧 {author.email || "N/A"}</span>
      </div>
    </div>
  );
}
