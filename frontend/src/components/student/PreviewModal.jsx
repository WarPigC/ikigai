import React from 'react';
import PreviewSection, { PreviewField } from './PreviewSection';
import CoAuthorCard from './CoAuthorCard';
import SubmissionLink from './SubmissionLink';
import ParticipantModeBadge from './ParticipantModeBadge';
import ParticipantPaperBadge from './ParticipantPaperBadge';

export default function PreviewModal({ participant, onClose }) {
  if (!participant) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-xl z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-800">Participant Details</h2>
            <ParticipantPaperBadge paperId={participant.paperId} />
            <ParticipantModeBadge mode={participant.mode} />
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          <PreviewSection title="Presenter Information">
            <PreviewField label="Name" value={participant.presenterName} />
            <PreviewField label="Email" value={participant.email} />
            <PreviewField label="Phone" value={participant.phone} />
            <PreviewField label="Institute" value={participant.institute} />
            <PreviewField label="Branch" value={participant.branch} />
          </PreviewSection>

          <PreviewSection title="Paper Details">
            <div className="md:col-span-2">
              <PreviewField label="Problem Statement" value={participant.problemStatement} />
            </div>
            <SubmissionLink link={participant.submissionLink} />
          </PreviewSection>

          {participant.coAuthors && participant.coAuthors.length > 0 && (
            <PreviewSection title={`Co-Authors (${participant.coAuthors.length})`}>
              {participant.coAuthors.map((author, idx) => (
                <CoAuthorCard key={idx} author={author} index={idx} />
              ))}
            </PreviewSection>
          )}

        </div>
      </div>
    </div>
  );
}
