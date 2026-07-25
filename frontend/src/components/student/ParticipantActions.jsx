import React from "react";

export default function ParticipantActions({ participant, proofStatus, onEdit, onPreview, onDelete, onProofUpload, onViewProof, onDownloadProof }) {
  const hasProof = !!proofStatus;

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-6 w-full">
      
      {/* Proof Block */}
      <div className="w-full md:w-auto">
        <div className="w-full md:w-[160px] rounded-lg border bg-white px-2 py-2 space-y-1">
          <div className={`text-[11px] font-semibold ${hasProof ? "text-green-700" : "text-gray-500"}`}>
            {hasProof ? "✔ Proof Uploaded" : "⏳ Proof Pending"}
          </div>

          <button
            onClick={() => onProofUpload(participant)}
            className="w-full px-2 py-1 rounded bg-green-100 text-green-700 text-[11px] font-semibold hover:bg-purple-200 transition"
          >
            {hasProof ? "Re-upload" : "Upload"}
          </button>

          {hasProof && (
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => onViewProof(proofStatus.url)}
                className="px-1 py-0.5 rounded bg-green-100 text-green-700 text-[11px] font-semibold hover:bg-green-200 transition"
              >
                View
              </button>
              <button
                onClick={() => onDownloadProof(proofStatus.url, participant.paperId)}
                className="px-1 py-0.5 rounded bg-green-50 text-green-700 text-[11px] font-semibold hover:bg-green-100 transition"
              >
                Download
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Other Actions */}
      <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
        <button
          onClick={() => onEdit(participant)}
          className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition"
        >
          ✏️ Edit
        </button>

        <button
          onClick={() => onPreview(participant)}
          className="px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition"
        >
          👁 Preview
        </button>

        <button
          onClick={() => onDelete(participant)}
          className="px-2 py-1 rounded-md bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition"
        >
          🗑 Delete
        </button>
      </div>

    </div>
  );
}
