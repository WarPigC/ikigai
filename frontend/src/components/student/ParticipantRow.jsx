import React, { useState } from "react";
import { Edit2, Trash2, Mail, ExternalLink, ChevronDown, ChevronUp, CheckCircle, Clock } from "lucide-react";

export default function ParticipantRow({ participant, index, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const leader = participant.members?.find(m => m.isLeader) || participant.members?.[0];

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors group">
        <td className="px-4 md:px-6 py-4 text-gray-500 font-medium w-16">
          <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-gray-200 rounded">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </td>
        <td className="px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs shrink-0">
              {participant.teamName?.[0]?.toUpperCase() || 'T'}
            </div>
            <div className="font-medium text-gray-900">{participant.teamName}</div>
          </div>
        </td>
        <td className="px-4 md:px-6 py-4 text-gray-600">
          <div className="truncate max-w-xs">{participant.problemStatement || '-'}</div>
        </td>
        <td className="px-4 md:px-6 py-4 text-gray-600 hidden md:table-cell">
          {leader?.name || '-'} <br/>
          <span className="text-xs text-gray-400">{leader?.email || ''}</span>
        </td>
        <td className="px-4 md:px-6 py-4 hidden sm:table-cell">
          {participant.status === "EVALUATED" ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
              <CheckCircle size={14} /> Evaluated
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <Clock size={14} /> Pending
            </span>
          )}
        </td>
        <td className="px-4 md:px-6 py-4">
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(participant)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => onDelete(participant._id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan="6" className="px-4 py-4 bg-gray-50 border-b border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">Team Details</h4>
                <p className="text-sm mb-1"><span className="font-medium">Description:</span> {participant.description || '-'}</p>
                {participant.pptLink && (
                  <a href={participant.pptLink} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex items-center mt-2">
                    <ExternalLink size={14} className="mr-1" /> View Presentation
                  </a>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">Members</h4>
                <ul className="space-y-2">
                  {participant.members?.map((m, i) => (
                    <li key={i} className="text-sm bg-white p-2 rounded border border-gray-200 flex justify-between">
                      <div>
                        <div className="font-medium">{m.name} {m.isLeader && <span className="text-xs bg-green-100 text-green-800 px-1 rounded ml-1">Leader</span>}</div>
                        <div className="text-xs text-gray-500">{m.institute} • {m.branch} ({m.year})</div>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <div>{m.email}</div>
                        <div>{m.phone}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}