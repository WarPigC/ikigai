import React from "react";
import StudentHeader from "../components/student/StudentHeader";


import ParticipantList from "../components/student/ParticipantList";
import { useStudentSession } from "../hooks/useStudentSession";
import { studentApi } from "../services/studentApi";

export default function StudentDashboard() {
  const { sessionData, loading, error } = useStudentSession();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Student Console...</div>;
  }

  if (error) {
    return null; // The hook will redirect to /login
  }

  const handleUpdateLink = async (newLink) => {
    if (!sessionData?.event?._id || !sessionData?.track?.id) return;
    await studentApi.updateMeetingLink(sessionData.event._id, sessionData.track.id, newLink);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <StudentHeader student={sessionData?.student} />
      
      <main className="px-6 py-6 space-y-6">
        <div className="bg-white/95 border border-purple-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-6">
            
        </div>

        <ParticipantList 
          eventId={sessionData?.event?._id}
          trackId={sessionData?.track?.id}
          allEvents={sessionData?.allEvents}
        />
      </main>
    </div>
  );
}
