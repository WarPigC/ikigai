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
} from "@dnd-kit/core";
import { X, Users, MoreVertical, Loader2, CheckCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// ─────────────────────────────────────────────────────────────────────────────
// Droppable zone wrapper
// ─────────────────────────────────────────────────────────────────────────────
function DroppableZone({ id, children }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef} className="h-full">{children}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Team Card — shown in Unassigned pool and evaluator columns
// ─────────────────────────────────────────────────────────────────────────────
function TeamCard({ participant, evaluators, onAssign, assigning, saved }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const leader = participant.members?.find((m) => m.isLeader) || participant.members?.[0];

  return (
    <div
      className={`bg-white border rounded-xl p-3 shadow-sm select-none transition-all ${
        assigning ? "opacity-60" : "hover:shadow-md"
      } ${saved ? "border-green-400 ring-1 ring-green-300" : "border-gray-200"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-800 text-sm leading-tight truncate">
            {participant.teamName}
          </p>
          {participant.teamId && (
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{participant.teamId}</p>
          )}
          {leader && (
            <p className="text-xs text-gray-500 mt-1 truncate">👤 {leader.name}</p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">
            <Users size={10} className="inline mr-0.5" />
            {participant.members?.length ?? 0} member{participant.members?.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Kebab menu — mobile fallback */}
        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 touch-manipulation"
            aria-label="Assign to evaluator"
          >
            {assigning ? (
              <Loader2 size={16} className="animate-spin" />
            ) : saved ? (
              <CheckCircle size={16} className="text-green-500" />
            ) : (
              <MoreVertical size={16} />
            )}
          </button>

          {menuOpen && (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
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
                    className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                    {ev.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Column — one per evaluator + one "Unassigned"
// ─────────────────────────────────────────────────────────────────────────────
const COLUMN_COLORS = [
  "bg-blue-50 text-blue-800",
  "bg-purple-50 text-purple-800",
  "bg-green-50 text-green-800",
  "bg-rose-50 text-rose-800",
  "bg-teal-50 text-teal-800",
];

function Column({ columnId, label, colorClass, teams, evaluators, onAssign, assigningId, savedId, isOver }) {
  return (
    <div
      className={`flex-shrink-0 w-[240px] sm:w-64 flex flex-col rounded-2xl border-2 transition-colors ${
        isOver ? "border-indigo-400 bg-indigo-50/50" : "border-gray-200 bg-gray-50/40"
      }`}
    >
      {/* Column header */}
      <div className={`px-4 py-3 rounded-t-xl border-b border-gray-200 ${colorClass}`}>
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-sm truncate">{label}</p>
          <span className="text-xs font-bold bg-white/60 rounded-full px-2 py-0.5 flex-shrink-0">
            {teams.length}
          </span>
        </div>
      </div>

      {/* Team cards */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto min-h-[100px] max-h-[58vh]">
        {teams.length === 0 ? (
          <p className="text-xs text-gray-400 italic text-center pt-4 select-none">
            {columnId === "unassigned" ? "All teams assigned ✓" : "Drop teams here"}
          </p>
        ) : (
          teams.map((p) => (
            <TeamCard
              key={p._id}
              participant={p}
              evaluators={evaluators}
              onAssign={onAssign}
              assigning={assigningId === p._id}
              saved={savedId === p._id}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────────────────────────────────────
export default function AssignTeamsModal({ isOpen, onClose, event, track, evaluators }) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [overColumnId, setOverColumnId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  // Fetch all teams for this track when modal opens
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

  // Core assignment — called by drag-drop and kebab menu
  const handleAssign = useCallback(async (participantId, evaluatorId) => {
    // Snapshot for potential rollback
    const prev = participants.find((p) => p._id === participantId);
    const prevEvalId = prev?.assignedEvaluatorId ?? null;

    // Skip no-op
    const newId = evaluatorId ? String(evaluatorId) : null;
    if ((prevEvalId ? String(prevEvalId) : null) === newId) return;

    setAssigningId(participantId);

    // Optimistic update
    setParticipants((ps) =>
      ps.map((p) =>
        p._id === participantId ? { ...p, assignedEvaluatorId: evaluatorId ?? null } : p
      )
    );

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/participants/${participantId}/assign`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ evaluatorId: evaluatorId ?? null }),
        }
      );
      const data = await res.json();
      if (!data.success) {
        // Roll back
        setParticipants((ps) =>
          ps.map((p) =>
            p._id === participantId ? { ...p, assignedEvaluatorId: prevEvalId } : p
          )
        );
        console.error("❌ Assignment failed:", data.message);
      } else {
        setSavedId(participantId);
        setTimeout(() => setSavedId(null), 1500);
      }
    } catch (err) {
      setParticipants((ps) =>
        ps.map((p) =>
          p._id === participantId ? { ...p, assignedEvaluatorId: prevEvalId } : p
        )
      );
      console.error("❌ Assignment network error:", err);
    } finally {
      setAssigningId(null);
    }
  }, [participants]);

  // ── dnd-kit handlers ──────────────────────────────────────────────────────
  const handleDragStart = ({ active }) => setActiveId(active.id);
  const handleDragOver = ({ over }) => setOverColumnId(over?.id ?? null);
  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    setOverColumnId(null);
    if (!over) return;
    const targetColumnId = over.id; // "unassigned" | evaluatorId
    const newEvaluatorId = targetColumnId === "unassigned" ? null : targetColumnId;
    handleAssign(active.id, newEvaluatorId);
  };

  // ── Partition into columns ─────────────────────────────────────────────────
  const unassigned = participants.filter((p) => !p.assignedEvaluatorId);
  const byEvaluator = (evaluatorId) =>
    participants.filter((p) => String(p.assignedEvaluatorId) === String(evaluatorId));

  const activeDragParticipant = activeId
    ? participants.find((p) => p._id === activeId)
    : null;

  const assigned = participants.length - unassigned.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/50 backdrop-blur-sm">
      <div className="relative flex flex-col bg-white w-full h-full sm:h-auto sm:max-h-[92vh] sm:m-auto sm:rounded-2xl sm:w-auto shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex-shrink-0">
          <div className="min-w-0">
            <h2 className="font-bold text-lg">Assign Teams</h2>
            <p className="text-sm text-violet-200 mt-0.5 truncate">
              {track?.title} — drag or tap ⋮ to assign
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors ml-4 flex-shrink-0"
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
                <CheckCircle size={14} /> All assigned
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
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
              <div className="flex gap-4 p-4 h-full" style={{ minWidth: `${(evaluators.length + 1) * 280}px` }}>

                {/* Unassigned column */}
                <DroppableZone id="unassigned">
                  <Column
                    columnId="unassigned"
                    label="Unassigned"
                    colorClass="bg-amber-50 text-amber-800"
                    teams={unassigned}
                    evaluators={evaluators}
                    onAssign={handleAssign}
                    assigningId={assigningId}
                    savedId={savedId}
                    isOver={overColumnId === "unassigned"}
                  />
                </DroppableZone>

                {/* Separator */}
                {evaluators.length > 0 && (
                  <div className="w-px bg-gray-200 self-stretch flex-shrink-0" />
                )}

                {/* Evaluator columns */}
                {evaluators.length === 0 ? (
                  <div className="flex items-center justify-center w-64 text-gray-400 text-sm italic px-4 text-center self-center">
                    Add evaluators to this track first — then you can assign teams.
                  </div>
                ) : (
                  evaluators.map((ev, i) => (
                    <DroppableZone key={ev._id} id={ev._id}>
                      <Column
                        columnId={ev._id}
                        label={ev.name}
                        colorClass={COLUMN_COLORS[i % COLUMN_COLORS.length]}
                        teams={byEvaluator(ev._id)}
                        evaluators={evaluators}
                        onAssign={handleAssign}
                        assigningId={assigningId}
                        savedId={savedId}
                        isOver={overColumnId === ev._id}
                      />
                    </DroppableZone>
                  ))
                )}
              </div>
            </div>

            {/* Drag overlay ghost */}
            <DragOverlay dropAnimation={null}>
              {activeDragParticipant ? (
                <div className="bg-white border-2 border-indigo-400 rounded-xl p-3 shadow-2xl w-56 opacity-90 rotate-1">
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {activeDragParticipant.teamName}
                  </p>
                  {activeDragParticipant.teamId && (
                    <p className="text-xs text-gray-400 font-mono">{activeDragParticipant.teamId}</p>
                  )}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Saved toast — floats above content */}
        {savedId && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 pointer-events-none z-50">
            <CheckCircle size={14} /> Saved
          </div>
        )}
      </div>
    </div>
  );
}
