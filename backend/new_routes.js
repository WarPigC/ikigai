const express = require('express');

module.exports = function(app, Event, SessionChair, Participant, hashPassword, sendMail, getNextId) {
  // Event DELETE
  app.delete("/api/admin/events/:id", async (req, res) => {
    try {
      const eventId = req.params.id;
      await Event.findByIdAndDelete(eventId);
      await SessionChair.deleteMany({ eventId });
      await Participant.deleteMany({ eventId });
      res.json({ success: true, message: "Event deleted" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Track POST
  app.post("/api/admin/events/:id/tracks", async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) return res.status(404).json({ success: false });
      
      const existingIds = event.tracks.map(t => parseInt(t.id, 10)).filter(n => !isNaN(n));
      const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
      const trackId = nextId.toString().padStart(3, "0");

      const newTrack = {
        id: trackId,
        title: req.body.title,
        description: req.body.description,
        assessmentLocked: true,
        meetingLink: ""
      };
      
      event.tracks.push(newTrack);
      await event.save();
      res.json({ success: true, track: newTrack });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Track PUT
  app.put("/api/admin/events/:id/tracks/:trackId", async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) return res.status(404).json({ success: false });
      
      const track = event.tracks.find(t => t.id === req.params.trackId);
      if (!track) return res.status(404).json({ success: false });
      
      track.title = req.body.title;
      track.description = req.body.description;
      await event.save();
      res.json({ success: true, track });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Track DELETE
  app.delete("/api/admin/events/:id/tracks/:trackId", async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) return res.status(404).json({ success: false });
      
      event.tracks = event.tracks.filter(t => t.id !== req.params.trackId);
      await event.save();
      
      // Also delete related evaluators and participants
      await SessionChair.deleteMany({ eventId: req.params.id, trackId: req.params.trackId });
      await Participant.deleteMany({ eventId: req.params.id, trackId: req.params.trackId });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Evaluator POST
  app.post("/api/admin/evaluators", async (req, res) => {
    try {
      const { eventId, trackId, name, email, phone } = req.body;
      const exists = await SessionChair.findOne({ email, eventId, trackId });
      if (exists) return res.status(400).json({ success: false, message: "Evaluator with this email already exists in this track." });
      
      const tempPassword = Math.random().toString(36).slice(-8);
      const evaluator = await SessionChair.create({
        name,
        email: email.trim().toLowerCase(),
        phone,
        type: "Evaluator", // Default for legacy compatibility
        passwordHash: hashPassword(tempPassword),
        trackId,
        eventId
      });

      // Attempt to send email but don't fail if it doesn't work
      try {
        await sendMail({
          from: `"HackEval" <${process.env.MAIL_USER}>`,
          to: email,
          subject: "HackEval – Evaluator Invitation",
          html: `<p>Hello <b>${name}</b>,</p><p>You have been assigned as an Evaluator.</p><p><b>Track:</b> ${trackId}</p><p><b>Login Email:</b> ${email}</p><p><b>Temporary Password:</b> ${tempPassword}</p>`
        });
      } catch (e) {
        console.error("Email failed", e);
      }
      
      res.json({ success: true, evaluator });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Evaluator PUT
  app.put("/api/admin/evaluators/:id", async (req, res) => {
    try {
      const { name, email, phone } = req.body;
      const evaluator = await SessionChair.findByIdAndUpdate(req.params.id, {
        name, email: email.trim().toLowerCase(), phone
      }, { new: true });
      res.json({ success: true, evaluator });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Evaluator DELETE
  app.delete("/api/admin/evaluators/:id", async (req, res) => {
    try {
      await SessionChair.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
};
