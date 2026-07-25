import React from "react";
import ParticipantPaperBadge from "./ParticipantPaperBadge";
import ParticipantModeBadge from "./ParticipantModeBadge";
import ParticipantActions from "./ParticipantActions";
import { studentApi } from "../../services/studentApi";

export default function ParticipantRow({ index, participant, proofStatus, onPreview, onEdit, onDelete, onProofUpload }) {
  const handleViewProof = async (url) => {
    const res = await studentApi.viewProof(url);
    if (!res.success) {
      alert(res.message);
    }
  };

  const handleDownloadProof = async (url, paperId) => {
    const res = await studentApi.downloadProof(url, paperId);
    if (!res.success) {
      alert(res.message);
    }
  };

  return (
    <div className="border rounded-md p-3 bg-green-50 flex justify-between">
      <div className="grid grid-cols-1 md:grid-cols-[40px_90px_140px_240px_160px_80px_auto] gap-2 text-sm items-center w-full">
        
        {/* Mobile: S.no + Paper ID */}
        <div className="flex items-center gap-3 md:hidden">
          <span className="font-semibold">{index + 1}.</span>
          <ParticipantPaperBadge paperId={participant.paperId} />
        </div>

        {/* Desktop Layout Elements */}
        <div className="font-semibold hidden md:block">{index + 1}</div>
        
        <div className="hidden md:block">
          <ParticipantPaperBadge paperId={participant.paperId} />
        </div>

        <div className="font-medium break-words">{participant.presenterName}</div>
        <div className="break-words">{participant.paperTitle}</div>
        <div className="break-words">{participant.institute}</div>

        <div>
          <ParticipantModeBadge mode={participant.mode} />
        </div>

        <ParticipantActions 
          participant={participant}
          proofStatus={proofStatus}
          onEdit={() => onEdit()}
          onPreview={() => onPreview()}
          onDelete={() => onDelete()}
          onProofUpload={() => onProofUpload()}
          onViewProof={handleViewProof}
          onDownloadProof={handleDownloadProof}
        />

      </div>
    </div>
  );
}
