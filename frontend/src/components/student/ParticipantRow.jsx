import React, { useState } from "react";
import { Edit2, Trash2, Mail, ExternalLink, ChevronDown, ChevronUp, User, MapPin, Phone, GraduationCap } from "lucide-react";

const MemberCard = ({ m }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm transition-all">
      <div 
        className="flex justify-between items-center cursor-pointer select-none" 
        onClick={() => setOpen(!open)}
      >
        <div className="font-semibold text-gray-800 text-sm flex items-center gap-2">
          {m.name || "Unknown Member"} 
          {m.isLeader && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Leader</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500 hidden sm:block truncate max-w-[150px]">{m.institute}</div>
          {open ? <ChevronUp size={16} className="text-purple-500" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>
      
      {open && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
          {m.institute && (
            <div className="mb-3 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
              <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1">Candidate's Organisation</span>
              <span className="font-medium text-gray-800 break-words">{m.institute}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
            {m.email && <div className="flex items-center gap-1.5"><Mail size={12} className="text-gray-400"/> <span className="truncate font-medium">{m.email}</span></div>}
            {m.phone && <div className="flex items-center gap-1.5"><Phone size={12} className="text-gray-400"/> <span className="font-medium">{m.phone}</span></div>}
            {m.category && <div className="flex flex-col"><span className="text-[10px] text-gray-400 uppercase tracking-wide">Domain</span><span className="font-medium text-gray-700">{m.category}</span></div>}
            {m.degree && <div className="flex flex-col"><span className="text-[10px] text-gray-400 uppercase tracking-wide">Course</span><span className="font-medium text-gray-700">{m.degree}</span></div>}
            {m.branch && <div className="flex flex-col"><span className="text-[10px] text-gray-400 uppercase tracking-wide">Specialization</span><span className="font-medium text-gray-700">{m.branch}</span></div>}
            {m.gradYear && <div className="flex flex-col"><span className="text-[10px] text-gray-400 uppercase tracking-wide">Grad Year</span><span className="font-medium text-gray-700">{m.gradYear}</span></div>}
            {m.year && <div className="flex flex-col"><span className="text-[10px] text-gray-400 uppercase tracking-wide">Current Year/Sem</span><span className="font-medium text-gray-700">{m.year}</span></div>}
            {m.location && <div className="flex flex-col"><span className="text-[10px] text-gray-400 uppercase tracking-wide">Location</span><span className="font-medium text-gray-700">{m.location}</span></div>}
            {m.stream && !m.branch && <div className="flex flex-col"><span className="text-[10px] text-gray-400 uppercase tracking-wide">Stream</span><span className="font-medium text-gray-700">{m.stream}</span></div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ParticipantRow({ participant, index, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  
  // Try to find a leader, otherwise fallback to first member
  const leader = participant.members?.find(m => m.isLeader) || participant.members?.[0];
  const members = participant.members || [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
      {/* Card Header - Team Name & Basic Info */}
      <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50/50 to-pink-50/50 relative">
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={() => onEdit(participant)} className="p-1.5 text-gray-400 hover:text-purple-600 bg-white/80 rounded shadow-sm hover:shadow transition-all">
            <Edit2 size={14} />
          </button>
          <button onClick={() => onDelete(participant._id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-white/80 rounded shadow-sm hover:shadow transition-all">
            <Trash2 size={14} />
          </button>
        </div>
        
        <div className="flex items-center gap-3 mb-2 pr-16">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
            {participant.teamName?.[0]?.toUpperCase() || 'T'}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg truncate max-w-[200px]" title={participant.teamName}>
              {participant.teamName || 'Unnamed Team'}
            </h3>
            {participant.teamId && (
              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                ID: {participant.teamId}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Body - Team Leader Quick Stats */}
      <div className="p-5 flex-grow flex flex-col">
        {leader ? (
          <div className="mb-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Team Leader</h4>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <User size={18} />
              </div>
              <div className="overflow-hidden w-full">
                <p className="text-sm font-bold text-gray-800 truncate mb-2">{leader.name}</p>
                
                {leader.institute && (
                  <div className="mb-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex items-start text-xs text-gray-600">
                    <GraduationCap size={16} className="mr-2 mt-0.5 shrink-0 text-purple-500" />
                    <div className="w-full">
                      <span className="block font-semibold text-gray-500 mb-0.5 uppercase tracking-wide text-[10px]">Candidate's Organisation</span> 
                      <span className="font-medium text-gray-800 break-words">{leader.institute}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-2">
                  <div className="flex items-center text-xs text-gray-600 truncate">
                    <Mail size={12} className="mr-1.5 shrink-0 text-gray-400" /> <span className="truncate">{leader.email}</span>
                  </div>
                  {leader.category && (
                    <div className="flex items-center text-xs text-gray-600 truncate">
                      <span className="font-semibold text-gray-500 mr-1.5">Domain:</span> <span className="truncate font-medium">{leader.category}</span>
                    </div>
                  )}
                  {leader.degree && (
                    <div className="flex items-center text-xs text-gray-600 truncate">
                      <span className="font-semibold text-gray-500 mr-1.5">Course:</span> <span className="truncate font-medium">{leader.degree}</span>
                    </div>
                  )}
                  {leader.branch && (
                    <div className="flex items-center text-xs text-gray-600 truncate">
                      <span className="font-semibold text-gray-500 mr-1.5">Specialization:</span> <span className="truncate font-medium">{leader.branch}</span>
                    </div>
                  )}
                  {leader.gradYear && (
                    <div className="flex items-center text-xs text-gray-600 truncate">
                      <span className="font-semibold text-gray-500 mr-1.5">Grad Year:</span> <span className="truncate font-medium">{leader.gradYear}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 text-sm text-gray-400 italic">No members assigned</div>
        )}

        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
            {members.length} {members.length === 1 ? 'Member' : 'Members'}
          </div>
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="text-sm font-medium text-gray-600 hover:text-purple-700 bg-gray-50 hover:bg-purple-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            {expanded ? "Hide All Details" : "Expand All Details"} 
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Details Section */}
      {expanded && (
        <div className="bg-gray-50 border-t border-gray-200 p-5 animate-in slide-in-from-top-2 duration-200">
          {(participant.problemStatement || participant.description) && (
            <div className="mb-5 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              {participant.problemStatement && (
                <div className="mb-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Problem Statement</h4>
                  <p className="text-sm text-gray-800 font-medium">{participant.problemStatement}</p>
                </div>
              )}
              {participant.description && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{participant.description}</p>
                </div>
              )}
            </div>
          )}

          {participant.pptLink && (
            <div className="mb-5">
              <a href={participant.pptLink} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-800 bg-purple-100/50 px-4 py-2 rounded-lg transition-colors border border-purple-200/50">
                <ExternalLink size={16} className="mr-2" /> View Presentation
              </a>
            </div>
          )}

          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Team Members ({members.length})</h4>
          <div className="space-y-2">
            {members.map((m, i) => (
              <MemberCard key={i} m={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}