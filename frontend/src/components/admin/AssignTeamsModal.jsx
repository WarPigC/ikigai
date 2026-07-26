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
import { X, Users, MoreVertical, Loader2, CheckCircle, GripVertical } from "lucide-react";

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
function DraggableTeamCard({ participant, evaluators, onAssign, assigning, saved, isDragging }) {
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
      className={`bg-white border rounded-xl shadow-sm select-none transition-all cursor-grab active:cursor-grabbing touch-manipulation ${
        assigning ? "opacity-50" : ""
      } ${saved ? "border-green-400 ring-1 ring-green-300" : "border-gray-200"} ${
        isDragging ? "opacity-0" : "hover:shadow-md hover:border-gray-300"
      }`}
    >
      <div className="flex items-stretch">
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
              {leader && (
                <p className="text-sm text-gray-500 mt-0.5 truncate">👤 {leader.name}</p>
              )}
              <p className="text-sm text-gray-400 mt-0.5">
                <Users size={12} className="inline mr-0.5" />
                {participant.members?.length ?? 0} member{participant.members?.length !== 1 ? "s" : ""}
              </p>
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
                      onClick={() => { onAssign(participant._id, null); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                      Unassigned
                    </button>
                    {evaluators.map((ev) => (
                      <button
                        key={ev._id}
                        onClick={() => { onAssign(participant._id, ev._id); setMenuOpen(false); }}
                        className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-800 flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                        {ev.name}
                      </button>
                    ))}
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
function GhostCard({ participant }) {
  if (!participant) return null;
  return (
    <div className="bg-white border-2 border-green-500 rounded-xl p-3 shadow-2xl w-64 rotate-1 opacity-90">
      <p className="font-semibold text-gray-800 text-base truncate">{participant.teamName}</p>
      {participant.teamId && (
        <p className="text-sm text-gray-400 font-mono">{participant.teamId}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Evaluator Section (droppable, stacked vertically)
// ─────────────────────────────────────────────────────────────────────────────
function EvaluatorSection({ evaluator, teams, evaluators, onAssign, assigningId, savedId, colorClass, activeId }) {
  return (
    <DroppableZone id={evaluator._id}>
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {/* Evaluator header */}
        <div className={`px-4 py-3 flex items-center justify-between ${colorClass}`}>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{evaluator.name}</p>
            <p className="text-xs opacity-70 truncate">{evaluator.email}</p>
          </div>
          <span className="text-xs font-bold bg-white/60 rounded-full px-2 py-0.5 flex-shrink-0 ml-2">
            {teams.length} team{teams.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Teams assigned to this evaluator */}
        <div className="p-3 space-y-2 min-h-[70px] bg-white">
          {teams.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-3 select-none">
              Drop teams here
            </p>
          ) : (
            teams.map((p) => (
              <DraggableTeamCard
                key={p._id}
                participant={p}
                evaluators={evaluators}
                onAssign={onAssign}
                assigning={assigningId === p._id}
                saved={savedId === p._id}
                isDragging={activeId === p._id}
              />
            ))
          )}
        </div>
      </div>
    </DroppableZone>
  );
}

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

export default function AssignTeamsModal({ isOpen, onClose, event, track, evaluators }) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  useEffect(() => {
    if (!isOpen || !event?._id || !track?.id) return;
    setLoading(true);
    setParticipants([]);
    fetch(`${API_BASE}/api/participants/by-track?eventId=${event._id}&trackId=${track.id}`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setParticipants(data.participants); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, event?._id, track?.id]);

  const handleAssign = useCallback(async (participantId, evaluatorId) => {
    const prev = participants.find((p) => p._id === participantId);
    const prevEvalId = prev?.assignedEvaluatorId ?? null;
    const newId = evaluatorId ? String(evaluatorId) : null;
    if ((prevEvalId ? String(prevEvalId) : null) === newId) return;

    setAssigningId(participantId);
    setParticipants((ps) =>
      ps.map((p) => p._id === participantId ? { ...p, assignedEvaluatorId: evaluatorId ?? null } : p)
    );

    try {
      const res = await fetch(`${API_BASE}/api/admin/participants/${participantId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluatorId: evaluatorId ?? null }),
      });
      const data = await res.json();
      if (!data.success) {
        setParticipants((ps) =>
          ps.map((p) => p._id === participantId ? { ...p, assignedEvaluatorId: prevEvalId } : p)
        );
        console.error("Assignment failed:", data.message);
      } else {
        setSavedId(participantId);
        setTimeout(() => setSavedId(null), 1500);
      }
    } catch (err) {
      setParticipants((ps) =>
        ps.map((p) => p._id === participantId ? { ...p, assignedEvaluatorId: prevEvalId } : p)
      );
      console.error("Assignment error:", err);
    } finally {
      setAssigningId(null);
    }
  }, [participants]);

  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over) return;
    const targetColumnId = over.id;
    const newEvaluatorId = targetColumnId === "unassigned" ? null : targetColumnId;
    handleAssign(active.id, newEvaluatorId);
  };

  const unassigned = participants.filter((p) => !p.assignedEvaluatorId);
  const byEvaluator = (evalId) =>
    participants.filter((p) => String(p.assignedEvaluatorId) === String(evalId));
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
              <div className="sm:w-72 flex-shrink-0 flex flex-col border-b sm:border-b-0 sm:border-r border-gray-200 min-h-0">
                <DroppableZone id="unassigned" className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                    {unassigned.length === 0 ? (
                      <p className="text-xs text-gray-400 italic text-center py-6 select-none">
                        All teams assigned ✓
                      </p>
                    ) : (
                      unassigned.map((p) => (
                        <DraggableTeamCard
                          key={p._id}
                          participant={p}
                          evaluators={evaluators}
                          onAssign={handleAssign}
                          assigning={assigningId === p._id}
                          saved={savedId === p._id}
                          isDragging={activeId === p._id}
                        />
                      ))
                    )}
                  </div>
                </DroppableZone>
              </div>

              {/* Right pane — Evaluators stacked vertically */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {evaluators.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm italic text-center px-8">
                    No evaluators in this track yet.<br />Add evaluators first, then assign teams.
                  </div>
                ) : (
                  evaluators.map((ev, i) => (
                    <EvaluatorSection
                      key={ev._id}
                      evaluator={ev}
                      teams={byEvaluator(ev._id)}
                      evaluators={evaluators}
                      onAssign={handleAssign}
                      assigningId={assigningId}
                      savedId={savedId}
                      colorClass={EVALUATOR_COLORS[i % EVALUATOR_COLORS.length]}
                      activeId={activeId}
                    />
                  ))
                )}
              </div>
            </div>

            <DragOverlay dropAnimation={null}>
              <GhostCard participant={activeDragParticipant} />
            </DragOverlay>
          </DndContext>
        )}

        {/* Saved toast */}
        {savedId && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 pointer-events-none z-50">
            <CheckCircle size={14} /> Saved
          </div>
        )}
      </div>
    </div>
  );
}
