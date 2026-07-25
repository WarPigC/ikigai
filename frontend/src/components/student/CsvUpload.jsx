import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { studentApi } from '../../services/studentApi';

export default function CsvUpload({ eventId, onSuccess }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setError(null);
      setResult(null);
    }
  };

  const processCsv = () => {
    if (!file) return;
    if (!eventId || eventId === "global") {
      setError("Please select a specific event first before uploading CSV.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    Papa.parse(file, {
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

            const role = row[2]?.trim() || "Team Member";
            
            teamsMap[teamId].members.push({
              name: row[3]?.trim() || "",
              email: row[4]?.trim() || "",
              phone: row[5]?.trim() || "",
              location: row[6]?.trim() || "",
              category: row[7]?.trim() || "",
              stream: row[8]?.trim() || "",
              degree: row[9]?.trim() || "",
              mode: row[10]?.trim() || "",
              year: row[11]?.trim() || "",
              gradYear: row[12]?.trim() || "",
              institute: row[13]?.trim() || "",
              gender: "Not Specified",
              isLeader: role.toLowerCase().includes("leader")
            });
          });

          const participants = Object.values(teamsMap);
          if (participants.length === 0) {
            throw new Error("No valid teams found in the CSV");
          }

          const res = await studentApi.bulkUploadParticipants(eventId, participants);
          setResult({
            added: res.results.added,
            updated: res.results.updated,
            errors: res.results.errors.length
          });
          setFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
          onSuccess();
        } catch (err) {
          setError(err.message || "Failed to process CSV");
        } finally {
          setLoading(false);
        }
      },
      error: (err) => {
        setError("Error reading file: " + err.message);
        setLoading(false);
      }
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <Upload className="mr-2 text-purple-600" size={20} /> Bulk CSV Upload
        </h3>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <label className="flex items-center justify-center w-full h-20 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-purple-400 focus:outline-none">
            <span className="flex items-center space-x-2">
              <FileText className="w-6 h-6 text-gray-400" />
              <span className="font-medium text-gray-600">
                {file ? file.name : "Drop CSV file to Upload, or click to select"}
              </span>
            </span>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
          </label>
        </div>
        <button 
          onClick={processCsv}
          disabled={!file || loading}
          className="px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors whitespace-nowrap h-20"
        >
          {loading ? "Processing..." : "Upload & Sync Data"}
        </button>
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
            Successfully processed: {result.added} added, {result.updated} updated. {result.errors > 0 ? \`(\${result.errors} errors)\` : ''}
          </div>
          <button onClick={() => setResult(null)} className="text-green-700 hover:text-green-900"><X size={16}/></button>
        </div>
      )}
    </div>
  );
}
