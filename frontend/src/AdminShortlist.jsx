import React, { useState, useEffect } from "react";
import { CheckCircle, Search, Save, X, GripVertical, AlertCircle, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ikigaiLogo from "./assets/ikigai.png";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function AdminShortlist({ events }) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [participants, setParticipants] = useState([]);
  const [shortlisted, setShortlisted] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [filterInstitute, setFilterInstitute] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterIsShortlisted, setFilterIsShortlisted] = useState("");
  
  const [sortByMarks, setSortByMarks] = useState("desc");

  const [activeTab, setActiveTab] = useState("all"); // "all" | "evaluator"
  const [expandedEvaluator, setExpandedEvaluator] = useState(null);

  const fetchParticipantsAndShortlist = async (eventId) => {
    setLoading(true);
    try {
      // Fetch participants
      const res = await fetch(`${API_BASE}/api/admin/events/${eventId}/participants`);
      const data = await res.json();
      
      // Fetch existing shortlist
      const shortRes = await fetch(`${API_BASE}/api/admin/events/${eventId}/shortlisted`);
      const shortData = await shortRes.json();
      
      if (data.success) {
        const mapped = (data.participants || []).map((p) => {
          const leader = p.members?.find((m) => m.isLeader) || p.members?.[0] || {};
          const locParts = (leader.location || "").split(',').map(s => s.trim());
          return {
            ...p,
            paperId: p.teamId || p._id,
            teamName: p.teamName || "",
            leaderName: leader.name || "Unknown",
            institute: (leader.organisation || "").trim(),
            branch: (leader.domain || leader.specialization || "").trim(),
            city: locParts[0] || "",
            state: locParts[1] || "",
            country: locParts[2] || "",
          };
        });
        
        // DO NOT filter by EVALUATED here, allow all teams to populate the main state
        setParticipants(mapped);
      }
      
      if (shortData.success && shortData.shortlisted) {
        setShortlisted(shortData.shortlisted.map(s => ({...s, _id: s.participantId})));
      } else {
        setShortlisted([]);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedEventId) {
      fetchParticipantsAndShortlist(selectedEventId);
    } else {
      setParticipants([]);
      setShortlisted([]);
    }
  }, [selectedEventId]);

  const handleSave = async () => {
    if (!selectedEventId) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/events/${selectedEventId}/shortlisted`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participants: shortlisted })
      });
      const data = await res.json();
      if (data.success) {
        alert("Shortlist saved successfully!");
      } else {
        alert("Failed to save shortlist");
      }
    } catch (err) {
      alert("Error saving shortlist");
    }
    setSaving(false);
  };

  // Drag and Drop
  const onDragStart = (e, participant, from) => {
    e.dataTransfer.setData("participant", JSON.stringify(participant));
    e.dataTransfer.setData("from", from);
  };

  const onDrop = (e, to) => {
    e.preventDefault();
    const pStr = e.dataTransfer.getData("participant");
    const from = e.dataTransfer.getData("from");
    if (!pStr || from === to) return;
    
    const p = JSON.parse(pStr);
    
    if (to === "rhs") {
      if (!shortlisted.find(s => s._id === p._id)) {
        setShortlisted([...shortlisted, p]);
      }
    } else if (to === "lhs") {
      setShortlisted(shortlisted.filter(s => s._id !== p._id));
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  // Filtering LHS
  let filteredLHS = participants.filter(p => {
    // If it's already in RHS, don't show in LHS
    if (shortlisted.find(s => s._id === p._id)) return false;
    
    const searchLower = search.toLowerCase();
    const matchesSearch = !search || 
      p.teamName.toLowerCase().includes(searchLower) || 
      p.paperId.toLowerCase().includes(searchLower) || 
      p.leaderName.toLowerCase().includes(searchLower);
      
    const matchesInst = !filterInstitute || p.institute === filterInstitute;
    const matchesBranch = !filterBranch || p.branch === filterBranch;
    const matchesCity = !filterCity || p.city === filterCity;
    const matchesState = !filterState || p.state === filterState;
    const matchesCountry = !filterCountry || p.country === filterCountry;
    
    const hasShortlistCriteria = p.assessments?.some(a => a.criteria?.includes(true));
    const isShortlistCriteriaMatch = !filterIsShortlisted || 
      (filterIsShortlisted === "yes" && hasShortlistCriteria) ||
      (filterIsShortlisted === "no" && !hasShortlistCriteria);

    return matchesSearch && matchesInst && matchesBranch && matchesCity && matchesState && matchesCountry && isShortlistCriteriaMatch;
  });

  const getAvgMarks = (p) => {
    if (!p.assessments || p.assessments.length === 0) return 0;
    return p.assessments.reduce((sum, a) => sum + (a.total || 0), 0) / p.assessments.length;
  };

  // Sort LHS
  filteredLHS.sort((a, b) => {
    const valA = getAvgMarks(a);
    const valB = getAvgMarks(b);
    return sortByMarks === "asc" ? valA - valB : valB - valA;
  });

  // Group by Evaluator (using evaluatedBy or evaluatorId)
  const groupedByEvaluator = {};
  filteredLHS.forEach(p => {
    // Skip non-evaluated teams for the Evaluator-Wise view
    if (p.status !== "EVALUATED") return;

    if (p.assessments && p.assessments.length > 0) {
      p.assessments.forEach(assessment => {
        let evName = "Unknown Evaluator";
        let evEmail = "N/A";
        let evPhone = "N/A";
        if (assessment.evaluatorId && assessment.evaluatorId.name) {
          evName = assessment.evaluatorId.name;
          evEmail = assessment.evaluatorId.email || "N/A";
          evPhone = assessment.evaluatorId.phone || "N/A";
        } else if (assessment.evaluatedBy) {
          evName = assessment.evaluatedBy;
        }
        if (!groupedByEvaluator[evName]) {
          groupedByEvaluator[evName] = { details: { name: evName, email: evEmail, phone: evPhone }, teams: [] };
        }
        if (!groupedByEvaluator[evName].teams.some(existing => existing.team._id === p._id)) {
          groupedByEvaluator[evName].teams.push({ team: p, assessment });
        }
      });
    } else {
      const evName = "Unknown Evaluator";
      if (!groupedByEvaluator[evName]) {
        groupedByEvaluator[evName] = { details: { name: evName, email: "N/A", phone: "N/A" }, teams: [] };
      }
      groupedByEvaluator[evName].teams.push({ team: p, assessment: {} });
    }
  });

  const downloadReport = (evaluatorName) => {
    const data = groupedByEvaluator[evaluatorName];
    if (!data) return;

    const doc = new jsPDF();
    
    // Add Logo
    doc.addImage(ikigaiLogo, "PNG", 14, 10, 30, 15);
    
    // Title
    doc.setFontSize(16);
    doc.text("Team Assessment Report", 105, 20, { align: "center" });

    // Details
    doc.setFontSize(10);
    doc.text(`Evaluator: ${data.details.name}`, 14, 35);
    doc.text(`Email: ${data.details.email}`, 14, 40);
    doc.text(`Phone: ${data.details.phone}`, 14, 45);
    doc.text(`Teams Evaluated: ${data.teams.length}`, 14, 50);

    const tableCols = [
      "S.No.",
      "Team Name",
      "Team Leader",
      "Team Leader Institute",
      "Team assessed on",
      "Team Marks (total)"
    ];

    const tableRows = data.teams.map((t, idx) => {
      const p = t.team;
      const a = t.assessment;
      const assessedOn = a.evaluatedAt ? new Date(a.evaluatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "N/A";
      return [
        idx + 1,
        p.teamName,
        p.leaderName,
        p.institute,
        assessedOn,
        a.total || 0
      ];
    });

    autoTable(doc, {
      startY: 55,
      head: [tableCols],
      body: tableRows,
      headStyles: { fillColor: [216, 27, 96] },
      styles: { fontSize: 9 }
    });

    doc.save(`Assessment_Report_${data.details.name.replace(/\s+/g, "_")}.pdf`);
  };

  const renderCard = (p, from, specificAssessment = null) => {
    const marksToDisplay = specificAssessment 
      ? specificAssessment.total || 0
      : getAvgMarks(p).toFixed(1).replace(/\.0$/, '');

    return (
    <div 
      key={p._id}
      draggable
      onDragStart={(e) => onDragStart(e, p, from)}
      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm mb-2 flex items-center justify-between cursor-grab active:cursor-grabbing hover:border-green-400 hover:shadow-md transition"
    >
      <div className="flex items-start gap-2 overflow-hidden">
        <GripVertical size={18} className="text-gray-400 mt-1 flex-shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded">{p.paperId}</span>
            <span className="font-semibold text-gray-800 truncate">{p.teamName}</span>
          </div>
          <div className="text-xs text-gray-600 mt-1 truncate">Leader: {p.leaderName}</div>
          <div className="text-xs text-gray-500 mt-0.5 truncate">{p.institute} {p.branch ? `• ${p.branch}` : ''}</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="text-xs text-purple-600 font-medium">Marks: {marksToDisplay}</div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${p.status === 'EVALUATED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {p.status === 'EVALUATED' ? 'EVALUATED' : 'PENDING'}
            </span>
          </div>
        </div>
      </div>
      {from === "rhs" && (
        <button 
          onClick={() => setShortlisted(shortlisted.filter(s => s._id !== p._id))}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
  };

  // Extract unique values for filters
  const uniqueInstitutes = [...new Set(participants.map(p => p.institute).filter(Boolean))].sort();
  const uniqueBranches = [...new Set(participants.map(p => p.branch).filter(Boolean))].sort();
  const uniqueCities = [...new Set(participants.map(p => p.city).filter(Boolean))].sort();
  const uniqueStates = [...new Set(participants.map(p => p.state).filter(Boolean))].sort();
  const uniqueCountries = [...new Set(participants.map(p => p.country).filter(Boolean))].sort();

  return (
    <div className="animate-fade-in w-full max-w-full mx-auto px-6 py-8 md:px-10 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Shortlist Teams</h2>
          <p className="text-gray-500 mt-1">Drag and drop assessed teams to create a shortlist for Round 2.</p>
        </div>
        <div className="flex gap-4 items-center">
          <select 
            value={selectedEventId} 
            onChange={(e) => setSelectedEventId(e.target.value)} 
            className="border border-gray-300 rounded-lg px-4 py-2 font-medium focus:ring-2 focus:ring-green-400 focus:outline-none"
          >
            <option value="">-- Select an Event --</option>
            {events.map(ev => (
              <option key={ev._id} value={ev._id}>{ev.title}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={saving || !selectedEventId}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md transition disabled:opacity-50"
          >
            <Save size={18} /> {saving ? "Saving..." : "Save Shortlist"}
          </button>
        </div>
      </div>

      {!selectedEventId ? (
        <div className="flex-1 flex items-center justify-center bg-white/80 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500">
          Select an event above to start shortlisting.
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center">Loading participants...</div>
      ) : (
        <div className="flex-1 flex gap-6 overflow-hidden">
          
          {/* LHS - Assessed Teams */}
          <div 
            className="w-1/2 flex flex-col bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-inner"
            onDrop={(e) => onDrop(e, "lhs")}
            onDragOver={onDragOver}
          >
            <div className="p-4 bg-white border-b border-gray-200 shadow-sm z-10 shrink-0">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-500" /> Evaluated Teams
              </h3>
              
              {/* Sorting and Filtering */}
              <div className="space-y-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search teams, ID, leader..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400 focus:outline-none"
                  />
                </div>
                
                <div className="flex gap-2 text-sm">
                  <select value={filterInstitute} onChange={e => setFilterInstitute(e.target.value)} className="w-1/2 border rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-400 bg-white">
                    <option value="">All Institutes</option>
                    {uniqueInstitutes.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                  <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="w-1/2 border rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-400 bg-white">
                    <option value="">All Branches</option>
                    {uniqueBranches.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 text-sm">
                  <select value={filterCity} onChange={e => setFilterCity(e.target.value)} className="w-1/3 border rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-400 bg-white">
                    <option value="">All Cities</option>
                    {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={filterState} onChange={e => setFilterState(e.target.value)} className="w-1/3 border rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-400 bg-white">
                    <option value="">All States</option>
                    {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} className="w-1/3 border rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-400 bg-white">
                    <option value="">All Countries</option>
                    {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                
                <div className="flex items-center justify-between text-sm pt-1 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">Sort Marks:</span>
                    <select value={sortByMarks} onChange={e => setSortByMarks(e.target.value)} className="border rounded px-2 py-1 outline-none">
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">isShortlisted (Criteria):</span>
                    <select value={filterIsShortlisted} onChange={e => setFilterIsShortlisted(e.target.value)} className="border rounded px-2 py-1 outline-none">
                      <option value="">Any</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex border-b border-gray-200 bg-white shrink-0">
              <button 
                onClick={() => setActiveTab("all")} 
                className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition ${activeTab === "all" ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                All Teams ({filteredLHS.length})
              </button>
              <button 
                onClick={() => setActiveTab("evaluator")} 
                className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition ${activeTab === "evaluator" ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Evaluator Wise
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
              {filteredLHS.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">No teams found matching criteria.</div>
              ) : activeTab === "all" ? (
                <div className="space-y-1">
                  {filteredLHS.map(p => renderCard(p, "lhs"))}
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(groupedByEvaluator).map(([evaluator, data]) => (
                    <div key={evaluator} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-100 hover:bg-gray-200 transition">
                        <button 
                          onClick={() => setExpandedEvaluator(expandedEvaluator === evaluator ? null : evaluator)}
                          className="flex-1 flex items-center justify-between font-semibold text-gray-800 text-left"
                        >
                          <span>{evaluator}</span>
                          <span className="text-sm bg-white px-2 py-0.5 rounded text-gray-600 mr-4">{data.teams.length} teams</span>
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); downloadReport(evaluator); }}
                          title="Download Report"
                          className="p-1.5 text-pink-600 hover:bg-pink-50 rounded transition flex-shrink-0"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                      {expandedEvaluator === evaluator && (
                        <div className="p-3 bg-gray-50 border-t border-gray-200">
                          {data.teams.map(t => renderCard(t.team, "lhs", t.assessment))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RHS - Shortlisted Teams */}
          <div 
            className="w-1/2 flex flex-col bg-white border-2 border-dashed border-green-300 rounded-xl overflow-hidden shadow-sm"
            onDrop={(e) => onDrop(e, "rhs")}
            onDragOver={onDragOver}
          >
            <div className="p-4 bg-green-50 border-b border-green-200 shrink-0">
              <h3 className="font-bold text-green-800 flex items-center justify-between">
                <span className="flex items-center gap-2">Round 2 Shortlist</span>
                <span className="bg-green-600 text-white px-2 py-0.5 rounded-full text-xs">{shortlisted.length}</span>
              </h3>
              <p className="text-xs text-green-700 mt-1">Drag teams here to add them to the shortlist.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-green-50/30">
              {shortlisted.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-green-700/50 opacity-70">
                  <AlertCircle size={48} className="mb-4" />
                  <p className="font-medium">Drag teams from the left to shortlist them.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {shortlisted.map(p => renderCard(p, "rhs"))}
                </div>
              )}
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
