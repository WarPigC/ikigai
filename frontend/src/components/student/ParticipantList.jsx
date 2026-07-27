import React, { useState } from "react";
import { Plus, Users } from "lucide-react";
import ParticipantRow from "./ParticipantRow";
import AddParticipantModal from "./AddParticipantModal";
import EditParticipantModal from "./EditParticipantModal";
import CsvUpload from "./CsvUpload";
import { useParticipants } from "../../hooks/useParticipants";
import { studentApi } from "../../services/studentApi";

export default function ParticipantList({ 
  eventId, 
  trackId, 
  allEvents 
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  
  const { participants, loading, refresh } = useParticipants(eventId, trackId);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this participant?")) {
      await studentApi.deleteParticipant(id);
      refresh();
    }
  };

  const onSuccess = () => refresh();

  if (loading) return <div>Loading participants...</div>;
  if (!participants) return null;

  return (
    <div className="space-y-6">
      {/* CSV Upload Section */}
      <CsvUpload eventId={eventId} allEvents={allEvents} onSuccess={onSuccess} />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Teams & Participants</h2>
              <p className="text-sm text-gray-500">Manage hackathon teams and members</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsAddModalOpen(true)} 
            className="px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center justify-center font-medium shadow-sm transition-colors text-sm w-full sm:w-auto"
          >
            <Plus size={18} className="mr-2" /> Add Team
          </button>
        </div>
        
        <div className="p-4 md:p-6 bg-gray-50 min-h-[400px]">
          {participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <Users size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No teams found</h3>
              <p className="text-gray-500 text-sm max-w-sm">Get started by creating a new team or uploading a CSV file with team data.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {participants.map((participant, index) => (
                <ParticipantRow 
                  key={participant._id} 
                  participant={participant} 
                  index={index}
                  onEdit={setEditingParticipant}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddParticipantModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        eventId={eventId}
        trackId={trackId}
        allEvents={allEvents}
        onSuccess={onSuccess}
      />

      <EditParticipantModal 
        isOpen={!!editingParticipant} 
        onClose={() => setEditingParticipant(null)} 
        participant={editingParticipant}
        eventId={eventId}
        allEvents={allEvents}
        onSuccess={onSuccess}
      />
    </div>
  );
}
