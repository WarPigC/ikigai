import React, { useState, useEffect, useMemo } from "react";
import { ExternalLink, Check, Mail, Eye, X, Unlock, Copy, Filter, Phone, MapPin, Building2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const TeamCard = ({ team, isExpanded, onToggleExpand, handleUpdateStatus, handleToggleReopen, handleCopy, copiedId }) => {
  const displayStatus = (team.status === "Pending" && (!team.transactionId || !team.receiptUrl)) ? "Payment Pending" : team.status;
  const open = isExpanded;

  return (
    <div className="relative w-full h-full min-h-[300px]">
      <div 
        className={`bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col transition-all duration-300 ${
          open 
            ? 'absolute top-[-2%] left-[-2%] sm:left-[-5%] w-[104%] sm:w-[110%] shadow-2xl shadow-purple-500/20 border-purple-400 z-50' 
            : 'relative w-full h-full hover:shadow-md z-10'
        }`}
      >
        <div 
          className={`p-5 border-b border-gray-100 flex-1 cursor-pointer transition ${open ? 'bg-purple-50/50' : 'hover:bg-gray-50'}`}
          onClick={onToggleExpand}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-gray-900">{team.teamName}</h3>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              displayStatus === "Approved" ? "bg-green-100 text-green-700" :
              displayStatus === "Payment Pending" ? "bg-blue-100 text-blue-700" :
              displayStatus === "Pending" ? "bg-amber-100 text-amber-700" :
              "bg-gray-100 text-gray-700"
            }`}>{displayStatus}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Mail size={14} className="text-gray-400" />
            <a href={`mailto:${team.leaderEmail}`} className="hover:text-purple-600" onClick={(e) => e.stopPropagation()}>{team.leaderEmail}</a>
          </div>
          
          <div className="space-y-3 mt-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Top Track Preference</p>
              <p className="text-sm font-medium text-gray-800">{team.trackPreferences?.[0] || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Transaction ID</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm font-medium text-gray-800 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-200">{team.transactionId || "None"}</p>
                {team.transactionId && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleCopy(team._id, team.transactionId); }}
                    className={`p-1.5 rounded-md transition ${copiedId === team._id ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-purple-600'}`}
                    title="Copy Transaction ID"
                  >
                    {copiedId === team._id ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {open && (() => {
          const leader = team.members?.find(m => m.isLeader) || team.members?.[0];
          const otherMembers = team.members?.filter(m => m !== leader) || [];
          return (
            <div className="p-5 bg-gray-50/50 border-b border-gray-100">
               <div className="flex justify-between items-center mb-3">
                 <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Team Leader</h4>
               </div>
               {leader ? (
                 <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-3">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-bold text-base text-gray-900">{leader.name}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-y-2">
                      <div className="text-sm text-gray-700 flex items-start gap-2 break-all"><Mail size={14} className="text-gray-400 shrink-0 mt-0.5"/> {leader.email}</div>
                      <div className="text-sm text-gray-700 flex items-start gap-2 break-words"><Phone size={14} className="text-gray-400 shrink-0 mt-0.5"/> {leader.mobile || leader.phone || "N/A"}</div>
                      {leader.organisation && (
                        <div className="text-sm text-gray-700 flex items-start gap-2 break-words"><Building2 size={14} className="text-gray-400 shrink-0 mt-0.5"/> {leader.organisation}</div>
                      )}
                      {leader.location && (
                        <div className="text-sm text-gray-700 flex items-start gap-2 break-words"><MapPin size={14} className="text-gray-400 shrink-0 mt-0.5"/> {leader.location}</div>
                      )}
                    </div>
                 </div>
               ) : (
                 <p className="text-sm text-gray-500 bg-white p-4 rounded-xl border border-gray-200 mb-3">No leader data available.</p>
               )}
               
               {otherMembers.length > 0 && (
                 <div>
                   <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Team Members</h5>
                   <div className="flex flex-wrap gap-2">
                     {otherMembers.map((m, i) => (
                       <span key={i} className="text-xs font-semibold text-gray-700 bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-sm">
                         {m.name}
                       </span>
                     ))}
                   </div>
                 </div>
               )}
            </div>
          );
        })()}
        
        <div className="bg-white p-4 flex items-center justify-between gap-2 border-t border-gray-100 rounded-b-2xl">
          {team.receiptUrl ? (
            <a 
              href={team.receiptUrl} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1.5 text-sm font-bold text-purple-600 hover:text-purple-800 transition px-3 py-1.5 rounded-lg hover:bg-purple-50"
            >
              <Eye size={16} /> View Receipt
            </a>
          ) : (
            <button 
              onClick={() => alert("No receipt uploaded by this team yet.")}
              className="flex items-center gap-1.5 text-sm font-bold text-gray-400 cursor-not-allowed px-3 py-1.5"
            >
              <Eye size={16} /> No Receipt
            </button>
          )}
          
          <div className="flex items-center gap-2">
            {team.status === "Pending" && (
              <>
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
              </>
            )}
            {team.status === "Contact" && (
              <>
                {team.reopenAccess?.open ? (
                  <span 
                    className="flex items-center gap-1.5 text-sm font-bold bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg"
                    title="Form is currently open for the team to edit"
                  >
                    <Unlock size={16} /> Form Open
                  </span>
                ) : (
                  <button 
                    onClick={() => handleToggleReopen(team)}
                    className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg transition bg-blue-100 text-blue-700 hover:bg-blue-200"
                    title="Re-open Registration Form"
                  >
                    <Unlock size={16} /> Re-open
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminRound2() {
  const [activeTrack, setActiveTrack] = useState("All");
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tracksCount, setTracksCount] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  
  // Filtering States
  const [filterCollege, setFilterCollege] = useState("All");
  const [filterLocation, setFilterLocation] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const handleCopy = (id, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Reopen Form Logic
  const handleToggleReopen = async (team) => {
    const isCurrentlyOpen = team.reopenAccess?.open;
    const confirmMessage = isCurrentlyOpen 
      ? "Are you sure you want to CLOSE the registration form for this team?" 
      : "Are you sure you want to RE-OPEN the entire registration form for this team?";
      
    if (!window.confirm(confirmMessage)) return;

    try {
      const res = await fetch(`${API_BASE}/api/round2/admin/${team._id}/reopen`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ open: !isCurrentlyOpen })
      });
      if (res.ok) {
        fetchRegistrations();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to update form access");
      }
    } catch (err) {
      console.error(err);
      alert("Network Error");
    }
  };

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



  const { filtered, uniqueColleges, uniqueLocations } = useMemo(() => {
    let list = activeTrack === "All" ? registrations : registrations.filter(r => r.trackPreferences?.[0] === activeTrack);
    
    // Extract unique colleges and locations for the dropdowns based on the current track (or all tracks)
    const colleges = new Set();
    const locations = new Set();
    
    list.forEach(team => {
      // Find the leader's data, or the first member's data
      const leader = team.members?.find(m => m.isLeader) || team.members?.[0];
      if (leader?.organisation) colleges.add(leader.organisation);
      if (leader?.location) locations.add(leader.location);
    });

    if (filterCollege !== "All") {
      list = list.filter(team => {
        const leader = team.members?.find(m => m.isLeader) || team.members?.[0];
        return leader?.organisation === filterCollege;
      });
    }
    
    if (filterLocation !== "All") {
      list = list.filter(team => {
        const leader = team.members?.find(m => m.isLeader) || team.members?.[0];
        return leader?.location === filterLocation;
      });
    }
    
    if (filterStatus !== "All") {
      list = list.filter(team => {
        const displayStatus = (team.status === "Pending" && (!team.transactionId || !team.receiptUrl)) ? "Payment Pending" : team.status;
        return displayStatus === filterStatus;
      });
    }

    return { 
      filtered: list, 
      uniqueColleges: Array.from(colleges).sort(), 
      uniqueLocations: Array.from(locations).sort() 
    };
  }, [registrations, activeTrack, filterCollege, filterLocation, filterStatus]);

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
            onClick={() => {
              setActiveTrack(track);
              setFilterCollege("All");
              setFilterLocation("All");
              setFilterStatus("All");
            }}
            className={`p-4 rounded-xl shadow-sm border cursor-pointer transition min-w-[150px] ${activeTrack === track ? 'bg-purple-100 border-purple-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
          >
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{track}</h3>
            <p className="text-2xl font-black text-gray-800 mt-1">{tracksCount[track] || 0} <span className="text-sm font-medium text-gray-500 ml-1">teams</span></p>
          </div>
        ))}
      </div>

      {/* FILTER HEADER */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-gray-600 font-semibold">
          <Filter size={18} /> Filters
        </div>
        <div className="flex flex-wrap gap-4 flex-1 justify-end">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border-gray-300 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="All">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending Verification</option>
            <option value="Payment Pending">Payment Pending</option>
            <option value="Contact">Contact</option>
          </select>

          <select 
            value={filterCollege}
            onChange={(e) => setFilterCollege(e.target.value)}
            className="border-gray-300 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500 max-w-[250px]"
          >
            <option value="All">All Colleges</option>
            {uniqueColleges.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select 
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="border-gray-300 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500 max-w-[200px]"
          >
            <option value="All">All Locations</option>
            {uniqueLocations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
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
            <TeamCard 
              key={team._id} 
              team={team} 
              isExpanded={expandedTeamId === team._id}
              onToggleExpand={() => setExpandedTeamId(expandedTeamId === team._id ? null : team._id)}
              handleUpdateStatus={handleUpdateStatus} 
              handleToggleReopen={handleToggleReopen} 
              handleCopy={handleCopy} 
              copiedId={copiedId} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
