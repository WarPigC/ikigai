import { useState, useEffect } from "react";
import { studentApi } from "../services/studentApi";
import { useNavigate } from "react-router-dom";

export function useStudentSession() {
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSession = async () => {
      try {
        const email = sessionStorage.getItem("care_email");
        if (!email) {
          throw new Error("No session email found");
        }
        
        const data = await studentApi.fetchSession(email);
        if (!data.success) {
          throw new Error("Session expired or invalid");
        }
        
        setSessionData(data);
      } catch (err) {
        console.error("Session load error:", err);
        setError(err.message);
        sessionStorage.clear();
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [navigate]);

  return { sessionData, loading, error };
}
