import React, { useState } from "react";
import { studentApi } from "../../services/studentApi";

export default function DeleteParticipantModal({ isOpen, onClose, participant, onSuccess }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !participant) return null;

  const handleClose = () => {
    if (!isDeleting) {
      setError(null);
      onClose();
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await studentApi.deleteParticipant(participant._id);
      if (res.success) {
        onSuccess();
        onClose(); // Reset state via unmount / parent
      } else {
        setError(res.message || "Failed to delete participant.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error occurred while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
        <h2 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          Confirm Deletion
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <p className="text-gray-700 mb-4">
          Are you sure you want to permanently delete this participant? This action cannot be undone.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="text-sm">
            <span className="font-semibold text-gray-500">Presenter:</span>{" "}
            <span className="font-bold text-gray-800">{participant.presenterName}</span>
          </div>
          <div className="text-sm mt-2">
            <span className="font-semibold text-gray-500">Paper ID:</span>{" "}
            <span className="font-mono text-gray-800 bg-gray-200 px-2 py-0.5 rounded">{participant.paperId}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button 
            onClick={handleClose} 
            disabled={isDeleting}
            className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:bg-red-400 flex items-center gap-2"
          >
            {isDeleting ? "Deleting..." : "Yes, Delete Participant"}
          </button>
        </div>
      </div>
    </div>
  );
}
