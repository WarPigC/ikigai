import React from 'react';

export default function PreviewSection({ title, children }) {
  return (
    <div className="mb-6 border border-green-100 rounded-lg p-4 bg-green-50/30">
      <h3 className="text-sm font-bold text-green-700 uppercase tracking-wider mb-4 border-b border-green-200 pb-2">
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

export function PreviewField({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500 font-semibold">{label}</div>
      <div className="text-sm font-medium text-gray-800 break-words mt-1">
        {value || "N/A"}
      </div>
    </div>
  );
}
