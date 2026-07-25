import React from 'react';

export default function SubmissionLink({ link }) {
  if (!link) {
    return (
      <div className="md:col-span-2">
        <div className="text-xs text-gray-500 font-semibold">Submission Link</div>
        <div className="text-sm font-medium text-gray-500 italic mt-1">No link provided</div>
      </div>
    );
  }

  return (
    <div className="md:col-span-2">
      <div className="text-xs text-gray-500 font-semibold">Submission Link</div>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 mt-1 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-md transition-colors break-all"
      >
        <span>📂</span> {link}
      </a>
    </div>
  );
}
