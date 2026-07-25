import React from "react";

export default function SessionChairCard({ chair }) {
  const badgeColor = chair.type === "Internal" 
    ? "bg-blue-100 text-blue-700" 
    : "bg-green-100 text-green-700";

  return (
    <div className="border rounded-xl px-5 py-1 bg-green-50">
      <div className="font-semibold text-gray-800">{chair.name}</div>
      <div className="text-sm text-gray-600 mt-1">📧 {chair.email}</div>
      <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
        {chair.type} Chair
      </div>
    </div>
  );
}
