import { useState } from "react";
import { studentApi } from "../services/studentApi";

const initialFormState = {
  presenterName: "",
  paperTitle: "",
  paperId: "",
  institute: "",
  branch: "",
  email: "",
  phone: "",
  mode: "",
  submissionLink: "",
  coAuthors: [],
};

export function useParticipantForm(eventId, trackId, onSuccess) {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addCoAuthor = () => {
    setFormData((prev) => ({
      ...prev,
      coAuthors: [...prev.coAuthors, { name: "", email: "" }]
    }));
  };

  const removeCoAuthor = (index) => {
    setFormData((prev) => {
      const newCoAuthors = [...prev.coAuthors];
      newCoAuthors.splice(index, 1);
      return { ...prev, coAuthors: newCoAuthors };
    });
  };

  const handleCoAuthorChange = (index, field, value) => {
    setFormData((prev) => {
      const newCoAuthors = [...prev.coAuthors];
      newCoAuthors[index][field] = value;
      return { ...prev, coAuthors: newCoAuthors };
    });
  };

  const validate = (isEdit = false) => {
    if (!formData.presenterName || !formData.email || !formData.phone || !formData.institute || !formData.branch || !formData.paperTitle || !formData.mode) {
      setError("Please fill all required fields (Presenter Name, Email, Phone, Institute, Branch, Paper Title, Mode).");
      return false;
    }
    if (!isEdit && !formData.paperId) {
      setError("Paper ID is required.");
      return false;
    }
    if (!eventId || !trackId) {
      setError("Missing Event ID or Track ID.");
      return false;
    }
    const submittedBy = sessionStorage.getItem("care_email");
    if (!submittedBy) {
      setError("Session expired. Missing care_email.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!validate()) return;

    setIsSubmitting(true);
    
    const payload = {
      ...formData,
      eventId,
      trackId,
      submittedBy: sessionStorage.getItem("care_email")
    };

    try {
      const res = await studentApi.createParticipant(payload);
      if (res.success) {
        setFormData(initialFormState);
        if (onSuccess) onSuccess();
      } else {
        setError(res.message || "Failed to add participant.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (participantId) => {
    setError(null);
    if (!validate(true)) return false;

    setIsSubmitting(true);
    
    // Explicitly exclude paperId, eventId, trackId as per legacy contract
    const payload = {
      presenterName: formData.presenterName,
      paperTitle: formData.paperTitle,
      institute: formData.institute,
      branch: formData.branch,
      email: formData.email,
      phone: formData.phone,
      mode: formData.mode,
      submissionLink: formData.submissionLink,
      coAuthors: formData.coAuthors,
    };

    try {
      const res = await studentApi.updateParticipant(participantId, payload);
      if (res.success) {
        setFormData(initialFormState);
        if (onSuccess) onSuccess();
        return true;
      } else {
        setError(res.message || "Failed to update participant.");
        return false;
      }
    } catch (err) {
      console.error(err);
      setError("Network error occurred.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = (initialData = null) => {
    if (initialData) {
      setFormData({
        presenterName: initialData.presenterName || "",
        paperTitle: initialData.paperTitle || "",
        paperId: initialData.paperId || "", // Used for display only in edit
        institute: initialData.institute || "",
        branch: initialData.branch || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        mode: initialData.mode || "",
        submissionLink: initialData.submissionLink || "",
        coAuthors: initialData.coAuthors || [],
      });
    } else {
      setFormData(initialFormState);
    }
    setError(null);
  };

  return {
    formData,
    isSubmitting,
    error,
    handleChange,
    addCoAuthor,
    removeCoAuthor,
    handleCoAuthorChange,
    handleSubmit,
    handleUpdate,
    resetForm
  };
}
