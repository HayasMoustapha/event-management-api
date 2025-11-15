
/*
  Event routes
  - Public listing and detail endpoints
  - Protected create/update/delete for admin role
*/
const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const Event = require('../models/Event');
const moment = require('moment');
const { auth, authorizeRoles } = require('../middlewares/auth');

dotenv.config();

router.get('/events', async (req, res) => {
  try {
    const events = await Event.find();
    if (!events) return res.status(404).json({ message: 'Events not found' });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Get events error' });
  }
});


router.get('/event/:id', async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: 'Event not found' });
    res.json(ev);
  } catch (err) {
    res.status(500).json({ message: 'Get single event error' });
  }
});

router.post('/event', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    const event = req.body;

    event.startDate = moment.utc(event.startDate, 'YYYY-MM-DD').toDate();
    event.endDate = moment.utc(event.endDate, 'YYYY-MM-DD').toDate();
    event.startTime = moment.utc(event.startTime, 'HH:mm').toDate();
    event.endTime = moment.utc(event.endTime, 'HH:mm').toDate();
    const now = moment.utc().toDate();
    const time = moment.utc().format('HH:mm');

    if ((event.duration < 0 || !event.duration) && start > end) {
      return res.status(403).json({ message: 'Start date must be before end date' });
    }
    if ((event.duration < 0 || !event.duration) && end < start) {
      return res.status(403).json({ message: 'End date must be after start date' });
    }

    if (event.endDate < event.startDate) {
      return res.status(403).json({ message: 'End date must be after start date' });
    }

    if (event.startDate < now) {
      return res.status(403).json({ message: 'Start date must be in the future' });
    }

    if(event.endTime < event.startTime) {
      return res.status(403).json({ message: 'End time must be after start time' });
    }

    if(event.startTime < time) {
      return res.status(403).json({ message: 'Start time must be in the future' });
    }

    if(event.capacity <= 0) {
      return res.status(403).json({ message: 'Capacity must be greater than 0' });
    } 

    // If the event duration set, calculate the end date
    if (event.duration > 0) {
      const endTime = new Date(event.startDate);
      endTime.setDate(endTime.getDate() + event.duration);
      event.endDate = moment.utc(endTime, 'YYYY-MM-DD').toDate();
    }

    const ev = new Event(event);
    await ev.save();
    res.status(201).json(ev);
  } catch (err) {
    res.status(500).json({ message: 'Event create error' });
  }
});


router.put('/event/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    if (req.body.message === process.env.TICKET_CREATED_MESSAGE) {
      const eventUpdate = await Event.findByIdAndUpdate(req.params.id, { $push: { tickets: req.body.ticketId } });
      return res.json(eventUpdate);
    }

    if (req.body.message === process.env.TICKET_DELETED_MESSAGE) {
      const eventUpdate = await Event.findByIdAndUpdate(req.params.id, { $pull: { tickets: req.body.ticketId } });
      return res.json(eventUpdate);
    }

      const eventUpdate = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(eventUpdate);

  } catch (err) {
    res.status(500).json({ message: 'Event update error' });
  }
});

router.delete('/event/:id', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Event delete error' });
  }
});

module.exports = router;
