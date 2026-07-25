import React, { useState, useEffect } from "react";
import { studentApi } from "../../services/studentApi";

export default function ProofUploadModal({ isOpen, onClose, participant, eventId, trackId, onSuccess }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Clear state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setPreviewUrl(null);
      setError(null);
      setIsUploading(false);
    }
  }, [isOpen]);

  if (!isOpen || !participant) return null;

  const handleClose = () => {
    if (isUploading) return;
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    onClose();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError(null);

    if (!selectedFile) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setError("Invalid file type. Please select an image.");
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const removeImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an image before uploading.");
      return;
    }
    
    if (isUploading) return;
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("proofImage", file);
    formData.append("participantId", participant._id);
    formData.append("paperId", participant.paperId);
    formData.append("eventId", eventId);
    formData.append("trackId", trackId);
    formData.append("uploadedBy", sessionStorage.getItem("care_email"));

    try {
      const res = await studentApi.uploadProof(formData);
      if (res.success) {
        onSuccess();
        handleClose();
      } else {
        setError(res.message || "Failed to upload proof.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error occurred while uploading.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border p-6">
        <h3 className="text-lg font-semibold text-purple-700 mb-4">
          Upload Presentation Proof
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Paper ID (Read-only) */}
          <div>
            <label className="text-sm font-medium text-gray-700">Paper ID</label>
            <input
              type="text"
              disabled
              value={participant.paperId}
              className="w-full mt-1 border rounded-md px-3 py-2 bg-gray-100 text-sm cursor-not-allowed text-gray-500"
            />
          </div>

          {/* Validation Error */}
          {error && (
            <div className="p-2 bg-red-100 text-red-700 border border-red-400 rounded text-sm">
              {error}
            </div>
          )}

          {/* Upload Input */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Upload Proof (Camera / Gallery)
            </label>
            {!file ? (
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="w-full mt-1 border border-dashed rounded-md px-3 py-2 text-sm cursor-pointer bg-gray-50 hover:bg-gray-100"
              />
            ) : (
              <div className="mt-1 flex items-center justify-between border rounded-md px-3 py-2 bg-gray-50">
                <span className="text-sm text-gray-600 truncate mr-2">{file.name}</span>
                <button
                  type="button"
                  onClick={removeImage}
                  className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              You can directly click from camera or select from gallery
            </p>
          </div>

          {/* Image Preview */}
          {previewUrl && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Preview</p>
              <img
                src={previewUrl}
                alt="Proof Preview"
                className="w-full max-h-64 object-contain rounded-lg border shadow-sm"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !file}
              className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition disabled:bg-purple-400 flex items-center gap-2"
            >
              {isUploading ? "Uploading..." : "Upload Proof"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
