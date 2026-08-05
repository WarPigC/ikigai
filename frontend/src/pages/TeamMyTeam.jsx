import React, { useState, useEffect } from "react";
import { Users, Mail, Phone, MapPin, Building2, BookOpen, CheckCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function TeamMyTeam() {
  const [team, setTeam] = useState(null);
  const [round2Status, setRound2Status] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const email = sessionStorage.getItem("care_email");
        if (!email) return;

        const res = await fetch(`${API_BASE}/api/team/my-details?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.success) {
          setTeam(data.team);
        }

        const r2Res = await fetch(`${API_BASE}/api/round2/my-status?email=${encodeURIComponent(email)}`);
        const r2Data = await r2Res.json();
        if (r2Res.ok && r2Data.registered) {
          setRound2Status(r2Data);
        }
      } catch (err) {
        console.error("Error fetching team data", err);
      }
      setLoading(false);
    };
    fetchTeam();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-600">Loading team details...</div>;

  if (!team) return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow border border-gray-200 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Team Not Found</h2>
        <p className="text-gray-600">We couldn't locate your shortlisted team details.</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h1 className="text-3xl font-black text-gray-900 mb-2">{team.teamName}</h1>
        <p className="text-lg text-gray-600 font-medium mb-6">{team.projectTitle}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
            <Users className="text-green-600 mt-1" size={20} />
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Members</p>
              <p className="text-lg font-bold text-gray-800">{team.members?.length || 0}</p>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
            <CheckCircle className="text-green-600 mt-1" size={20} />
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Status</p>
              <p className="text-lg font-bold text-gray-800">Shortlisted for Round 2</p>
            </div>
          </div>
        </div>
      </div>

      {round2Status && round2Status.trackPreferences && round2Status.trackPreferences.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Saved Track Preferences</h2>
          <div className="mb-4 text-red-600 font-semibold text-sm">
            <p>Note: Selecting a preferred domain during registration does not guarantee its allocation. Domain allotment will be based on first-come, first-registration and successful Round 1 solution submission, subject to availability.</p>
          </div>
          <div className="space-y-2.5">
            {round2Status.trackPreferences.map((track, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </div>
                <span className="font-semibold text-gray-800">{track}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 px-2">Team Members</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {team.members?.map((member, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden group hover:shadow-md transition">
              {member.isLeader && (
                <div className="absolute top-0 right-0 bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-bl-lg">
                  Team Leader
                </div>
              )}
              
              <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name || `${member.firstName} ${member.lastName}`}</h3>
              <p className="text-sm text-gray-500 font-medium mb-4">{member.userType}</p>
              
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail size={16} className="text-gray-400" /> {member.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone size={16} className="text-gray-400" /> {member.mobile || member.phone}
                </div>
                {member.organisation && (
                  <div className="flex items-start gap-2 text-sm text-gray-700">
                    <Building2 size={16} className="text-gray-400 shrink-0 mt-0.5" /> 
                    <span className="line-clamp-2">{member.organisation}</span>
                  </div>
                )}
                {member.specialization && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <BookOpen size={16} className="text-gray-400 shrink-0" /> 
                    <span className="line-clamp-1">{member.course} - {member.specialization}</span>
                  </div>
                )}
                {member.location && (
                  <div className="flex items-start gap-2 text-sm text-gray-700">
                    <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" /> 
                    <span className="line-clamp-1">{member.location}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
