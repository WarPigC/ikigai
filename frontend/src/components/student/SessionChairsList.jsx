import React from "react";
import SessionChairCard from "./SessionChairCard";

export default function SessionChairsList({ chairs }) {
  if (!chairs || chairs.length === 0) {
    return <div id="sessionChairsBlock" className="hidden" />;
  }

  return (
    <div className="flex flex-col">
      <h3 className="text-sm font-semibold text-green-700 mb-2 text-center">
        Session Chairs
      </h3>
      <div className="flex gap-3 flex-wrap justify-center items-start">
        {chairs.map((chair, idx) => (
          <SessionChairCard key={idx} chair={chair} />
        ))}
      </div>
    </div>
  );
}
