const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export const studentApi = {
  async fetchSession(email) {
    const res = await fetch(`${API_BASE}/api/student/session/${encodeURIComponent(email)}`);
    return await res.json();
  },
  
  async updateMeetingLink(eventId, trackId, meetingLink) {
    const res = await fetch(`${API_BASE}/api/event/${eventId}/track/${trackId}/meeting-link`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingLink })
    });
    return await res.json();
  },

  async fetchParticipants(eventId, trackId) {
    const res = await fetch(`${API_BASE}/api/student/participants?eventId=${eventId}&trackId=${trackId}`);
    return await res.json();
  },

  async createParticipant(payload) {
    const res = await fetch(`${API_BASE}/api/student/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async updateParticipant(participantId, payload) {
    const res = await fetch(`${API_BASE}/api/student/participants/${participantId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async deleteParticipant(participantId) {
    const res = await fetch(`${API_BASE}/api/student/participants/${participantId}`, {
      method: "DELETE"
    });
    return await res.json();
  },

  async bulkUploadParticipants(eventId, participants) {
    const createdBy = sessionStorage.getItem("care_email") || "bulk-import";
    const res = await fetch(`${API_BASE}/api/student/participants/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, participants, createdBy })
    });
    return await res.json();
  },

  async fetchProofStatus(participantId) {
    try {
      const res = await fetch(`${API_BASE}/api/proof/${participantId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async uploadProof(formData) {
    // Note: Do not set Content-Type header manually when sending FormData,
    // the browser will automatically set it to multipart/form-data with the correct boundary.
    const res = await fetch(`${API_BASE}/api/proof/upload`, {
      method: "POST",
      body: formData,
    });
    return await res.json();
  },

  async downloadProof(url, paperId) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${paperId}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, message: "Failed to download proof" };
    }
  },

  async viewProof(url) {
    if (!url || !url.startsWith("http")) {
      return { success: false, message: "⚠️ Proof not available. Please upload again." };
    }
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (!res.ok) {
        return { success: false, message: "⚠️ Proof file was removed. Please re-upload." };
      }
      window.open(url, "_blank", "noopener,noreferrer");
      return { success: true };
    } catch {
      return { success: false, message: "⚠️ Unable to access proof. Please re-upload." };
    }
  }
};
