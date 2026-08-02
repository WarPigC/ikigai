import React, { useState, useEffect } from "react";
import { ExternalLink, Check, Mail, Eye, X, Unlock, Copy } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function AdminRound2() {
  const [activeTrack, setActiveTrack] = useState("All");
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tracksCount, setTracksCount] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Reopen Modal State
  const [reopenModal, setReopenModal] = useState(null);
  const [reopenFields, setReopenFields] = useState({
    choiceFilling: false,
    transactionId: false,
    uploadReceipt: false
  });
  const [reopenDuration, setReopenDuration] = useState(30);

  const fetchRegistrations = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/round2/admin`);
      const data = await res.json();
      if (data.success) {
        setRegistrations(data.registrations);
        
        // Calculate counts based on first preference
        const counts = { "All": data.registrations.length };
        data.registrations.forEach(reg => {
          if (reg.trackPreferences && reg.trackPreferences.length > 0) {
            const topTrack = reg.trackPreferences[0];
            counts[topTrack] = (counts[topTrack] || 0) + 1;
          }
        });
        setTracksCount(counts);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/round2/admin/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchRegistrations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = (id, status) => {
    const isApproved = status === "Approved";
    if (window.confirm(isApproved ? "Are you sure you want to verify and approve this registration?" : "Are you sure you want to flag this registration for contact?")) {
      updateStatus(id, status);
    }
  };

  const handleReopenSubmit = async () => {
    if (!reopenModal) return;
    const fields = [];
    if (reopenFields.choiceFilling) fields.push("choiceFilling");
    if (reopenFields.transactionId) fields.push("transactionId");
    if (reopenFields.uploadReceipt) fields.push("uploadReceipt");

    if (fields.length === 0) {
      alert("Please select at least one field to reopen.");
      return;
    }
    
    if (reopenDuration < 1 || reopenDuration > 60) {
      alert("Duration must be between 1 and 60 minutes.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/round2/admin/${reopenModal._id}/reopen`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields, durationMinutes: parseInt(reopenDuration) })
      });
      if (res.ok) {
        setReopenModal(null);
        setReopenFields({ choiceFilling: false, transactionId: false, uploadReceipt: false });
        fetchRegistrations();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to reopen");
      }
    } catch (err) {
      console.error(err);
      alert("Network Error");
    }
  };

  const toggleAllReopenFields = (checked) => {
    setReopenFields({
      choiceFilling: checked,
      transactionId: checked,
      uploadReceipt: checked
    });
  };

  const filtered = activeTrack === "All" ? registrations : registrations.filter(r => r.trackPreferences?.[0] === activeTrack);
  const allTracks = Object.keys(tracksCount);

  return (
    <div className="animate-fade-in w-full max-w-7xl mx-auto px-6 py-8 md:px-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Round 2 Candidates</h2>
          <p className="text-gray-500 mt-1">Manage teams registering for the upcoming Round 2 event.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        {allTracks.map(track => (
          <div 
            key={track}
            onClick={() => setActiveTrack(track)}
            className={`p-4 rounded-xl shadow-sm border cursor-pointer transition min-w-[150px] ${activeTrack === track ? 'bg-purple-100 border-purple-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
          >
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{track}</h3>
            <p className="text-2xl font-black text-gray-800 mt-1">{tracksCount[track] || 0} <span className="text-sm font-medium text-gray-500 ml-1">teams</span></p>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-10">Loading registrations...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center shadow-sm">
          <h3 className="text-xl font-bold text-gray-700 mb-2">No Registrations Yet</h3>
          <p className="text-gray-500">Teams will appear here once they complete the Round 2 registration from their Team Console.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(team => (
            <div key={team._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition">
              <div className="p-5 border-b border-gray-100 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{team.teamName}</h3>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    team.status === "Approved" ? "bg-green-100 text-green-700" :
                    team.status === "Pending" ? "bg-amber-100 text-amber-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>{team.status}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Mail size={14} className="text-gray-400" />
                  <a href={`mailto:${team.leaderEmail}`} className="hover:text-purple-600">{team.leaderEmail}</a>
                </div>
                
                <div className="space-y-3 mt-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Top Track Preference</p>
                    <p className="text-sm font-medium text-gray-800">{team.trackPreferences?.[0] || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Transaction ID</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm font-medium text-gray-800 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-200">{team.transactionId}</p>
                      <button 
                        onClick={() => handleCopy(team._id, team.transactionId)}
                        className={`p-1.5 rounded-md transition ${copiedId === team._id ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-purple-600'}`}
                        title="Copy Transaction ID"
                      >
                        {copiedId === team._id ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 border-t flex items-center justify-between gap-2">
                <a 
                  href={team.receiptUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm font-semibold text-purple-600 hover:text-purple-800 transition"
                >
                  <Eye size={16} /> View Receipt
                </a>
                
                {team.status === "Pending" && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleUpdateStatus(team._id, "Contact")}
                      className="flex items-center gap-1.5 text-sm font-bold bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200 transition"
                      title="Contact Team / Action Required"
                    >
                      <X size={16} />
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(team._id, "Approved")}
                      className="flex items-center gap-1.5 text-sm font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition"
                      title="Verify Registration"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                )}
                {team.status === "Contact" && (
                  <button 
                    onClick={() => setReopenModal(team)}
                    className="flex items-center gap-1.5 text-sm font-bold bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition"
                    title="Re-open Registration Form"
                  >
                    <Unlock size={16} /> Re-open Form
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reopen Form Modal */}
      {reopenModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Re-open Registration</h3>
                <p className="text-sm text-gray-500 mt-1">Select fields to allow <b>{reopenModal.teamName}</b> to edit.</p>
              </div>
              <button onClick={() => setReopenModal(null)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-lg transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              <label className="flex items-center gap-3 p-3 bg-gray-50 border rounded-xl cursor-pointer hover:bg-gray-100 transition">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 border-gray-300"
                  checked={reopenFields.choiceFilling && reopenFields.transactionId && reopenFields.uploadReceipt}
                  onChange={(e) => toggleAllReopenFields(e.target.checked)}
                />
                <span className="font-bold text-gray-800">Select All Fields</span>
              </label>

              <div className="space-y-3 pl-2 border-l-2 border-gray-100 ml-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-gray-300"
                    checked={reopenFields.choiceFilling}
                    onChange={(e) => setReopenFields(p => ({ ...p, choiceFilling: e.target.checked }))}
                  />
                  <span className="text-sm font-semibold text-gray-700">Choice Filling (Track Preference)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-gray-300"
                    checked={reopenFields.transactionId}
                    onChange={(e) => setReopenFields(p => ({ ...p, transactionId: e.target.checked }))}
                  />
                  <span className="text-sm font-semibold text-gray-700">Transaction ID</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-gray-300"
                    checked={reopenFields.uploadReceipt}
                    onChange={(e) => setReopenFields(p => ({ ...p, uploadReceipt: e.target.checked }))}
                  />
                  <span className="text-sm font-semibold text-gray-700">Upload Receipt</span>
                </label>
              </div>

              <div className="pt-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Duration to Keep Open (Minutes)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="60"
                  value={reopenDuration}
                  onChange={(e) => setReopenDuration(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
                />
                <p className="text-xs text-gray-400 mt-1">Maximum 60 minutes.</p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
              <button 
                onClick={() => setReopenModal(null)}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleReopenSubmit}
                className="px-5 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition flex items-center gap-2"
              >
                <Unlock size={16} /> Open Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
