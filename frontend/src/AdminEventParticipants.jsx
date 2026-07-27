import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { X, User, MapPin, Building2, BookOpen, GraduationCap, CheckCircle, Mail, Phone, ExternalLink, Link2, FileText, AlertCircle } from "lucide-react";
import ikigaiLogo from "./assets/ikigai.png";
import { ASSESSMENT_CRITERIA } from "./App";


const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function AdminEventParticipants() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [participants, setParticipants] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topNPerTrack, setTopNPerTrack] = useState(0);


  // filters
  const [selectedTrack, setSelectedTrack] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [selectedEvaluationReport, setSelectedEvaluationReport] = useState(null);
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  // filtering
  const [filterTrack, setFilterTrack] = useState("ALL");
  const [filterInstitute, setFilterInstitute] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [marksRange, setMarksRange] = useState([0, 100]);
  const [showFilters, setShowFilters] = useState(false);



  // 🔐 admin guard
  useEffect(() => {
    const role = sessionStorage.getItem("care_role");
    if (role !== "admin") {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/events/${eventId}/participants`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const mapped = (data.participants || []).map((p) => {
            const leader = p.members?.find((m) => m.isLeader) || p.members?.[0] || {};
            return {
              ...p,
              paperId: p.teamId || p._id,
              teamName: p.teamName || "",
              paperTitle: p.problemStatement || "",
              presenterName: leader.name || "Unknown",
              email: leader.email || "",
              phone: leader.mobile || "",
              institute: leader.organisation || "",
              branch: leader.domain || leader.specialization || "",
              trackId: p.trackId,
              trackName: p.trackName,
              assessment: p.assessment,
              assignedEvaluator: p.assignedEvaluatorId,
            };
          });
          setParticipants(mapped);
          setTracks(data.tracks || []);
        }
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  const getTopNPerTrack = (list, n) => {
    if (!n || n <= 0) return list;

    const trackMap = {};

    list.forEach((p) => {
      const marks = p.assessment?.total;
      if (typeof marks !== "number") return;

      const key = p.trackId || p.trackName || "UNKNOWN";

      if (!trackMap[key]) trackMap[key] = [];
      trackMap[key].push(p);
    });

    let result = [];

    Object.values(trackMap).forEach((trackParticipants) => {
      trackParticipants.sort(
        (a, b) => b.assessment.total - a.assessment.total
      );

      result.push(...trackParticipants.slice(0, n));
    });

    return result;
  };



  const filteredParticipants = participants
    .filter((p) => {
      // 🟢 Track filter
      const trackMatch =
        filterTrack === "ALL" ||
        String(p.trackId) === String(filterTrack);

      // 🟢 Institute filter
      const instituteMatch =
        !filterInstitute ||
        p.institute?.toLowerCase().includes(filterInstitute.toLowerCase());

      // 🟢 Branch filter
      const branchMatch =
        !filterBranch ||
        p.branch?.toLowerCase().includes(filterBranch.toLowerCase());

      // 🟢 Marks filter
      const marks = p.assessment?.total ?? -1;
      const marksMatch =
        marks === -1 ||
        (marks >= marksRange[0] && marks <= marksRange[1]);

      return (
        trackMatch &&
        instituteMatch &&
        branchMatch &&
        marksMatch
      );
    }).sort((a, b) => {
      if (!sortBy) return 0;

      let valA, valB;

      if (sortBy === "paperId") {
        valA = a.paperId;
        valB = b.paperId;
      }

      if (sortBy === "marks") {
        valA = a.assessment?.total ?? -1;
        valB = b.assessment?.total ?? -1;
      }

      return sortOrder === "asc"
        ? valA > valB ? 1 : -1
        : valA < valB ? 1 : -1;
    });

  const finalParticipants = getTopNPerTrack(
    filteredParticipants,
    topNPerTrack
  );

  const participantsWithRank = (() => {
    const trackCounters = {};
    const result = [];

    finalParticipants.forEach((p) => {
      const trackKey = p.trackId || p.trackName || "UNKNOWN";

      if (!trackCounters[trackKey]) {
        trackCounters[trackKey] = 1;
      }

      result.push({
        ...p,
        trackRank: trackCounters[trackKey],
      });

      trackCounters[trackKey] += 1;
    });

    return result;
  })();




  const exportData = () =>
    finalParticipants.map((p) => ({
      "Team ID": p.paperId,
      "Presenter Name": p.presenterName,
      "Institute": p.institute || "",
      "Track Name": p.trackName,
      "Marks": p.assessment?.total ?? "",
    }));
  const trackName = filteredParticipants[0]?.trackName || "Track";

  const exportParticipantsCSV = () => {
    if (!participantsWithRank.length) {
      alert("No participants to export");
      return;
    }

    const headers = [
      "Track Rank",
      "Team ID",
      "Team Name",
      "Problem Statement",
      "Track Name",
      "Presenter Name",
      "Email",
      "Phone",
      "Institute",
      "Branch",
      "Marks",
    ];

    const rows = participantsWithRank.map((p) => [
      p.trackRank,
      p.paperId,
      p.teamName,
      p.paperTitle,
      p.trackName,
      p.presenterName,
      p.email ?? "",
      p.phone ?? "",
      p.institute ?? "",
      p.branch ?? "",
      typeof p.assessment?.total === "number"
        ? p.assessment.total
        : "Pending",
    ]);

    const csvContent =
      [headers, ...rows]
        .map((row) =>
          row
            .map((cell) =>
              `"${String(cell).replace(/"/g, '""')}"`
            )
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `IKIGAI_2026_Report_${selectedTrack}_top${topNPerTrack || "all"}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const exportParticipantsXLSX = () => {
    if (!finalParticipants.length) {
      alert("No participants to export");
      return;
    }

    // ✅ SAME logic as PDF
    const trackName = finalParticipants[0]?.trackName || "All Tracks";

    const rows = participantsWithRank.map((p) => {
      const marks =
        typeof p.assessment?.total === "number"
          ? p.assessment.total
          : "Pending";

      return {
        "Track Rank": p.trackRank,
        "Team ID": p.paperId,
        "Team Name": p.teamName,
        "Problem Statement": p.paperTitle,
        "Track Name": p.trackName,
        "Presenter Name": p.presenterName,
        "Email": p.email || "",
        "Phone": p.phone || "",
        "Institute": p.institute || "",
        "Branch": p.branch || "",
        "Marks": marks,
        "Remarks": p.assessment?.remarks ?? "",
        "Submission Link": p.submissionLink ?? "",
        "Co-Authors": p.coAuthors?.length
          ? p.coAuthors
            .map((c) => `${c.name} (${c.email})`)
            .join("; ")
          : "",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // ✅ Auto column width (safe even if rows are empty)
    const colWidths = Object.keys(rows[0]).map((key) => ({
      wch: Math.max(
        key.length,
        ...rows.map((r) => String(r[key] ?? "").length)
      ) + 2,
    }));

    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Participants"
    );

    // ✅ SAME naming convention as PDF
    XLSX.writeFile(
      workbook,
      `IKIGAI_2026_Report_${selectedTrack}_${trackName}.xlsx`
    );
  };


  const exportParticipantsPDF = () => {
    if (!participantsWithRank.length) {

      alert("No participants to export");
      return;
    }

    const doc = new jsPDF("p", "mm", "a4");
    doc.setFont("helvetica", "normal");

    /* ================= HEADER ================= */
    doc.setFillColor(250, 245, 255); // purple-50
    doc.rect(0, 0, 210, 34, "F");

    // Add the IKIGAI logo (left aligned, aspect ratio maintained)
    doc.addImage(ikigaiLogo, "PNG", 14, 8, 45, 15);

    // Add Assessment Report header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(107, 33, 168); // purple-800
    doc.text("Assessment Report", 105, 20, { align: "center" });

    doc.setDrawColor(200, 200, 200);
    doc.line(14, 32, 196, 32);

    /* ================= META ================= */
    let y = 40;
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    const trackName =
      participantsWithRank[0]?.trackName || "All Tracks";


    doc.text(
      `Track: ${selectedTrack === "ALL" ? "All" : selectedTrack} – ${trackName}`,
      14,
      y
    );
    y += 10;

    /* ================= TABLE ================= */
    const tableRows = participantsWithRank.map((p) => {
      const marks =
        typeof p.assessment?.total === "number"
          ? p.assessment.total
          : "Absent";

      const leaderName = p.members?.find(m => m.isLeader)?.name || p.members?.[0]?.name || p.presenterName || "";

      return [
        p.trackRank,
        p.paperId,
        p.teamName,
        p.paperTitle,
        p.trackName,
        leaderName,
        p.phone || "",
        p.email || "",
        marks,
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [[
        "Track Rank",
        "Team ID",
        "Team Name",
        "Problem Statement",
        "Track",
        "Team Leader",
        "Phone",
        "Email",
        "Marks",
      ]],
      body: tableRows,
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [107, 33, 168], // purple-800
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 15 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 15 },
        5: { cellWidth: 22 },
        6: { cellWidth: 22 },
        7: { cellWidth: 30 },
        8: { cellWidth: 18 },
      },
      margin: { left: 14, right: 14 },
    });

    /* ================= FOOTER ================= */
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(
        `Generated for Ikigai 2026 • Page ${i} of ${pageCount}`,
        105,
        290,
        { align: "center" }
      );
    }

    /* ================= SAVE ================= */
    doc.save(
      `IKIGAI_2026_Report_${selectedTrack}_${trackName}.pdf`
    );
  };



  if (loading) {
    return <div className="p-6">Loading participants…</div>;
  }

  return (
    <div className="flex-1 p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Participants
        </h2>

        <button
          onClick={() => navigate("/dashboard")}
          className="text-sm text-green-700 hover:underline"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* FILTERS + ACTIONS */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        {/* SEARCH */}
        {/* ================= CONTROLS WRAPPER ================= */}
        <div className="bg-white border border-green-100 rounded-xl p-4 mb-6 w-full">

          {/* HEADER ROW */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Sorting & Filtering
            </h3>

            <button
              onClick={() => setShowFilters((v) => !v)}
              className="text-sm font-medium text-green-700 hover:underline"
            >
              {showFilters ? "Hide Filters ▲" : "Show Filters ▼"}
            </button>
          </div>

          {/* ================= COLLAPSIBLE FILTERS ================= */}
          {showFilters && (
            <div className="space-y-4">

              {/* SORTING */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">
                  Sort
                </span>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border rounded-lg px-3 py-1.5 text-sm"
                >
                  <option value="">Select field</option>
                  <option value="paperId">Team ID</option>
                  <option value="marks">Total Marks</option>
                </select>

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="border rounded-lg px-3 py-1.5 text-sm"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>

              </div>

              {/* FILTERING */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">
                  Filter
                </span>

                {/* Track */}
                <select
                  value={filterTrack}
                  onChange={(e) => {
                    setFilterTrack(e.target.value);
                    setSelectedTrack(e.target.value);
                  }}
                  className="border rounded-lg px-3 py-1.5 text-sm"
                >
                  <option value="ALL">All Tracks</option>
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Institute"
                  value={filterInstitute}
                  onChange={(e) => setFilterInstitute(e.target.value)}
                  className="border rounded-lg px-3 py-1.5 text-sm"
                />

                <input
                  type="number"
                  min={0}
                  placeholder="Top N per track"
                  value={topNPerTrack}
                  onChange={(e) => setTopNPerTrack(Number(e.target.value))}
                  className="border rounded-lg px-3 py-1.5 text-sm w-36"
                />


                <input
                  type="text"
                  placeholder="Branch"
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  className="border rounded-lg px-3 py-1.5 text-sm"
                />

                <input
                  type="number"
                  placeholder="Min marks"
                  className="border rounded-lg px-2 py-1.5 text-sm w-24"
                  value={marksRange[0]}
                  onChange={(e) =>
                    setMarksRange([Number(e.target.value), marksRange[1]])
                  }
                />

                <span className="text-gray-400 text-sm">–</span>

                <input
                  type="number"
                  placeholder="Max marks"
                  className="border rounded-lg px-2 py-1.5 text-sm w-24"
                  value={marksRange[1]}
                  onChange={(e) =>
                    setMarksRange([marksRange[0], Number(e.target.value)])
                  }
                />
              </div>
            </div>
          )}

          {/* ================= EXPORT ACTIONS (ALWAYS VISIBLE) ================= */}
          <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={exportParticipantsXLSX}
              className="px-3 py-1.5 text-sm font-medium rounded-lg
                 bg-emerald-600 text-white hover:bg-emerald-700 transition"
            >
              Export XLSX
            </button>

            <button
              onClick={exportParticipantsPDF}
              className="px-3 py-1.5 text-sm font-medium rounded-lg
                 bg-teal-600 text-white hover:bg-teal-700 transition"
            >
              Export PDF
            </button>
          </div>
        </div>


      </div>

      {/* LIST */}
      <div className="space-y-3">

        {/* EMPTY STATE */}
        {finalParticipants.length === 0 && (
          <div className="p-6 bg-white border border-dashed border-green-200 rounded-xl text-center text-gray-500">
            No participants found for this track.
          </div>
        )}

        {/* PARTICIPANTS */}
        {participantsWithRank.map((p) => (
          <div
            key={p._id}
            onClick={() => setSelectedParticipant(p)}
            className="
  cursor-pointer bg-white border border-green-100 rounded-xl p-4
  flex flex-col sm:flex-row gap-3
  sm:items-center
  hover:shadow-md transition
"

          >
            {/* LEFT */}
            <div className="flex-1 min-w-0">

              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                  Rank {p.trackRank}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  {p.paperId}
                </span>
                <span className="font-semibold text-gray-800">
                  {p.presenterName}
                </span>
              </div>
              {/* Problem Statement and Team Name */}
              <div className="text-sm text-gray-700 mt-1 truncate">
                <b>Team:</b> {p.teamName} &nbsp;|&nbsp; <b>Problem:</b> {p.paperTitle}
              </div>


              {/* Institute + Branch */}
              <div className="text-xs text-gray-600 mt-1">
                <span className="font-medium">{p.institute}</span>
                {p.branch && (
                  <>
                    {" · "}
                    <span className="text-gray-500">{p.branch}</span>
                  </>
                )}
              </div>

              <div className="text-xs text-gray-500 mt-1">
                Track: <b>{p.trackName}</b>
              </div>

            </div>

            {/* RIGHT */}
            <div className="flex flex-row sm:flex-col
                items-start sm:items-end
                gap-2
                w-full sm:w-auto">

              {/* MARKS */}
              {typeof p.assessment?.total === "number" ? (
                <div
                  className="w-10 h-10 flex items-center justify-center
                 rounded-full bg-green-600 text-white
                 text-sm font-bold"
                  title="Marks submitted"
                >
                  {p.assessment.total}
                </div>
              ) : (
                <div
                  className="px-3 py-1 rounded-full
                 bg-red-100 text-red-700
                 text-xs font-semibold"
                  title="Marks pending"
                >
                  Pending
                </div>
              )}

              {/* VIEW & EVALUATION REPORT */}
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedEvaluationReport(p); }}
                  className="text-xs sm:text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded font-medium border border-purple-200 transition-colors shadow-sm whitespace-nowrap"
                >
                  Evaluation Report
                </button>
                <div className="text-sm text-green-700 font-medium whitespace-nowrap">
                  View →
                </div>
              </div>
            </div>

    </div>
  ))}

</div>
{selectedParticipant && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      {/* Modal Header */}
      <div className="flex-shrink-0 border-b border-gray-100 bg-gray-50/80 px-6 py-5 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-purple-500"></div>
        <button
          onClick={() => setSelectedParticipant(null)}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
        <div className="flex items-start justify-between pr-10">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight truncate">
                {selectedParticipant.teamName || "Unnamed Team"}
              </h2>
              <span className="px-2.5 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-200 font-mono text-xs font-bold shadow-sm">
                {selectedParticipant.paperId}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5 font-medium text-gray-700">
                <CheckCircle size={15} className="text-emerald-500" />
                {selectedParticipant.trackName || selectedParticipant.track || "No Track"}
              </span>
              {(selectedParticipant.status || selectedParticipant.regStatus) && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="uppercase tracking-wider text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {selectedParticipant.status || selectedParticipant.regStatus}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

{selectedEvaluationReport && (
  <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl w-full max-w-2xl p-6 relative shadow-2xl max-h-[90vh] flex flex-col">
      <button
        onClick={() => setSelectedEvaluationReport(null)}
        className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
      >
        ✕
      </button>

      <h3 className="text-xl font-bold text-gray-800 mb-1">
        Evaluation Report
      </h3>
      <p className="text-sm text-gray-500 mb-6 border-b border-gray-100 pb-4">
        {selectedEvaluationReport.teamName} • {selectedEvaluationReport.paperId}
      </p>

      <div className="flex-1 overflow-y-auto pr-2">
        {!selectedEvaluationReport.assessment || typeof selectedEvaluationReport.assessment.total !== "number" ? (
          <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <span className="text-gray-500 font-medium text-lg">Participant not evaluated yet.</span>
            <p className="text-sm text-gray-400 mt-2">No evaluation data is available for this team.</p>
          </div>
        ) : (
          <div className="bg-white">
            <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span className="font-semibold text-gray-600 text-sm uppercase tracking-wide">Assigned Evaluator</span>
              <div className="font-medium text-gray-900 mt-1 text-lg">
                {selectedEvaluationReport.assignedEvaluator?.name || "Unknown"}
                {selectedEvaluationReport.assignedEvaluator?.email ? <span className="text-gray-500 text-sm ml-2">({selectedEvaluationReport.assignedEvaluator.email})</span> : ""}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <span className="font-semibold text-purple-700 text-xs uppercase tracking-wide">Total Time</span>
                <div className="font-bold text-purple-900 mt-1 text-2xl">
                  {selectedEvaluationReport.assessment.totalPptTime || 0}s
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <span className="font-semibold text-blue-700 text-xs uppercase tracking-wide">Avg Time / Slide</span>
                <div className="font-bold text-blue-900 mt-1 text-2xl">
                  {selectedEvaluationReport.assessment.slideTimings?.length > 0 
                    ? Math.round((selectedEvaluationReport.assessment.totalPptTime || 0) / selectedEvaluationReport.assessment.slideTimings.length) 
                    : 0}s
                </div>
              </div>
            </div>
            
            {/* Slide-wise Time Table */}
            <h5 className="text-sm font-bold text-gray-700 mb-3">Slide-wise Time Breakdown</h5>
            {selectedEvaluationReport.assessment.slideTimings && selectedEvaluationReport.assessment.slideTimings.length > 0 ? (
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-gray-700">Slide Number</th>
                      <th className="px-6 py-3 font-semibold text-gray-700">Time Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedEvaluationReport.assessment.slideTimings.map((timing, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 font-medium text-gray-800">Slide {timing.slide}</td>
                        <td className="px-6 py-3 text-gray-600">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-800 font-medium text-xs">
                            ⏱️ {timing.duration} sec
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200">No detailed slide timing recorded.</div>
            )}
            
            {/* AI Queries Section */}
            <h5 className="text-sm font-bold text-gray-700 mt-6 mb-3">Evaluator "Ask AI" Queries</h5>
            {selectedEvaluationReport.assessment.aiQueries && selectedEvaluationReport.assessment.aiQueries.length > 0 ? (
              <div className="space-y-3">
                {selectedEvaluationReport.assessment.aiQueries.map((q, idx) => (
                  <div key={idx} className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex flex-col gap-1">
                    <span className="text-xs font-semibold text-blue-800 flex justify-between">
                      Query {idx + 1}
                      <span className="font-normal text-blue-600">{new Date(q.timestamp).toLocaleTimeString()}</span>
                    </span>
                    <p className="text-sm text-blue-900">{q.query}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200">No AI queries were asked during this evaluation.</div>
            )}

          </div>
        )}
      </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column (Project Details) */}
              <div className="lg:col-span-1">
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 h-full">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FileText size={16} className="text-violet-500" /> Project Details
                  </h3>
                  
                  <div className="space-y-4 text-sm text-gray-700">
                    <div>
                      <span className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Problem Statement</span>
                      <p className="font-medium text-gray-900 leading-relaxed">{selectedParticipant.paperTitle || selectedParticipant.problemStatement || "—"}</p>
                    </div>
                    
                    {selectedParticipant.description && (
                      <div>
                        <span className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Description</span>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedParticipant.description}</p>
                      </div>
                    )}

                    {(selectedParticipant.pptLink || selectedParticipant.submissionLink) && (
                      <div>
                        <span className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Presentation</span>
                        <a 
                          href={
                            (selectedParticipant.pptLink || selectedParticipant.submissionLink).includes('drive.google.com') || (selectedParticipant.pptLink || selectedParticipant.submissionLink).includes('docs.google.com')
                              ? (selectedParticipant.pptLink || selectedParticipant.submissionLink)
                              : `https://docs.google.com/viewer?url=${encodeURIComponent(selectedParticipant.pptLink || selectedParticipant.submissionLink)}`
                          } 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg text-sm font-semibold transition-colors border border-violet-200"
                        >
                          <Link2 size={15} /> View PPT
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column (Evaluation Table) */}
              <div className="lg:col-span-2">
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 h-full flex flex-col">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-500" /> Evaluation
                  </h3>
                  
                  <div className="mt-2 flex-1">
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-2.5 font-bold text-gray-700 whitespace-nowrap">Criteria</th>
                            <th className="px-4 py-2.5 font-bold text-gray-700 text-center w-24">Marks</th>
                            <th className="px-4 py-2.5 font-bold text-gray-700">Comments</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {Array.isArray(selectedParticipant.assessment?.criteria) && selectedParticipant.assessment.criteria.length > 0 ? (
                            <>
                              {ASSESSMENT_CRITERIA.map((label, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50">
                                  <td className="px-4 py-2.5 text-gray-600 font-medium whitespace-nowrap">{label}</td>
                                  <td className="px-4 py-2.5 text-center">
                                      <span className="font-bold text-gray-900">
                                        {selectedParticipant.assessment.criteria[idx] ?? 0}
                                      </span>
                                  </td>
                                  <td className="px-4 py-2.5">
                                      <span className="text-gray-600 text-xs italic">
                                        {selectedParticipant.assessment.comments?.[idx] || "No comment"}
                                      </span>
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                                <td className="px-4 py-3 text-gray-900 uppercase tracking-wider text-xs">Total</td>
                                <td className="px-4 py-3 text-center text-lg text-violet-700">
                                  {selectedParticipant.assessment.criteria.reduce((s, v) => s + Number(v || 0), 0)}
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-xs text-center">—</td>
                              </tr>
                            </>
                          ) : (
                            <tr className="bg-gray-50 font-bold">
                              <td className="px-4 py-4 text-gray-900 uppercase tracking-wider text-xs">Total</td>
                              <td className="px-4 py-4 text-center">
                                  <span className="text-xl text-violet-700 font-extrabold">{typeof selectedParticipant.assessment?.total === "number" ? selectedParticipant.assessment.total : "Pending"}</span>
                              </td>
                              <td className="px-4 py-4 text-gray-400 text-xs text-center">N/A in Direct Total mode</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row (Team Members) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(selectedParticipant?.teamMembers?.length > 0 ? selectedParticipant.teamMembers : selectedParticipant?.members || []) && (selectedParticipant?.teamMembers?.length > 0 ? selectedParticipant.teamMembers : selectedParticipant?.members || []).length > 0 ? (
                (selectedParticipant?.teamMembers?.length > 0 ? selectedParticipant.teamMembers : selectedParticipant?.members || []).map((m, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-violet-200 hover:shadow-md transition-all">
                    <div className={`absolute top-0 left-0 w-1 h-full ${m.isLeader ? 'bg-violet-500' : 'bg-gray-300 group-hover:bg-violet-300'}`}></div>
                    
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 pr-2">
                        <h4 className="font-bold text-gray-900 text-base truncate" title={m.name}>{m.name || "Unknown"}</h4>
                        <span className={`inline-block mt-1 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${m.isLeader ? 'text-violet-700 bg-violet-50 border border-violet-100' : 'text-gray-500 bg-gray-100'}`}>
                          {m.candidateRole || (m.isLeader ? "Team Leader" : "Team Member")}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2.5 text-sm text-gray-600">
                      {m.email && (
                        <div className="flex items-center gap-2.5 truncate" title={m.email}>
                          <Mail size={15} className="text-gray-400 flex-shrink-0" /> <span className="truncate">{m.email}</span>
                        </div>
                      )}
                      {m.mobile && (
                        <div className="flex items-center gap-2.5">
                          <Phone size={15} className="text-gray-400 flex-shrink-0" /> <span>{m.mobile}</span>
                        </div>
                      )}
                      {m.location && (
                        <div className="flex items-center gap-2.5 truncate" title={m.location}>
                          <MapPin size={15} className="text-gray-400 flex-shrink-0" /> <span className="truncate">{m.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                      {(m.institute || m.organisation) && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 truncate" title={m.institute || m.organisation}>
                          <Building2 size={13} className="text-gray-400 flex-shrink-0" />
                          <span className="truncate font-medium">{m.institute || m.organisation}</span>
                        </div>
                      )}
                      {(m.course || m.branch || m.domain || m.specialization) && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 truncate" title={`${m.course || ''} ${m.branch || m.specialization || m.domain || ''}`}>
                          <BookOpen size={13} className="text-gray-400 flex-shrink-0" />
                          <span className="truncate">{(m.course || '') + ((m.course && (m.branch || m.specialization || m.domain)) ? ' - ' : '') + (m.branch || m.specialization || m.domain || '')}</span>
                        </div>
                      )}
                      {m.userType && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <GraduationCap size={13} className="text-gray-400 flex-shrink-0" />
                          <span>{m.userType}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : null}
            </div>
            
          </div>
        </div>
    </div>
  </div>
)}
    </div>
  );
}
