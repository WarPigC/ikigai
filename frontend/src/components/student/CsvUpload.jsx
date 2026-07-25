import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import { studentApi } from '../../services/studentApi';

export default function CsvUpload({ eventId, allEvents, onSuccess }) {
  const [csvText, setCsvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState("");

  const processCsv = () => {
    if (!csvText.trim()) return;
    
    const activeEventId = eventId === "global" ? selectedEvent : eventId;
    if (!activeEventId || activeEventId === "global") {
      setError("Please select a specific event first before uploading CSV.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const delimiter = csvText.includes('\\t') ? '\\t' : ',';
    Papa.parse(csvText.trim(), {
      delimiter: delimiter,
      header: false,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data;
          const teamsMap = {};

          // Columns based on standard format: 
          // 0: Team ID, 1: Team Name, 2: Role, 3: Name, 4: Email, 5: Phone, 6: Location, 
          // 7: Category, 8: Stream, 9: Degree, 10: Mode, 11: Semester, 12: GradYear, 13: Institute
          
          let skipFirst = false;
          // check if first row is header
          if (rows[0] && rows[0][0] && rows[0][0].toLowerCase().includes('id')) {
            skipFirst = true;
          }

          rows.forEach((row, i) => {
            if (skipFirst && i === 0) return;
            if (row.length < 5) return; // skip malformed lines

            const teamId = row[0]?.trim();
            const teamName = row[1]?.trim();
            if (!teamId) return;

            if (!teamsMap[teamId]) {
              teamsMap[teamId] = {
                teamId,
                teamName,
                members: []
              };
            }

            const isLeader = row[2]?.trim().toLowerCase().includes('leader');
            
            teamsMap[teamId].members.push({
              name: row[3]?.trim(),
              email: row[4]?.trim(),
              phone: row[5]?.trim(),
              location: row[6]?.trim(),
              category: row[7]?.trim(),
              stream: row[8]?.trim(),
              degree: row[9]?.trim(),
              branch: row[10]?.trim(),
              mode: row[11]?.trim(),
              year: row[12]?.trim(),
              gradYear: row[14]?.trim() || row[13]?.trim(),
              institute: row[15]?.trim() || row[14]?.trim(),
              isLeader,
              gender: "Not Specified"
            });
          });

          const participants = Object.values(teamsMap);
          if (participants.length === 0) {
            throw new Error("No valid teams found in the CSV");
          }

          const res = await studentApi.bulkUploadParticipants(activeEventId, participants);
          setResult({
            added: res.results.added,
            updated: res.results.updated,
            errors: res.results.errors.length
          });
          setCsvText("");
          onSuccess();
        } catch (err) {
          setError(err.message || "Failed to process CSV");
        } finally {
          setLoading(false);
        }
      },
      error: (err) => {
        setError("Error parsing CSV: " + err.message);
        setLoading(false);
      }
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <Upload className="mr-2 text-purple-600" size={20} /> Bulk CSV Upload (Paste Data)
        </h3>
      </div>
      
      <div className="flex flex-col gap-4">
        {eventId === "global" && allEvents && allEvents.length > 0 && (
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Event *</label>
            <select 
              value={selectedEvent} 
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">-- Select Event to Upload To --</option>
              {allEvents.map(evt => (
                <option key={evt._id} value={evt._id}>{evt.title}</option>
              ))}
            </select>
          </div>
        )}
        
        <div className="w-full">
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Paste CSV data here... (e.g. copied from Excel/Google Sheets)&#10;Format: Team ID, Team Name, Role, Name, Email, Phone, Location, Category, Stream, Degree, Mode, Semester, GradYear, Institute"
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm font-mono whitespace-pre"
          />
        </div>
        
        <div className="flex justify-end">
          <button 
            onClick={processCsv}
            disabled={!csvText.trim() || loading || (eventId === "global" && !selectedEvent)}
            className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? "Processing..." : "Upload & Sync Data"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-center">
          <AlertCircle size={16} className="mr-2 shrink-0" /> {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200 flex justify-between items-center">
          <div className="flex items-center">
            <CheckCircle size={16} className="mr-2 shrink-0" /> 
            Successfully processed: {result.added} added, {result.updated} updated. {result.errors > 0 ? `(${result.errors} errors)` : ''}
          </div>
          <button onClick={() => setResult(null)} className="text-green-700 hover:text-green-900"><X size={16}/></button>
        </div>
      )}
    </div>
  );
}
