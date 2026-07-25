import React from "react";
import MeetingLink from "./MeetingLink";

export default function TrackDetails({ event, track, onUpdateLink }) {
  return (
    <div>
      <div className="text-xl font-semibold text-green-700">
        {track?.id} — {track?.title}
      </div>

      <div className="text-sm font-semibold text-gray-700 mt-1">
        {event?.title}
      </div>

      <div className="text-sm text-gray-600 mt-3 break-words leading-relaxed text-justify">
        {track?.description}
      </div>

      <MeetingLink 
        initialLink={track?.meetingLink} 
        eventId={event?._id}
        trackId={track?.id}
        onUpdateLink={onUpdateLink}
      />
    </div>
  );
}
