import React, { useState } from "react";
import { Edit2, Trash2, Mail, ExternalLink, ChevronDown, ChevronUp, User, MapPin, Phone, GraduationCap } from "lucide-react";

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
        
        {participant.problemStatement && (
          <p className="text-sm text-gray-600 line-clamp-2 mt-2 leading-relaxed">
            <span className="font-medium text-gray-700">Problem:</span> {participant.problemStatement}
          </p>
        )}
      </div>

      {/* Card Body - Team Leader & Quick Stats */}
      <div className="p-5 flex-grow flex flex-col">
        {leader ? (
          <div className="mb-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Team Leader</h4>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                <User size={16} />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-gray-800 truncate">{leader.name}</p>
                <div className="flex items-center text-xs text-gray-500 mt-0.5 truncate">
                  <Mail size={12} className="mr-1 shrink-0" /> <span className="truncate">{leader.email}</span>
                </div>
                {leader.institute && (
                  <div className="flex items-center text-xs text-gray-500 mt-1 truncate">
                    <GraduationCap size={12} className="mr-1 shrink-0" /> <span className="truncate">{leader.institute}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 text-sm text-gray-400 italic">No members assigned</div>
        )}

        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
            {members.length} {members.length === 1 ? 'Member' : 'Members'}
          </div>
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="text-sm font-medium text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-colors"
          >
            {expanded ? "Hide Details" : "View Details"} 
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Details Section */}
      {expanded && (
        <div className="bg-gray-50 border-t border-gray-200 p-5 animate-in slide-in-from-top-2 duration-200">
          {participant.description && (
             <div className="mb-4">
               <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</h4>
               <p className="text-sm text-gray-700">{participant.description}</p>
             </div>
          )}
          {participant.pptLink && (
            <div className="mb-5">
              <a href={participant.pptLink} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-800 bg-purple-100/50 px-3 py-1.5 rounded-lg transition-colors">
                <ExternalLink size={14} className="mr-2" /> View Presentation
              </a>
            </div>
          )}

          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">All Members ({members.length})</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
            {members.map((m, i) => (
              <div key={i} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-1">
                  <div className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                    {m.name} 
                    {m.isLeader && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Leader</span>}
                  </div>
                  <div className="text-xs text-gray-500">{m.degree || m.stream ? `${m.degree} ${m.stream}` : m.category || ''}</div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-3 mt-2 text-xs text-gray-600">
                  {m.email && <div className="flex items-center gap-1.5"><Mail size={12} className="text-gray-400"/> <span className="truncate">{m.email}</span></div>}
                  {m.phone && <div className="flex items-center gap-1.5"><Phone size={12} className="text-gray-400"/> {m.phone}</div>}
                  {m.institute && <div className="flex items-center gap-1.5"><GraduationCap size={12} className="text-gray-400"/> <span className="truncate">{m.institute}</span></div>}
                  {m.location && <div className="flex items-center gap-1.5"><MapPin size={12} className="text-gray-400"/> <span className="truncate">{m.location}</span></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}