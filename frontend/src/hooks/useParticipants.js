import { useState, useEffect } from "react";
import { studentApi } from "../services/studentApi";

export function useParticipants(eventId, trackId) {
  const [participants, setParticipants] = useState([]);
  const [proofs, setProofs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const refresh = () => setRefreshCounter(c => c + 1);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!eventId || !trackId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await studentApi.fetchParticipants(eventId, trackId);
        
        if (!isMounted) return;

        const fetchedParticipants = res.participants || [];
        setParticipants(fetchedParticipants);

        // Fetch proofs concurrently to avoid N+1 blocking behavior while preserving the API contract
        const proofPromises = fetchedParticipants.map(async (p) => {
          const proofData = await studentApi.fetchProofStatus(p._id);
          return { id: p._id, data: proofData };
        });

        const proofResults = await Promise.all(proofPromises);
        
        if (!isMounted) return;
        
        const newProofs = {};
        proofResults.forEach((res) => {
          if (res.data) {
            newProofs[res.id] = res.data;
          }
        });
        
        setProofs(newProofs);
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load participants:", err);
          setError("Failed to load participants.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [eventId, trackId, refreshCounter]);

  return { participants, proofs, loading, error, refresh };
}
