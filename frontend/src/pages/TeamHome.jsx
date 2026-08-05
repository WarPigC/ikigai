import React, { useState, useEffect } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, AlignJustify, IndianRupee, QrCode, Upload } from "lucide-react";
import QRCode from "react-qr-code";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function SortableTrackItem({ id, track, index }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className="bg-white border border-gray-200 rounded-lg p-4 flex gap-4 items-center shadow-sm mb-3 z-50 relative hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing select-none"
    >
      <div className="w-10 h-10 rounded-full bg-green-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-sm">
        {index + 1}
      </div>
      <div className="text-gray-400 shrink-0">
        <AlignJustify size={20} />
      </div>
      <div className="flex-1 text-left">
        <h3 className="font-bold text-gray-900 mb-1.5 leading-tight">{track.name}</h3>
        <p className="text-sm text-gray-600 leading-relaxed text-justify">{track.location}</p>
      </div>
    </div>
  );
}

export default function TeamHome() {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState([]);
  const [transactionId, setTransactionId] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [regStatus, setRegStatus] = useState("Pending");
  const [reopenAccess, setReopenAccess] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [savingSequence, setSavingSequence] = useState(false);
  const [sequenceMessage, setSequenceMessage] = useState("");
  const [isSequenceSaved, setIsSequenceSaved] = useState(false);

  const handleSaveSequence = async () => {
    if (!teamInfo) {
      alert("Team info not found. Please log in again.");
      return;
    }
    setSavingSequence(true);
    try {
      const payload = {
        participantId: teamInfo.participantId,
        teamName: teamInfo.teamName,
        leaderEmail: sessionStorage.getItem("care_email"),
        eventId: event._id,
        trackPreferences: tracks.map(t => t.title || t.name)
      };

      const res = await fetch(`${API_BASE}/api/round2/save-sequence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) {
        setSequenceMessage("✅ Sequence Saved.");
        setIsSequenceSaved(true);
      } else {
        alert(data.message || "Failed to save sequence.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while saving the sequence.");
    } finally {
      setSavingSequence(false);
    }
  };

  const isReopened = submitted && reopenAccess && new Date(reopenAccess.expiresAt) > new Date();

  useEffect(() => {
    if (isReopened) {
      const interval = setInterval(() => {
        const diff = new Date(reopenAccess.expiresAt) - new Date();
        if (diff <= 0) {
          window.location.reload();
        } else {
          const m = Math.floor((diff / 1000 / 60) % 60);
          const s = Math.floor((diff / 1000) % 60);
          setTimeLeft(`${m}m ${s}s`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isReopened, reopenAccess]);
  const [teamInfo, setTeamInfo] = useState(null);

  useEffect(() => {
    const fetchRound2 = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/events`);
        const data = await res.json();
        if (data.success) {
          const round2 = data.events.find(e => {
            const t = (e.title || e.name || "").toLowerCase();
            return t.includes("round 2") || t.includes("round-2");
          });
          if (round2) {
            setEvent(round2);
            setTracks(round2.tracks || []);
          }
        }
        
        const email = sessionStorage.getItem("care_email");
        if (email) {
          const teamRes = await fetch(`${API_BASE}/api/team/my-details?email=${encodeURIComponent(email)}`);
          const teamData = await teamRes.json();
          if (teamData.success) {
            setTeamInfo(teamData.team);
          }
          
          const myRes = await fetch(`${API_BASE}/api/round2/my-status?email=${encodeURIComponent(email)}`);
          const myData = await myRes.json();
          if (myRes.ok && myData.registered) {
            setRegStatus(myData.status);
            setReopenAccess(myData.reopenAccess);
            setSubmitted(true);
          }
        }
      } catch (err) {
        console.error("Error fetching data", err);
      }
      setLoading(false);
    };
    fetchRound2();
  }, []);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setTracks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id || item._id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id || item._id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setIsSequenceSaved(false);
      setSequenceMessage("");
    }
  };

  const handleSubmit = async () => {
    if (!isSequenceSaved) {
      alert("Please save your track sequence before submitting the registration form.");
      return;
    }

    if (!isReopened && (!transactionId || !receiptFile)) {
      alert("Please enter transaction ID and upload receipt");
      return;
    }
    if (isReopened) {
      if (reopenAccess.fields.includes("transactionId") && !transactionId) return alert("Transaction ID required");
      if (reopenAccess.fields.includes("uploadReceipt") && !receiptFile) return alert("Receipt required");
    }
    
    if (!teamInfo) {
      alert("Team info not found. Please log in again.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("participantId", teamInfo.participantId);
      formData.append("teamName", teamInfo.teamName);
      formData.append("leaderEmail", sessionStorage.getItem("care_email"));
      formData.append("eventId", event._id);
      
      if (!isReopened || reopenAccess.fields.includes("transactionId")) {
        formData.append("transactionId", transactionId);
      }
      if (!isReopened || reopenAccess.fields.includes("uploadReceipt")) {
        formData.append("receiptFile", receiptFile);
      }
      if (!isReopened || reopenAccess.fields.includes("choiceFilling")) {
        formData.append("trackPreferences", JSON.stringify(tracks.map(t => t.title || t.name)));
      }

      const res = await fetch(`${API_BASE}/api/round2/register`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        if (isReopened) {
          setRegStatus("Pending");
          setReopenAccess(null);
        }
      } else {
        alert(data.message || "Failed to register");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-600">Loading Round 2 details...</div>;

  if (!event) return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow border border-gray-200 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Round 2 Registration</h2>
        <p className="text-gray-600">The Round 2 event is not yet active. Please check back later.</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
      
      {/* Timeline UI */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Your Progress</h2>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative pt-4 pb-2">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-1.5 bg-gray-200 z-0 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-500 ease-in-out" 
              style={{ width: regStatus === 'Approved' && teamInfo?.allottedTrack ? '75%' : (regStatus === 'Approved' ? '50%' : (submitted && !isReopened ? '25%' : '0%')) }}
            ></div>
          </div>
          
          {/* Step 1: Round 1 */}
          <div className="flex flex-col items-center flex-1 text-center z-10 px-2 relative group">
            <div className="w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg mb-3 shadow-[0_0_15px_rgba(34,197,94,0.4)] ring-4 ring-white transition-all">1</div>
            <p className="text-sm font-extrabold text-gray-900">Round 1</p>
            <p className="text-xs text-green-600 font-bold mt-1">Shortlisted</p>
          </div>

          {/* Step 2: Registration */}
          <div className="flex flex-col items-center flex-1 text-center z-10 px-2 relative">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg mb-3 ring-4 ring-white transition-all ${
              submitted && !isReopened
                ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                : 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.6)] scale-110'
            }`}>2</div>
            <p className="text-sm font-extrabold text-gray-900">Registration</p>
            <p className={`text-xs font-bold mt-1 ${submitted && !isReopened ? 'text-green-600' : 'text-purple-600'}`}>{submitted && !isReopened ? 'Completed' : (isReopened ? 'Correction Required' : 'Action Required')}</p>
          </div>

          {/* Step 3: Verification */}
          <div className="flex flex-col items-center flex-1 text-center z-10 px-2 relative">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg mb-3 ring-4 ring-white transition-all ${
              regStatus === 'Approved' 
                ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                : (submitted && !isReopened && regStatus === 'Contact' 
                  ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.6)] scale-110' 
                  : (submitted && !isReopened
                    ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.6)] scale-110' 
                    : 'bg-gray-100 text-gray-400 border-2 border-gray-200'))
            }`}>3</div>
            <p className="text-sm font-extrabold text-gray-900">Verification</p>
            <p className={`text-xs font-bold mt-1 ${
              regStatus === 'Approved' ? 'text-green-600' : (submitted && !isReopened && regStatus === 'Contact' ? 'text-red-600' : (submitted && !isReopened ? 'text-amber-600' : 'text-gray-400'))
            }`}>
              {regStatus === 'Approved' ? 'Verified' : (submitted && !isReopened && regStatus === 'Contact' ? 'Contact Admin' : (submitted && !isReopened ? 'Pending Review' : 'Awaiting Details'))}
            </p>
          </div>

          {/* Step 4: Problem Statement */}
          <div className="flex flex-col items-center flex-1 text-center z-10 px-2 relative">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg mb-3 ring-4 ring-white transition-all ${
              regStatus === 'Approved' && teamInfo?.allottedTrack
                ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.6)] scale-110' 
                : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
            }`}>4</div>
            <p className="text-sm font-extrabold text-gray-900">Problem Statement</p>
            <p className={`text-xs font-bold mt-1 ${regStatus === 'Approved' && teamInfo?.allottedTrack ? 'text-purple-600' : 'text-gray-400'}`}>
              {regStatus === 'Approved' && teamInfo?.allottedTrack ? 'Available' : 'Awaiting Release'}
            </p>
          </div>

          {/* Step 5: Round 2 */}
          <div className="flex flex-col items-center flex-1 text-center z-10 px-2 relative">
            <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg mb-3 ring-4 ring-white transition-all bg-gray-100 text-gray-400 border-2 border-gray-200">5</div>
            <p className="text-sm font-extrabold text-gray-900">Round 2</p>
            <p className="text-xs text-gray-500 font-bold mt-1">Hackathon (Aug 21)</p>
          </div>
        </div>
      </div>

      {submitted && !isReopened ? (
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-green-200 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${regStatus === 'Approved' ? 'bg-green-100 text-green-600' : (regStatus === 'Contact' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600')}`}>
            {regStatus === 'Approved' ? <Upload size={40} /> : <Upload size={40} />}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {regStatus === 'Approved' && teamInfo?.allottedTrack ? 'Track & Problem Statement Available!' : (regStatus === 'Approved' ? 'Registration Verified!' : (regStatus === 'Contact' ? 'Action Required' : 'Registration Verification Pending'))}
          </h2>
          <p className="text-gray-600">
            {regStatus === 'Approved' && teamInfo?.allottedTrack
              ? 'Your final track has been allotted. Check your problem statement above and get ready for the 36-hour hackathon!' 
              : (regStatus === 'Approved'
                ? 'Your registration has been approved. The Admin is currently reviewing your preferences to allot your final track and problem statement. Please check back soon.'
                : (regStatus === 'Contact' 
                  ? 'There is an issue with your registration. Please contact the organizers immediately.'
                  : 'Your Round 2 preferences and payment receipt have been received and are pending verification.'))}
          </p>
        </div>
      ) : (
        <>
          {isReopened && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between shadow-sm animate-pulse">
              <div>
                <h3 className="font-bold text-blue-800 text-lg">Action Required: Update Registration</h3>
                <p className="text-sm text-blue-600 mt-1">The admin has re-opened specific sections for you to correct.</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">Time Remaining</p>
                <p className="text-2xl font-black text-blue-700 font-mono">{timeLeft}</p>
              </div>
            </div>
          )}

          {!isReopened && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h1 className="text-2xl font-black text-gray-900">Registration: {event.name || event.title}</h1>
              <div className="flex items-center gap-2 mt-2 text-gray-600">
                <Calendar size={18} />
                <span>{new Date(event.startDate || event.date).toLocaleDateString()}</span>
              </div>
              <p className="mt-4 text-gray-700 leading-relaxed">{event.description || "Register for the second round of IKIGAI Hackathon."}</p>
            </div>
          )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(!isReopened || reopenAccess.fields.includes("choiceFilling")) && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">1. Choose Track Preference</h2>
            
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4 text-sm font-semibold flex flex-col gap-1">
              <span>⚠️ Please do the sequencing properly before submitting the registration form.</span>
              <span className="text-yellow-700">👉 Use drag and drop for the sequencing (click anywhere on the card to drag).</span>
            </div>
            
            {tracks.length > 0 ? (
              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={tracks.map(t => t.id || t._id)} strategy={verticalListSortingStrategy}>
                  {tracks.map((track, index) => (
                    <SortableTrackItem key={track.id || track._id} id={track.id || track._id} track={{name: track.title || track.name, location: track.description}} index={index} />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              <p className="text-gray-400 italic">No tracks available.</p>
            )}
            
            {!isReopened && (
              <div className="mt-4">
                <button 
                  onClick={handleSaveSequence}
                  disabled={savingSequence}
                  className="w-full py-3 bg-green-50 text-green-700 font-bold rounded-lg border border-green-200 hover:bg-green-100 transition disabled:opacity-50"
                >
                  {savingSequence ? "Saving..." : "Save Sequence"}
                </button>
                {sequenceMessage && (
                  <p className="text-center text-green-600 font-bold mt-2 text-sm animate-pulse">{sequenceMessage}</p>
                )}
              </div>
            )}
          </div>
        )}

        {(!isReopened || reopenAccess.fields.includes("transactionId") || reopenAccess.fields.includes("uploadReceipt")) && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full">
            <h2 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">2. Fees Payment</h2>
            
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="text-center mb-4">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mt-1">Ikigai 2026 Event Registration</h3>
              </div>
              
              <div className="flex flex-col items-center justify-center mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-extrabold text-gray-900 text-lg">Scan</span>
                  <QrCode size={20} className="text-blue-500" />
                  <span className="font-extrabold text-gray-900 text-lg">& pay</span>
                </div>
                <p className="text-[10px] font-bold text-gray-500 tracking-wide">VIA UPI / RUPAY / VISA / PAYTM</p>
              </div>
              
              <div className="w-56 h-56 mx-auto bg-white rounded-lg border-2 border-dashed border-gray-200 p-2 flex items-center justify-center shadow-sm mb-8">
                <QRCode value="https://pay.jodo.in/pages/eXYpWC8NcCEZm6ZA" size={180} />
              </div>
              
              <div className="w-full mb-8">
                <h4 className="font-bold text-gray-800 text-sm mb-3">Payment Instructions:</h4>
                <ol className="space-y-3 text-xs text-gray-600 list-decimal pl-5 marker:font-bold marker:text-gray-400">
                  <li className="pl-1 leading-relaxed">Finalize your Problem Domain (Track) preferences before proceeding to payment. Changes may not be allowed after registration is submitted.</li>
                  <li className="pl-1 leading-relaxed">On the Jodo payment page, enter the Team Leader's email address. The payment receipt will be sent to this email.</li>
                  <li className="pl-1 leading-relaxed">From the Event dropdown, select <strong className="font-bold text-gray-900">"IKIGAI"</strong>.</li>
                  <li className="pl-1 leading-relaxed">Enter the registration amount as <strong className="font-bold text-green-700 text-sm">₹501</strong> <span className="text-red-500 ml-1 font-medium">(Do NOT change this amount)</span>.</li>
                  <li className="pl-1 leading-relaxed">After successful payment, download the payment receipt immediately or retrieve it later from the Team Leader's registered email. You will be required to upload this receipt in the registration portal.</li>
                </ol>
              </div>
              
              <div className="w-full space-y-5 pt-6 border-t border-gray-100">
                {(!isReopened || reopenAccess.fields.includes("transactionId")) && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Transaction ID</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-gray-50/50"
                      placeholder="e.g. UTR1234567890"
                      value={transactionId}
                      onChange={e => setTransactionId(e.target.value)}
                    />
                  </div>
                )}
                {(!isReopened || reopenAccess.fields.includes("uploadReceipt")) && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Upload Receipt</label>
                    <label className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                      <Upload size={18} className="text-gray-500" />
                      <span className="text-sm text-gray-600 truncate max-w-[200px]">{receiptFile ? receiptFile.name : "Choose File"}</span>
                      <input type="file" className="hidden" onChange={e => setReceiptFile(e.target.files[0])} accept="image/*,.pdf" />
                    </label>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-gray-100">
              <button 
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow transition disabled:opacity-50"
              >
                {submitting ? "Submitting..." : (isReopened ? "Submit Correction" : "Submit Registration")}
              </button>
            </div>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
