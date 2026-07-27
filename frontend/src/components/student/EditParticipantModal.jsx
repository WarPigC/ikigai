import React, { useState, useEffect, useRef } from "react";
import { X, Plus, Trash2, ArrowRight, ArrowLeft, Upload } from "lucide-react";
import { studentApi } from "../../services/studentApi";

const defaultMember = (isLeader = false) => ({
  candidateRole: isLeader ? "Team Leader" : "Team Member",
  name: "",
  email: "",
  mobile: "",
  location: "",
  userType: "College Students",
  domain: "",
  course: "",
  specialization: "",
  courseType: "Full Time",
  courseDuration: "",
  classGrade: "",
  gradYear: "",
  organisation: "",
  designation: "",
  workExperience: "",
  regStatus: "Complete",
  refCode: "",
  paymentStatus: "paid",
  differentlyAbled: false,
  isLeader
});

export default function EditParticipantModal({ isOpen, onClose, participant, eventId, allEvents, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingPpt, setUploadingPpt] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  const [teamDetails, setTeamDetails] = useState({
    teamId: "",
    teamName: "",
    problemStatement: "",
    description: "",
    pptLink: "",
  });

  const [members, setMembers] = useState([]);

  const isGlobal = eventId === "global";
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const finalEventId = isGlobal ? selectedEventId : eventId;
  const finalTrackId = isGlobal ? selectedTrackId : participant?.trackId;

  useEffect(() => {
    if (participant) {
      setStep(1); // Reset step on open
      setError(null);
      setSelectedEventId(participant.eventId || "");
      setSelectedTrackId(participant.trackId || "");
      setTeamDetails({
        teamId: participant.teamId || "",
        teamName: participant.teamName || "",
        problemStatement: participant.problemStatement || "",
        description: participant.description || "",
        pptLink: participant.pptLink || "",
      });
      // Map existing members, applying defaults for new fields if they don't exist
      if (participant.members?.length) {
        setMembers(participant.members.map(m => ({ ...defaultMember(m.isLeader), ...m })));
      } else {
        setMembers([defaultMember(true)]);
      }
    }
  }, [participant]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (isGlobal && (!selectedEventId || !selectedTrackId)) {
      setError("Please select Event and Track");
      return;
    }
    if (!teamDetails.teamId) {
      setError("Please provide a Team ID");
      return;
    }
    if (!teamDetails.teamName) {
      setError("Please provide a Team Name");
      return;
    }
    if (!teamDetails.pptLink) {
      setError("Please upload a Presentation File (PPT/PDF/ZIP)");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handlePptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPpt(true);
    setError(null);
    try {
      const res = await studentApi.uploadPpt(file, teamDetails.teamId, participant.eventId);
      if (res.success) {
        setTeamDetails(prev => ({ ...prev, pptLink: res.url }));
      } else if (res.configured === false) {
        setError("Cloudinary is not configured. Please set env vars to enable uploads.");
      } else {
        setError(res.message || "Failed to upload PPT");
      }
    } catch (err) {
      setError("Network error during PPT upload");
    } finally {
      setUploadingPpt(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddMember = () => {
    setMembers([...members, defaultMember(false)]);
  };

  const handleRemoveMember = (index) => {
    const newMembers = [...members];
    if (newMembers[index].isLeader && newMembers.length > 1) {
      const otherIndex = index === 0 ? 1 : 0;
      newMembers[otherIndex].isLeader = true;
      newMembers[otherIndex].candidateRole = "Team Leader";
    }
    newMembers.splice(index, 1);
    setMembers(newMembers);
  };

  const handleMemberChange = (index, field, value) => {
    const newMembers = [...members];
    if (field === "isLeader" && value === true) {
      newMembers.forEach(m => {
        m.isLeader = false;
        m.candidateRole = "Team Member";
      });
      newMembers[index].candidateRole = "Team Leader";
    }
    newMembers[index][field] = value;
    setMembers(newMembers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isGlobal && (!finalEventId || !finalTrackId)) {
      setError("Event or Track is missing");
      return;
    }

    const incomplete = members.some(m => !m.name || !m.email);
    if (incomplete) {
      setError("Please provide at least Name and Email for all members");
      return;
    }

    const trackChanged = String(participant.trackId) !== String(finalTrackId);
    if (trackChanged) {
      if (!window.confirm("Warning: Changing the track will reset this team's marks and evaluator assignments. Do you wish to proceed?")) {
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      await studentApi.updateParticipant(participant._id, {
        ...teamDetails,
        eventId: finalEventId,
        trackId: finalTrackId,
        resetAssessment: trackChanged,
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
          <h2 className="text-xl font-bold text-gray-800">
            Edit Participant - {step === 1 ? "Team Details" : "Team Members"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

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
                        disabled={!selectedEventId}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team ID (Platform ID) *</label>
                  <input type="text" required value={teamDetails.teamId} onChange={e => setTeamDetails({...teamDetails, teamId: e.target.value})} placeholder="e.g. TM-10294" className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-gray-800/20 focus:border-gray-800 bg-gray-50" readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
                  <input type="text" required value={teamDetails.teamName} onChange={e => setTeamDetails({...teamDetails, teamName: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-gray-800/20 focus:border-gray-800" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Problem Statement</label>
                  <input type="text" value={teamDetails.problemStatement} onChange={e => setTeamDetails({...teamDetails, problemStatement: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-gray-800/20 focus:border-gray-800" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows="3" value={teamDetails.description} onChange={e => setTeamDetails({...teamDetails, description: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-gray-800/20 focus:border-gray-800" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Presentation File (PPT/PDF/ZIP)</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPpt}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Upload size={16} /> {uploadingPpt ? "Uploading..." : "Update File"}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePptUpload}
                      className="hidden"
                      accept=".pdf,.ppt,.pptx,.zip"
                    />
                    <input 
                      type="url" 
                      value={teamDetails.pptLink} 
                      onChange={e => setTeamDetails({...teamDetails, pptLink: e.target.value})} 
                      placeholder="Or paste external URL directly..." 
                      className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-gray-800/20 focus:border-gray-800" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {members.map((member, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-5 bg-gray-50/30 relative">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-3">
                    <h4 className="font-semibold text-gray-800">Member {index + 1}</h4>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                        <input 
                          type="radio" 
                          name={`edit_leader_${index}`} 
                          checked={member.isLeader}
                          onChange={() => handleMemberChange(index, "isLeader", true)}
                          className="text-green-600 focus:ring-green-500 cursor-pointer"
                        />
                        Team Leader
                      </label>
                      {members.length > 1 && (
                        <button type="button" onClick={() => handleRemoveMember(index)} className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded-md transition-colors">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* CSV Aligned Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Identity */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
                      <input type="text" value={member.name} onChange={e => handleMemberChange(index, "name", e.target.value)} className="w-full border border-gray-200 rounded text-sm px-2.5 py-1.5 focus:border-gray-800 focus:ring-0 bg-white" required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                      <input type="email" value={member.email} onChange={e => handleMemberChange(index, "email", e.target.value)} className="w-full border border-gray-200 rounded text-sm px-2.5 py-1.5 focus:border-gray-800 focus:ring-0 bg-white" required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Mobile / Phone</label>
                      <input type="tel" value={member.mobile} onChange={e => handleMemberChange(index, "mobile", e.target.value)} className="w-full border border-gray-200 rounded text-sm px-2.5 py-1.5 focus:border-gray-800 focus:ring-0 bg-white" />
                    </div>

                    {/* Academic Details */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">User Type</label>
                      <select value={member.userType} onChange={e => handleMemberChange(index, "userType", e.target.value)} className="w-full border border-gray-200 rounded text-sm px-2.5 py-1.5 focus:border-gray-800 focus:ring-0 bg-white">
                        <option>College Students</option>
                        <option>School Student</option>
                        <option>Professional</option>
                        <option>Fresher</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Organisation / Institute</label>
                      <input type="text" value={member.organisation} onChange={e => handleMemberChange(index, "organisation", e.target.value)} className="w-full border border-gray-200 rounded text-sm px-2.5 py-1.5 focus:border-gray-800 focus:ring-0 bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Course (e.g. B.Tech)</label>
                      <input type="text" value={member.course} onChange={e => handleMemberChange(index, "course", e.target.value)} className="w-full border border-gray-200 rounded text-sm px-2.5 py-1.5 focus:border-gray-800 focus:ring-0 bg-white" />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Specialization / Branch</label>
                      <input type="text" value={member.specialization} onChange={e => handleMemberChange(index, "specialization", e.target.value)} className="w-full border border-gray-200 rounded text-sm px-2.5 py-1.5 focus:border-gray-800 focus:ring-0 bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Domain</label>
                      <input type="text" value={member.domain} onChange={e => handleMemberChange(index, "domain", e.target.value)} className="w-full border border-gray-200 rounded text-sm px-2.5 py-1.5 focus:border-gray-800 focus:ring-0 bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Graduation Year</label>
                      <input type="text" value={member.gradYear} onChange={e => handleMemberChange(index, "gradYear", e.target.value)} className="w-full border border-gray-200 rounded text-sm px-2.5 py-1.5 focus:border-gray-800 focus:ring-0 bg-white" />
                    </div>
                    
                    {/* Additional Metadata */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Location</label>
                      <input type="text" value={member.location} onChange={e => handleMemberChange(index, "location", e.target.value)} className="w-full border border-gray-200 rounded text-sm px-2.5 py-1.5 focus:border-gray-800 focus:ring-0 bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Status</label>
                      <select value={member.paymentStatus} onChange={e => handleMemberChange(index, "paymentStatus", e.target.value)} className="w-full border border-gray-200 rounded text-sm px-2.5 py-1.5 focus:border-gray-800 focus:ring-0 bg-white">
                        <option value="paid">Paid</option>
                        <option value="not paid">Not Paid</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Differently Abled?</label>
                      <select value={member.differentlyAbled ? "Yes" : "No"} onChange={e => handleMemberChange(index, "differentlyAbled", e.target.value === "Yes")} className="w-full border border-gray-200 rounded text-sm px-2.5 py-1.5 focus:border-gray-800 focus:ring-0 bg-white">
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              
              <button 
                type="button" 
                onClick={handleAddMember}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center font-medium transition-colors"
              >
                <Plus size={18} className="mr-2" /> Add Member
              </button>
            </div>
          )}
        </div>

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
                {loading ? "Saving..." : "Save Changes"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

