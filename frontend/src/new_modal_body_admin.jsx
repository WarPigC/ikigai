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
              {displayMembers && displayMembers.length > 0 ? (
                displayMembers.map((m, idx) => (
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
