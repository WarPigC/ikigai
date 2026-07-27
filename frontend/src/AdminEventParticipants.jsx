import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ikigaiLogo from "./assets/ikigai.png";


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
  // sorting
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
              paperId: p.teamId || p._id,
              teamName: p.teamName || "",
              paperTitle: p.problemStatement || "",
              presenterName: leader.name || "Unknown",
              email: leader.email || "",
              phone: leader.mobile || "",
              institute: leader.organisation || "",
              branch: leader.domain || leader.specialization || ""
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

      return [
        p.trackRank,
        p.paperId,
        p.teamName,
        p.paperTitle,
        p.trackName,
        p.presenterName,
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
        "Presenter",
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
        `Generated by CARE • Page ${i} of ${pageCount}`,
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

              {/* VIEW */}
              <div className="text-sm text-green-700 font-medium">
                View →
              </div>
            </div>

          </div>
        ))}

      </div>
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 relative">

            <button
              onClick={() => setSelectedParticipant(null)}
              className="absolute top-3 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <h3 className="text-xl font-semibold text-green-700 mb-4">
              Participant Details
            </h3>

            <div className="space-y-3 text-sm text-gray-700">
              <div><b>Presenter:</b> {selectedParticipant.presenterName}</div>
              <div><b>Email:</b> {selectedParticipant.email}</div>
              <div><b>Phone:</b> {selectedParticipant.phone}</div>
              <div><b>Institute:</b> {selectedParticipant.institute}</div>
              {selectedParticipant.branch && <div><b>Branch:</b> {selectedParticipant.branch}</div>}

              <div className="pt-2">
                <b>Team ID:</b> {selectedParticipant.paperId}
              </div>
              <div><b>Team Name:</b> {selectedParticipant.teamName}</div>
              <div><b>Problem Statement:</b> {selectedParticipant.paperTitle}</div>

              <div>
                <b>Track:</b> {selectedParticipant.trackName}
              </div>

              <div>
                <b>Marks:</b>{" "}
                {typeof selectedParticipant.assessment?.total === "number"
                  ? selectedParticipant.assessment.total
                  : "Pending"}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
