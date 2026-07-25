import React, { useState, useRef } from "react";

export default function MeetingLink({ initialLink, eventId, trackId, onUpdateLink }) {
  const [isEditing, setIsEditing] = useState(false);
  const [link, setLink] = useState(initialLink || "");
  const [isUpdating, setIsUpdating] = useState(false);
  
  const inputRef = useRef(null);

  const enableEdit = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleUpdate = async () => {
    if (!link.trim()) return;
    
    setIsUpdating(true);
    try {
      await onUpdateLink(link.trim());
      setIsEditing(false);
    } catch (err) {
      alert("Failed to update meeting link");
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mt-4">
      <label className="block text-sm font-semibold text-purple-700 mb-1">
        Online Presentation Meeting Link
      </label>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          readOnly={!isEditing}
          className={`flex-1 border rounded-md px-3 py-2 text-sm ${
            isEditing ? "bg-white" : "bg-gray-100 cursor-not-allowed"
          }`}
        />

        {!isEditing ? (
          <button
            type="button"
            onClick={enableEdit}
            className="px-4 py-2 border rounded-md text-sm"
          >
            Edit
          </button>
        ) : (
          <button
            type="button"
            onClick={handleUpdate}
            disabled={isUpdating}
            className="px-4 py-2 bg-purple-700 text-white rounded-md text-sm"
          >
            {isUpdating ? "Updating..." : "Update"}
          </button>
        )}
      </div>
    </div>
  );
}
