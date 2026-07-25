import React from "react";
import { useParticipantForm } from "../../hooks/useParticipantForm";

export default function AddParticipantModal({ isOpen, onClose, eventId, trackId, allEvents, onSuccess }) {
  const [selectedEventId, setSelectedEventId] = React.useState('');
  const [selectedTrackId, setSelectedTrackId] = React.useState('');
  const isGlobal = eventId === 'global';

  const finalEventId = isGlobal ? selectedEventId : eventId;
  const finalTrackId = isGlobal ? selectedTrackId : trackId;
  const {
    formData,
    isSubmitting,
    error,
    handleChange,
    addCoAuthor,
    removeCoAuthor,
    handleCoAuthorChange,
    handleSubmit,
    resetForm
  } = useParticipantForm(finalEventId, finalTrackId, () => {
    onSuccess();
    onClose();
  });

  if (!isOpen) return null;

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col my-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-xl z-10">
          <h2 className="text-xl font-bold text-gray-800">Add New Participant</h2>
          <button 
            onClick={handleClose} 
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <form id="participantForm" onSubmit={handleSubmit} className="space-y-6">
            
            
            {isGlobal && (
              <div className="border border-purple-100 rounded-lg p-4 bg-pink-50/30 mb-6">
                <h3 className="text-sm font-bold text-purple-700 uppercase tracking-wider mb-4 border-b border-purple-200 pb-2">
                  Global Assignment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Event *</label>
                    <select value={selectedEventId} onChange={e => { setSelectedEventId(e.target.value); setSelectedTrackId(''); }} className="w-full border rounded-md px-3 py-2 text-sm">
                      <option value="">-- Select Event --</option>
                      {(allEvents || []).map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Track *</label>
                    <select value={selectedTrackId} onChange={e => setSelectedTrackId(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                      <option value="">-- Select Track --</option>
                      {selectedEventId && (allEvents || []).find(e => String(e._id) === String(selectedEventId))?.tracks?.map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            {/* Presenter Info */}
            <div className="border border-purple-100 rounded-lg p-4 bg-pink-50/30">
              <h3 className="text-sm font-bold text-purple-700 uppercase tracking-wider mb-4 border-b border-purple-200 pb-2">
                Presenter Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input type="text" name="presenterName" required value={formData.presenterName} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Institute *</label>
                  <input type="text" name="institute" required value={formData.institute} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch/Department *</label>
                  <input type="text" name="branch" required value={formData.branch} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500" />
                </div>
              </div>
            </div>

            {/* Paper Info */}
            <div className="border border-purple-100 rounded-lg p-4 bg-pink-50/30">
              <h3 className="text-sm font-bold text-purple-700 uppercase tracking-wider mb-4 border-b border-purple-200 pb-2">
                Paper Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paper ID *</label>
                  <input type="text" name="paperId" required value={formData.paperId} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Presentation Mode *</label>
                  <select name="mode" required value={formData.mode} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500">
                    <option value="">Select Mode...</option>
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paper Title *</label>
                  <input type="text" name="paperTitle" required value={formData.paperTitle} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submission Drive Link</label>
                  <input type="url" name="submissionLink" value={formData.submissionLink} onChange={handleChange} placeholder="https://drive.google.com/..." className="w-full border rounded-md px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500" />
                </div>
              </div>
            </div>

            {/* Co-Authors */}
            <div className="border border-purple-100 rounded-lg p-4 bg-pink-50/30">
              <div className="flex justify-between items-center mb-4 border-b border-purple-200 pb-2">
                <h3 className="text-sm font-bold text-purple-700 uppercase tracking-wider">
                  Co-Authors
                </h3>
                <button type="button" onClick={addCoAuthor} className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100">
                  + Add Co-Author
                </button>
              </div>
              
              <div className="space-y-4">
                {formData.coAuthors.map((author, idx) => (
                  <div key={idx} className="p-4 bg-white border border-gray-200 rounded-md relative">
                    <button type="button" onClick={() => removeCoAuthor(idx)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                    <h4 className="text-xs font-semibold text-gray-500 mb-3">Co-Author {idx + 1}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input type="text" placeholder="Name" value={author.name} onChange={(e) => handleCoAuthorChange(idx, 'name', e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
                      <input type="email" placeholder="Email" value={author.email} onChange={(e) => handleCoAuthorChange(idx, 'email', e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
                    </div>
                  </div>
                ))}
                {formData.coAuthors.length === 0 && (
                  <p className="text-sm text-gray-500 italic text-center py-2">No co-authors added.</p>
                )}
              </div>
            </div>
            
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-3 sticky bottom-0 z-10">
          <button type="button" onClick={handleClose} disabled={isSubmitting} className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-100">
            Cancel
          </button>
          <button type="submit" form="participantForm" disabled={isSubmitting} className="px-4 py-2 bg-purple-700 text-white rounded-md text-sm font-medium hover:bg-purple-800 disabled:bg-green-400 flex items-center gap-2">
            {isSubmitting ? "Saving..." : "Save Participant"}
          </button>
        </div>
      </div>
    </div>
  );
}
