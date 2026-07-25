import React, { useState } from "react";
import { X, Plus, Trash2, ArrowRight, ArrowLeft } from "lucide-react";
import { studentApi } from "../../services/studentApi";

export default function AddParticipantModal({ isOpen, onClose, eventId, trackId, allEvents, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const isGlobal = eventId === "global";
  const finalEventId = isGlobal ? selectedEventId : eventId;
  const finalTrackId = isGlobal ? selectedTrackId : trackId;

  const [teamDetails, setTeamDetails] = useState({
    teamName: "",
    problemStatement: "",
    description: "",
    pptLink: "",
  });

  const [members, setMembers] = useState([
    {
      name: "",
      gender: "Male",
      institute: "",
      branch: "",
      year: "",
      phone: "",
      email: "",
      isLeader: true, // first member is leader by default
    }
  ]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (isGlobal && (!selectedEventId || !selectedTrackId)) {
      setError("Please select Event and Track");
      return;
    }
    if (!teamDetails.teamName) {
      setError("Please provide a Team Name");
      return;
    }
    setError(null);
    setStep(2);
  };

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
        isLeader: false,
      }
    ]);
  };

  const handleRemoveMember = (index) => {
    const newMembers = [...members];
    if (newMembers[index].isLeader && newMembers.length > 1) {
      // If removing leader, make someone else leader
      const otherIndex = index === 0 ? 1 : 0;
      newMembers[otherIndex].isLeader = true;
    }
    newMembers.splice(index, 1);
    setMembers(newMembers);
  };

  const handleMemberChange = (index, field, value) => {
    const newMembers = [...members];
    if (field === "isLeader" && value === true) {
      // Only one leader allowed
      newMembers.forEach(m => m.isLeader = false);
    }
    newMembers[index][field] = value;
    setMembers(newMembers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!finalEventId || !finalTrackId) {
      setError("Event or Track is missing");
      return;
    }

    // Validate members
    const incomplete = members.some(m => !m.name || !m.email);
    if (incomplete) {
      setError("Please provide at least Name and Email for all members");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await studentApi.addParticipant(finalEventId, finalTrackId, {
        ...teamDetails,
        members
      });
      setTeamDetails({ teamName: "", problemStatement: "", description: "", pptLink: "" });
      setMembers([{ name: "", gender: "Male", institute: "", branch: "", year: "", phone: "", email: "", isLeader: true }]);
      setStep(1);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to add participant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800">
            {step === 1 ? "Step 1: Team Details" : "Step 2: Team Members"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-start gap-3">
              <span className="font-medium mt-0.5">Error:</span> {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              {isGlobal && (
                <div className="border border-gray-200 rounded-lg p-4 bg-green-50 mb-6">
                  <h3 className="text-sm font-bold text-green-700 uppercase tracking-wider mb-4 border-b border-gray-300 pb-2">
                    Global Assignment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Event *</label>
                      <select 
                        value={selectedEventId} 
                        onChange={e => { setSelectedEventId(e.target.value); setSelectedTrackId(""); }} 
                        className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-gray-800/20 focus:border-gray-800"
                      >
                        <option value="">-- Select Event --</option>
                        {(allEvents || []).map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Track *</label>
                      <select 
                        value={selectedTrackId} 
                        onChange={e => setSelectedTrackId(e.target.value)} 
                        className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-gray-800/20 focus:border-gray-800"
                      >
                        <option value="">-- Select Track --</option>
                        {selectedEventId && (allEvents || []).find(ev => String(ev._id) === String(selectedEventId))?.tracks?.map(t => (
                          <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
                  <input type="text" required value={teamDetails.teamName} onChange={e => setTeamDetails({...teamDetails, teamName: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-gray-800/20 focus:border-gray-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Problem Statement</label>
                  <input type="text" value={teamDetails.problemStatement} onChange={e => setTeamDetails({...teamDetails, problemStatement: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-gray-800/20 focus:border-gray-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows="3" value={teamDetails.description} onChange={e => setTeamDetails({...teamDetails, description: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-gray-800/20 focus:border-gray-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Presentation Link (Cloudinary/Drive)</label>
                  <input type="url" value={teamDetails.pptLink} onChange={e => setTeamDetails({...teamDetails, pptLink: e.target.value})} placeholder="https://..." className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-gray-800/20 focus:border-gray-800" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {members.map((member, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 relative">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-gray-700">Member {index + 1}</h4>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <input 
                          type="radio" 
                          name="leader" 
                          checked={member.isLeader}
                          onChange={() => handleMemberChange(index, "isLeader", true)}
                          className="text-green-600 focus:ring-green-500"
                        />
                        Team Leader
                      </label>
                      {members.length > 1 && (
                        <button type="button" onClick={() => handleRemoveMember(index)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Name *</label>
                      <input type="text" value={member.name} onChange={e => handleMemberChange(index, "name", e.target.value)} className="w-full border border-gray-200 rounded text-sm px-2 py-1.5 focus:border-gray-800 focus:ring-0" required />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Email *</label>
                      <input type="email" value={member.email} onChange={e => handleMemberChange(index, "email", e.target.value)} className="w-full border border-gray-200 rounded text-sm px-2 py-1.5 focus:border-gray-800 focus:ring-0" required />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Phone</label>
                      <input type="tel" value={member.phone} onChange={e => handleMemberChange(index, "phone", e.target.value)} className="w-full border border-gray-200 rounded text-sm px-2 py-1.5 focus:border-gray-800 focus:ring-0" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Gender</label>
                      <select value={member.gender} onChange={e => handleMemberChange(index, "gender", e.target.value)} className="w-full border border-gray-200 rounded text-sm px-2 py-1.5 focus:border-gray-800 focus:ring-0">
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Institute</label>
                      <input type="text" value={member.institute} onChange={e => handleMemberChange(index, "institute", e.target.value)} className="w-full border border-gray-200 rounded text-sm px-2 py-1.5 focus:border-gray-800 focus:ring-0" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Branch</label>
                        <input type="text" value={member.branch} onChange={e => handleMemberChange(index, "branch", e.target.value)} className="w-full border border-gray-200 rounded text-sm px-2 py-1.5 focus:border-gray-800 focus:ring-0" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Sem / Year</label>
                        <input type="text" value={member.year} onChange={e => handleMemberChange(index, "year", e.target.value)} className="w-full border border-gray-200 rounded text-sm px-2 py-1.5 focus:border-gray-800 focus:ring-0" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <button 
                type="button" 
                onClick={handleAddMember}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center font-medium transition-colors"
              >
                <Plus size={18} className="mr-2" /> Add Member
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
          {step === 2 ? (
            <button type="button" onClick={() => setStep(1)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
              <ArrowLeft size={16} className="mr-2" /> Back
            </button>
          ) : (
            <div></div> // empty spacer
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
              Cancel
            </button>
            {step === 1 ? (
              <button type="button" onClick={handleNext} className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-black flex items-center transition-colors">
                Next <ArrowRight size={16} className="ml-2" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading} className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center">
                {loading ? "Saving..." : "Submit"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
