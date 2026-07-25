import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { studentApi } from "../../services/studentApi";

export default function EditParticipantModal({ isOpen, onClose, participant, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [teamDetails, setTeamDetails] = useState({
    teamName: "",
    problemStatement: "",
    description: "",
    pptLink: "",
  });

  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (participant) {
      setTeamDetails({
        teamName: participant.teamName || "",
        problemStatement: participant.problemStatement || "",
        description: participant.description || "",
        pptLink: participant.pptLink || "",
      });
      setMembers(participant.members?.length ? [...participant.members] : []);
    }
  }, [participant]);

  if (!isOpen) return null;

  const handleAddMember = () => {
    setMembers([
      ...members,
      {
        name: "",
        gender: "Male",
        institute: "",
        branch: "",
        year: "",
        phone: "",
        email: "",
        isLeader: members.length === 0,
      }
    ]);
  };

  const handleRemoveMember = (index) => {
    const newMembers = [...members];
    if (newMembers[index].isLeader && newMembers.length > 1) {
      const otherIndex = index === 0 ? 1 : 0;
      newMembers[otherIndex].isLeader = true;
    }
    newMembers.splice(index, 1);
    setMembers(newMembers);
  };

  const handleMemberChange = (index, field, value) => {
    const newMembers = [...members];
    if (field === "isLeader" && value === true) {
      newMembers.forEach(m => m.isLeader = false);
    }
    newMembers[index][field] = value;
    setMembers(newMembers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const incomplete = members.some(m => !m.name || !m.email);
    if (incomplete) {
      setError("Please provide at least Name and Email for all members");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await studentApi.updateParticipant(participant._id, {
        ...teamDetails,
        members
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update participant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800">Edit Participant</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              <span className="font-medium">Error:</span> {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm border-b pb-2">Team Details</h3>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Team Name</label>
                <input type="text" required value={teamDetails.teamName} onChange={e => setTeamDetails({...teamDetails, teamName: e.target.value})} className="w-full border border-gray-200 rounded text-sm px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Problem Statement</label>
                <input type="text" value={teamDetails.problemStatement} onChange={e => setTeamDetails({...teamDetails, problemStatement: e.target.value})} className="w-full border border-gray-200 rounded text-sm px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Description</label>
                <textarea rows="3" value={teamDetails.description} onChange={e => setTeamDetails({...teamDetails, description: e.target.value})} className="w-full border border-gray-200 rounded text-sm px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">PPT Link</label>
                <input type="url" value={teamDetails.pptLink} onChange={e => setTeamDetails({...teamDetails, pptLink: e.target.value})} className="w-full border border-gray-200 rounded text-sm px-3 py-2" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm border-b pb-2">Members</h3>
              <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                {members.map((member, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50 relative text-sm">
                    <div className="flex justify-between items-center mb-2">
                      <label className="flex items-center gap-2 font-medium text-gray-700">
                        <input type="radio" checked={member.isLeader} onChange={() => handleMemberChange(index, "isLeader", true)} />
                        Leader
                      </label>
                      <button type="button" onClick={() => handleRemoveMember(index)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Name" value={member.name} onChange={e => handleMemberChange(index, "name", e.target.value)} className="border border-gray-200 rounded px-2 py-1" required />
                      <input type="email" placeholder="Email" value={member.email} onChange={e => handleMemberChange(index, "email", e.target.value)} className="border border-gray-200 rounded px-2 py-1" required />
                      <input type="text" placeholder="Institute" value={member.institute} onChange={e => handleMemberChange(index, "institute", e.target.value)} className="border border-gray-200 rounded px-2 py-1" />
                      <input type="text" placeholder="Branch" value={member.branch} onChange={e => handleMemberChange(index, "branch", e.target.value)} className="border border-gray-200 rounded px-2 py-1" />
                    </div>
                  </div>
                ))}
                <button type="button" onClick={handleAddMember} className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-gray-500 flex items-center justify-center">
                  <Plus size={16} className="mr-1" /> Add Member
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={loading} className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
