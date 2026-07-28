import React, { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { X, Users, MoreVertical, Loader2, CheckCircle, GripVertical, ChevronDown, ChevronUp, CheckSquare, Square, Building2, MapPin, BookOpen, User, Search, Filter } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// ─────────────────────────────────────────────────────────────────────────────
// Droppable zone — wraps an evaluator section or the unassigned pool
// ─────────────────────────────────────────────────────────────────────────────
function DroppableZone({ id, children, className = "" }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl transition-colors duration-150 ${
        isOver ? "bg-green-50 ring-2 ring-green-400" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Draggable Team Card
// ─────────────────────────────────────────────────────────────────────────────
function DraggableTeamCard({ participant, evaluator, onAssign, assigning, saved, isDragging, isSelected, onToggleSelect }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: participant._id,
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const leader = participant.members?.find((m) => m.isLeader) || participant.members?.[0];

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50, opacity: 0.85 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onToggleSelect && onToggleSelect(participant._id)}
      className={`bg-white border rounded-xl shadow-sm select-none transition-all cursor-grab active:cursor-grabbing touch-manipulation relative ${
        assigning ? "opacity-50" : ""
      } ${
        isSelected ? "border-blue-500 ring-1 ring-blue-400 bg-blue-50/50 scale-[1.02] shadow-md z-10" : saved ? "border-green-400 ring-1 ring-green-300" : "border-gray-200"
      } ${
        isDragging ? "opacity-0" : "hover:shadow-md hover:border-gray-300"
      }`}
    >
      <div className="flex items-stretch relative">
        {/* Selection Toggle (Checkbox) */}
        {onToggleSelect && (
          <div className="flex items-center justify-center pl-3 pt-3">
            {isSelected ? (
              <CheckSquare size={18} className="text-blue-600" />
            ) : (
              <Square size={18} className="text-gray-300 hover:text-gray-400" />
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-800 text-base leading-tight truncate">
                {participant.teamName}
              </p>
              {participant.teamId && (
                <p className="text-sm text-gray-400 mt-0.5 font-mono">{participant.teamId}</p>
              )}
              
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mt-2.5 text-[11px] sm:text-xs">
                {leader && (
                  <div className="flex items-center gap-1.5 text-gray-600 truncate" title={leader.name}>
                    <User size={13} className="flex-shrink-0 text-gray-400" />
                    <span className="truncate font-medium">{leader.name}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Users size={13} className="flex-shrink-0 text-gray-400" />
                  <span>{participant.members?.length ?? 0} Member{(participant.members?.length !== 1) ? 's' : ''}</span>
                </div>

                {leader?.organisation && (
                  <div className="col-span-2 flex items-center gap-1.5 text-gray-600 truncate" title={leader.organisation}>
                    <Building2 size={13} className="flex-shrink-0 text-gray-400" />
                    <span className="truncate">{leader.organisation}</span>
                  </div>
                )}

                {leader?.location && (
                  <div className="col-span-2 flex items-center gap-1.5 text-gray-600 truncate" title={leader.location}>
                    <MapPin size={13} className="flex-shrink-0 text-gray-400" />
                    <span className="truncate">{leader.location}</span>
                  </div>
                )}

                {(leader?.specialization || leader?.domain) && (
                  <div className="col-span-2 flex items-center gap-1.5 text-gray-600 truncate" title={leader.specialization || leader.domain}>
                    <BookOpen size={13} className="flex-shrink-0 text-gray-400" />
                    <span className="truncate">{leader.specialization || leader.domain}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Kebab menu — mobile fallback for assignment */}
            <div className="relative flex-shrink-0">
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 touch-manipulation"
                aria-label="Assign"
              >
                {assigning ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : saved ? (
                  <CheckCircle size={14} className="text-green-500" />
                ) : (
                  <MoreVertical size={14} />
                )}
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-xl shadow-xl min-w-[190px] overflow-hidden">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b">
                      Assign to…
                    </div>
                    <button
                      onClick={() => { onAssign([participant._id], null); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                      Unassign
                    </button>
                    {evaluator && (
                      <button
                        onClick={() => { onAssign([participant._id], evaluator._id); setMenuOpen(false); }}
                        className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-800 flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                        {evaluator.name}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ghost card shown in DragOverlay
// ─────────────────────────────────────────────────────────────────────────────
function GhostCard({ participant, selectedCount }) {
  if (!participant) return null;
  return (
    <div className="relative">
      {/* Background stacked cards for visual effect */}
      {selectedCount > 1 && (
        <>
          <div className="absolute top-2 left-2 w-full h-full bg-white border-2 border-blue-300 rounded-xl shadow-xl opacity-80 rotate-6 z-0" />
          {selectedCount > 2 && (
             <div className="absolute top-4 left-4 w-full h-full bg-white border-2 border-blue-200 rounded-xl shadow-lg opacity-60 rotate-[9deg] z-[-1]" />
          )}
        </>
      )}
      
      <div className="bg-white border-2 border-blue-500 rounded-xl p-3 shadow-2xl w-64 rotate-3 opacity-95 relative scale-105 transition-transform z-10">
        <p className="font-semibold text-gray-800 text-base truncate">{participant.teamName}</p>
        {participant.teamId && (
          <p className="text-sm text-gray-400 font-mono">{participant.teamId}</p>
        )}
        {selectedCount > 1 && (
          <div className="absolute -top-3 -right-3 bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg border-2 border-white">
            {selectedCount} Teams
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Evaluator Section (droppable, stacked vertically)
// ─────────────────────────────────────────────────────────────────────────────
function EvaluatorSection({ evaluator, teams, onAssign, assigningId, savedId, colorClass, activeId, isExpanded, onToggleExpand }) {
  const showExpanded = isExpanded;

  return (
    <DroppableZone id={evaluator._id}>
      <div className={`border rounded-xl overflow-hidden transition-all duration-300 bg-white ${showExpanded ? 'shadow-md border-blue-200 ring-1 ring-blue-100' : 'border-gray-200 shadow-sm'}`}>
        {/* Evaluator header */}
        <div 
          className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${colorClass}`}
          onClick={onToggleExpand}
        >
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{evaluator.name}</p>
            <p className="text-xs opacity-70 truncate">{evaluator.email}</p>
          </div>
          <div className="flex items-center gap-3 ml-2 flex-shrink-0">
            <span className="text-xs font-bold bg-white/60 rounded-full px-2 py-0.5 text-current">
              {teams.length} team{teams.length !== 1 ? "s" : ""}
            </span>
            {showExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {/* Teams assigned to this evaluator */}
        {showExpanded && (
          <div className="p-3 space-y-2 min-h-[70px] bg-gray-50/50 border-t border-gray-100">
            {teams.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-3 select-none">
                Drop teams here
              </p>
            ) : (
              teams.map((p) => (
                <DraggableTeamCard
                  key={p._id}
                  participant={p}
                  evaluator={evaluator}
                  onAssign={onAssign}
                  assigning={assigningId === p._id}
                  saved={savedId === p._id}
                  isDragging={activeId === p._id}
                />
              ))
            )}
          </div>
        )}
      </div>
    </DroppableZone>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Location Parsing Helper
// ─────────────────────────────────────────────────────────────────────────────
const parseLocation = (locString) => {
  if (!locString) return { city: "", state: "", country: "" };
  const parts = locString.split(",").map(s => s.trim()).filter(Boolean);
  
  if (parts.length >= 3) {
    return { city: parts[0], state: parts[1], country: parts[2] };
  } else if (parts.length === 2) {
    return { city: parts[0], state: parts[1], country: "" };
  } else if (parts.length === 1) {
    return { city: parts[0], state: "", country: "" };
  }
  return { city: "", state: "", country: "" };
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────────────────────────────────────
const EVALUATOR_COLORS = [
  "bg-purple-100 text-purple-900",
  "bg-pink-100 text-pink-900",
  "bg-rose-100 text-rose-900",
  "bg-fuchsia-100 text-fuchsia-900",
  "bg-violet-100 text-violet-900",
];

export default function AssignTeamsModal({ isOpen, onClose, event, track, evaluator }) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [savedMessage, setSavedMessage] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [selectedTeamIds, setSelectedTeamIds] = useState(new Set());
  const [expandedEvaluatorId, setExpandedEvaluatorId] = useState(evaluator?._id);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterInstitute, setFilterInstitute] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterBranch, setFilterBranch] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  useEffect(() => {
    if (!isOpen || !event?._id || !track?.id) return;
    setLoading(true);
    setParticipants([]);
    setSelectedTeamIds(new Set());
    fetch(`${API_BASE}/api/participants/by-track?eventId=${event._id}&trackId=${track.id}`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setParticipants(data.participants); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, event?._id, track?.id]);

  const toggleSelection = useCallback((id) => {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTeamIds(new Set());
  }, []);

  const handleAssign = useCallback(async (participantIdsArray, evaluatorId) => {
    const idsToAssign = Array.isArray(participantIdsArray) ? participantIdsArray : [participantIdsArray];
    if (idsToAssign.length === 0) return;

    const newId = evaluatorId ? String(evaluatorId) : null;

    setAssigningId(idsToAssign[0]);
    
    // Optimistic update
    setParticipants((ps) =>
      ps.map((p) => {
        if (!idsToAssign.includes(p._id)) return p;
        const newArr = [...(p.assignedEvaluators || [])];
        if (evaluatorId) {
          if (!newArr.includes(evaluatorId)) newArr.push(evaluatorId);
        } else {
          // If unassigning, remove this specific evaluator from the array
          const idx = newArr.indexOf(evaluator._id);
          if (idx !== -1) newArr.splice(idx, 1);
        }
        return { ...p, assignedEvaluators: newArr };
      })
    );

    try {
      if (idsToAssign.length === 1) {
        // Single assign
        const res = await fetch(`${API_BASE}/api/admin/participants/${idsToAssign[0]}/assign`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ evaluatorId: evaluatorId ?? null, fromEvaluatorId: evaluator?._id }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
      } else {
        // Bulk assign via new endpoint
        const res = await fetch(`${API_BASE}/api/admin/participants/bulk-assign`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantIds: idsToAssign, evaluatorId: evaluatorId ?? null, fromEvaluatorId: evaluator?._id }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
      }
      
      setSavedId(idsToAssign[0]); 
      
      let evaluatorName = evaluator ? evaluator.name : "";
      const teamText = idsToAssign.length !== 1 ? 'teams' : 'team';
      const msg = evaluatorId 
        ? `${idsToAssign.length} ${teamText} assigned to ${evaluatorName}!`
        : `${idsToAssign.length} ${teamText} unassigned from ${evaluatorName}!`;
        
      setSavedMessage(msg);
      setTimeout(() => {
        setSavedId(null);
        setSavedMessage(null);
      }, 2500);
      setSelectedTeamIds(new Set()); // clear selection after successful assign
    } catch (err) {
      console.error("Assignment error:", err);
      // Fallback: Re-fetch participants if bulk fails
      fetch(`${API_BASE}/api/participants/by-track?eventId=${event._id}&trackId=${track.id}`)
        .then((r) => r.json())
        .then((data) => { if (data.success) setParticipants(data.participants); })
        .catch(console.error);
    } finally {
      setAssigningId(null);
    }
  }, [participants, event, track]);

  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over) return;
    const targetColumnId = over.id;
    const newEvaluatorId = targetColumnId === "unassigned" ? null : targetColumnId;
    
    if (selectedTeamIds.has(active.id)) {
      handleAssign(Array.from(selectedTeamIds), newEvaluatorId);
    } else {
      handleAssign([active.id], newEvaluatorId);
    }
  };

  const unassigned = participants.filter((p) => !p.assignedEvaluators?.includes(evaluator?._id));

  // Parse locations for unassigned teams
  const parsedUnassignedLocations = unassigned.map(p => {
    const leader = p.members?.find(m => m.isLeader);
    return parseLocation(leader?.location);
  });

  // Extract unique filter options from all unassigned teams
  const uniqueInstitutes = [...new Set(unassigned.map(p => p.members?.find(m => m.isLeader)?.organisation).filter(Boolean))].sort();
  const uniqueCities = [...new Set(parsedUnassignedLocations.map(loc => loc.city).filter(Boolean))].sort();
  const uniqueStates = [...new Set(parsedUnassignedLocations.map(loc => loc.state).filter(Boolean))].sort();
  const uniqueCountries = [...new Set(parsedUnassignedLocations.map(loc => loc.country).filter(Boolean))].sort();
  const uniqueBranches = [...new Set(unassigned.map(p => {
    const l = p.members?.find(m => m.isLeader);
    return l?.specialization || l?.domain;
  }).filter(Boolean))].sort();

  const filteredUnassigned = unassigned.filter(p => {
    const leader = p.members?.find(m => m.isLeader);
    const loc = parseLocation(leader?.location);

    const searchMatch = !searchQuery || 
      String(p.teamName || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
      String(p.teamId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(leader?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const instMatch = !filterInstitute || leader?.organisation === filterInstitute;
    const cityMatch = !filterCity || loc.city === filterCity;
    const stateMatch = !filterState || loc.state === filterState;
    const countryMatch = !filterCountry || loc.country === filterCountry;
    const branchMatch = !filterBranch || (leader?.specialization || leader?.domain) === filterBranch;

    return searchMatch && instMatch && cityMatch && stateMatch && countryMatch && branchMatch;
  });

  const selectAllUnassigned = () => {
    const ids = filteredUnassigned.map(p => p._id);
    if (selectedTeamIds.size > 0 && selectedTeamIds.size === ids.length) {
      setSelectedTeamIds(new Set());
    } else {
      setSelectedTeamIds(new Set(ids));
    }
  };

  const byEvaluator = (evalId) =>
    participants.filter((p) => p.assignedEvaluators?.includes(evalId));
  const assigned = participants.length - unassigned.length;
  const activeDragParticipant = activeId ? participants.find((p) => p._id === activeId) : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="relative flex flex-col bg-white w-full h-full sm:h-[90vh] sm:w-[95vw] sm:max-w-[1600px] sm:rounded-2xl shadow-2xl overflow-hidden">

        {/* Header — site theme (green-600 = #ba3b78) */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 bg-green-600">
          <div className="min-w-0">
            <h2 className="font-bold text-lg text-white">Assign Teams</h2>
            <p className="text-sm text-white/75 mt-0.5 truncate">
              {track?.title} — drag ⠿ or tap ⋮ to assign
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors ml-4 flex-shrink-0 text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 px-5 py-2.5 bg-gray-50 border-b text-sm text-gray-600 flex-shrink-0 overflow-x-auto whitespace-nowrap">
          <span><strong className="text-gray-800">{participants.length}</strong> teams total</span>
          <span className="text-gray-300">|</span>
          <span><strong className="text-green-600">{assigned}</strong> assigned</span>
          <span className="text-gray-300">|</span>
          <span><strong className="text-amber-600">{unassigned.length}</strong> unassigned</span>
          {unassigned.length === 0 && participants.length > 0 && (
            <>
              <span className="text-gray-300">|</span>
              <span className="text-green-600 font-semibold flex items-center gap-1">
                <CheckCircle size={13} /> All assigned
              </span>
            </>
          )}
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 gap-3">
            <Loader2 className="animate-spin" size={22} />
            Loading teams…
          </div>
        ) : participants.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm italic">
            No teams have been added to this track yet.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Two-pane layout: Unassigned | Evaluators */}
            <div className="flex-1 overflow-hidden flex flex-col sm:flex-row">

              {/* Left pane — Unassigned pool */}
              <div className="sm:w-[400px] flex-shrink-0 flex flex-col border-b sm:border-b-0 sm:border-r border-gray-200 bg-gray-50/30 min-h-0">
                {/* Bulk Actions Header */}
                <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between shadow-sm z-10">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={selectAllUnassigned}
                      className="text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 text-sm font-medium"
                    >
                      {selectedTeamIds.size > 0 && selectedTeamIds.size === filteredUnassigned.length ? (
                        <CheckSquare size={18} className="text-blue-600" />
                      ) : (
                        <Square size={18} />
                      )}
                      <span>Select All</span>
                    </button>
                  </div>
                  {selectedTeamIds.size > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200 shadow-sm whitespace-nowrap">
                        {selectedTeamIds.size} Selected
                      </span>
                      <select
                        className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-gray-50 focus:outline-none focus:border-blue-300 w-28 text-gray-700"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssign(Array.from(selectedTeamIds), e.target.value);
                          }
                        }}
                      >
                        <option value="" disabled>Assign to...</option>
                        {evaluator && (
                          <option value={evaluator._id}>
                            {evaluator.name}
                          </option>
                        )}
                      </select>
                      <button 
                        onClick={clearSelection}
                        className="text-xs text-gray-500 hover:text-gray-700 underline font-medium"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                {/* Search & Filters */}
                <div className="px-3 py-2 bg-white border-b border-gray-200 flex flex-col gap-2 shadow-sm z-10">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search teams, ID, leader..."
                      className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500 transition-shadow"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <Filter className="absolute left-2 top-1.5 h-3.5 w-3.5 text-gray-400" />
                        <select 
                          className="w-full pl-7 pr-6 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs appearance-none focus:outline-none focus:ring-1 focus:ring-green-500"
                          value={filterInstitute}
                          onChange={(e) => setFilterInstitute(e.target.value)}
                        >
                          <option value="">All Institutes</option>
                          {uniqueInstitutes.map(inst => <option key={inst} value={inst}>{inst}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                      </div>
                      <div className="relative">
                        <Filter className="absolute left-2 top-1.5 h-3.5 w-3.5 text-gray-400" />
                        <select 
                          className="w-full pl-7 pr-6 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs appearance-none focus:outline-none focus:ring-1 focus:ring-green-500"
                          value={filterBranch}
                          onChange={(e) => setFilterBranch(e.target.value)}
                        >
                          <option value="">All Branches</option>
                          {uniqueBranches.map(branch => <option key={branch} value={branch}>{branch}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="relative">
                        <Filter className="absolute left-2 top-1.5 h-3.5 w-3.5 text-gray-400" />
                        <select 
                          className="w-full pl-7 pr-6 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs appearance-none focus:outline-none focus:ring-1 focus:ring-green-500"
                          value={filterCity}
                          onChange={(e) => setFilterCity(e.target.value)}
                        >
                          <option value="">City</option>
                          {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                      </div>
                      <div className="relative">
                        <Filter className="absolute left-2 top-1.5 h-3.5 w-3.5 text-gray-400" />
                        <select 
                          className="w-full pl-7 pr-6 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs appearance-none focus:outline-none focus:ring-1 focus:ring-green-500"
                          value={filterState}
                          onChange={(e) => setFilterState(e.target.value)}
                        >
                          <option value="">State</option>
                          {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                      </div>
                      <div className="relative">
                        <Filter className="absolute left-2 top-1.5 h-3.5 w-3.5 text-gray-400" />
                        <select 
                          className="w-full pl-7 pr-6 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs appearance-none focus:outline-none focus:ring-1 focus:ring-green-500"
                          value={filterCountry}
                          onChange={(e) => setFilterCountry(e.target.value)}
                        >
                          <option value="">Country</option>
                          {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                <DroppableZone id="unassigned" className="flex-1 flex flex-col min-h-0 px-3 pb-3 pt-2">
                  <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                    {filteredUnassigned.length === 0 ? (
                      <p className="text-xs text-gray-400 italic text-center py-6 select-none">
                        {unassigned.length === 0 ? "All teams assigned ✓" : "No teams match filters."}
                      </p>
                    ) : (
                      filteredUnassigned.map((p) => (
                        <DraggableTeamCard
                          key={p._id}
                          participant={p}
                          evaluator={evaluator}
                          onAssign={(ids, evId) => handleAssign(ids, evId)}
                          assigning={assigningId === p._id}
                          saved={savedId === p._id}
                          isDragging={activeId === p._id}
                          isSelected={selectedTeamIds.has(p._id)}
                          onToggleSelect={toggleSelection}
                        />
                      ))
                    )}
                  </div>
                </DroppableZone>
              </div>

              {/* Right pane — Evaluators stacked vertically */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                {!evaluator ? (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm italic text-center px-8">
                    No evaluator selected.
                  </div>
                ) : (
                  <EvaluatorSection
                    key={evaluator._id}
                    evaluator={evaluator}
                    teams={byEvaluator(evaluator._id)}
                    onAssign={handleAssign}
                    assigningId={assigningId}
                    savedId={savedId}
                    colorClass={EVALUATOR_COLORS[0]}
                    activeId={activeId}
                    isExpanded={true}
                    onToggleExpand={() => {}}
                  />
                )}
              </div>
            </div>

            <DragOverlay>
              <GhostCard 
                participant={activeDragParticipant} 
                selectedCount={activeId && selectedTeamIds.has(activeId) ? selectedTeamIds.size : 1}
              />
            </DragOverlay>
          </DndContext>
        )}

        {/* Saved toast */}
        {savedMessage && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white text-sm px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 pointer-events-none z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CheckCircle size={16} /> {savedMessage}
          </div>
        )}
      </div>
    </div>
  );
}
