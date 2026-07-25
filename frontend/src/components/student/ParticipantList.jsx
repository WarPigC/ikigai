import React from "react";
import ParticipantToolbar from "./ParticipantToolbar";
import ParticipantRow from "./ParticipantRow";
import EmptyState from "./EmptyState";

import LoadingState from "./LoadingState";
import PreviewModal from "./PreviewModal";
import AddParticipantModal from "./AddParticipantModal";
import EditParticipantModal from "./EditParticipantModal";
import DeleteParticipantModal from "./DeleteParticipantModal";
import ProofUploadModal from "./ProofUploadModal";
import { useParticipants } from "../../hooks/useParticipants";
import { useParticipantFilters } from "../../hooks/useParticipantFilters";

export default function ParticipantList({ eventId, trackId }) {
  // Fetch logic is abstracted into hooks, preventing render loops
  const { participants, proofs, loading, error, refresh } = useParticipants(eventId, trackId);
  
  // Filter/Sort logic is abstracted into a dedicated hook
  const {
    search,
    setSearch,
    modeFilter,
    setModeFilter,
    sortBy,
    setSortBy,
    filteredParticipants,
  } = useParticipantFilters(participants);

  const [previewParticipant, setPreviewParticipant] = React.useState(null);
  const [editParticipant, setEditParticipant] = React.useState(null);
  const [deleteParticipant, setDeleteParticipant] = React.useState(null);
  const [uploadProofParticipant, setUploadProofParticipant] = React.useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  if (error) {
    return <div className="text-red-500 p-4 border rounded-md mt-4">{error}</div>;
  }

  const handleAddParticipant = () => {
    setIsAddModalOpen(true);
  };

  return (
    <>
      <ParticipantToolbar 
        search={search}
        setSearch={setSearch}
        modeFilter={modeFilter}
        setModeFilter={setModeFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onAddParticipant={handleAddParticipant}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-4">
        <div className="relative">
          {/* TABLE HEADER */}
          <div className="hidden md:grid grid-cols-[40px_90px_160px_240px_160px_80px_auto] gap-2 text-xs font-semibold text-gray-600 border-b pb-2">
            <div>S.no</div>
            <div>Paper ID</div>
            <div>Presenter</div>
            <div>Paper Title</div>
            <div>Institute</div>
            <div>Mode</div>
            <div>Actions</div>
          </div>

          {/* ADD PARTICIPANT BUTTON */}
          <button
            onClick={handleAddParticipant}
            className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center bg-green-600 text-white rounded-lg text-lg font-bold hover:bg-green-700 transition"
            title="Add Participant"
          >
            +
          </button>
        </div>

        {/* LIST RENDERER */}
        <div className="mt-4 space-y-3">
          {loading ? (
            <LoadingState />
          ) : filteredParticipants.length === 0 ? (
            <EmptyState hasFilters={participants.length > 0} />
          ) : (
            filteredParticipants.map((p, index) => (
              <ParticipantRow 
                key={p._id} 
                index={index} 
                participant={p} 
                proofStatus={proofs[p._id]}
                onPreview={() => setPreviewParticipant(p)} 
                onEdit={() => setEditParticipant(p)}
                onDelete={() => setDeleteParticipant(p)}
                onProofUpload={() => setUploadProofParticipant(p)}
              />
            ))
          )}
        </div>
      </div>

      <PreviewModal 
        participant={previewParticipant} 
        onClose={() => setPreviewParticipant(null)} 
      />

      <AddParticipantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        eventId={eventId}
        trackId={trackId}
        onSuccess={refresh}
      />

      <EditParticipantModal
        isOpen={!!editParticipant}
        onClose={() => setEditParticipant(null)}
        eventId={eventId}
        trackId={trackId}
        participant={editParticipant}
        onSuccess={refresh}
      />

      <DeleteParticipantModal
        isOpen={!!deleteParticipant}
        onClose={() => setDeleteParticipant(null)}
        participant={deleteParticipant}
        onSuccess={refresh}
      />

      <ProofUploadModal
        isOpen={!!uploadProofParticipant}
        onClose={() => setUploadProofParticipant(null)}
        participant={uploadProofParticipant}
        eventId={eventId}
        trackId={trackId}
        onSuccess={refresh}
      />
    </>
  );
}
