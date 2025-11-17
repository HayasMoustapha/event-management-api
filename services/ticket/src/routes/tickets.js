
/*
  Ticket routes
  - Manage tickets for an event
  - Admin can create/update/delete tickets
*/
const express = require('express');
const axios = require('axios');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { auth, authorizeRoles } = require('../middlewares/auth');
const _ = require('underscore');

const dotenv = require('dotenv');
const { default: mongoose } = require('mongoose');

dotenv.config();

router.get('/tickets', async (req, res) => {
  try {
    const tickets = await Ticket.find();
    if (!tickets) return res.status(404).json({ message: 'Tickets not found' });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: 'Get tickets failed' });
  }
});

router.get('/ticket/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Get ticket failed' });
  }
});

router.get('/event/:eventId/tickets', async (req, res) => {
  try {
    const tickets = await Ticket.find({ eventId: req.params.eventId });
    if (!tickets) return res.status(404).json({ message: 'Tickets not found' });
    res.json(tickets);
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Get event tickets failed' });
  }
});

router.post('/event/:eventId/ticket', auth, authorizeRoles("admin"), async (req, res, next) => {
  try {
    const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const response = await axios.get(`${process.env.EVENT_SERVICE_URL}/event/${req.params.eventId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).then((response) => {
      return response
    }).catch((error) => {
      res.status(500).json({ message: 'Event not found' });
    });
    const event = _.omit(await response?.data, ['__v', 'createdAt', 'updatedAt', 'tickets']);
    const { category, price, quantity } = req.body;

    const result = await Ticket.aggregate([
      {
        $group: {
          _id: "$eventId",
          sum: { $sum: "$quantity" }
        }
      }
    ])

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status === 'cancelled' || event.status === 'terminated' || event.status === 'filled') {
      return res.status(403).json({ message: 'Event already ' + event.status })
    }

    if (event.category === 'free' && price > 0) {
      return res.status(403).json({ message: 'Event is free, price must be 0' });
    }

    if (price <= 0 && event.category === 'paid') {
      return res.status(403).json({ message: 'Price must be greater than 0 because event is paid' })
    }

    if (price > 0 && event.category === 'free') {
      return res.status(403).json({ message: 'Price must be 0 because event is free' })
    }

    const cumulativeCapacity = result[0]?.sum + quantity;

    if (cumulativeCapacity > event.capacity) {
      return res.status(403).json({ message: 'Event capacity exceeded' })
    }

    if (quantity <= 0) {
      return res.status(403).json({ message: 'Quantity must be greater than 0' })
    }

    if (quantity > event.capacity) {
      return res.status(403).json({ message: 'Event capacity exceeded' })
    }
    const ticket = new Ticket({ eventId: req.params.eventId, category, price, quantity, eventId: event._id });
    await ticket.save();

    await axios.put(`${process.env.EVENT_SERVICE_URL}/event/${req.params.eventId}`, { message: process.env.TICKET_CREATED_MESSAGE, ticketId: ticket._id }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).then((response) => {
      console.log('Ticket created send to event service')
    }).catch((error) => {
      console.log(error)
      res.status(500).json({ message: "Update ticket's array in event colleciton request failed  (post route)" });
    })
    res.status(201).json(ticket)
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/ticket/:id', auth, authorizeRoles("admin", "client"), async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== "client") return res.status(403).json({ message: 'Access denied' });

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (req.body.message === process.env.ORDER_CREATED_MESSAGE) {
      const ticketUpdate = await Ticket.findByIdAndUpdate(req.params.id, { $push: { orders: req.body.orderId } });
      return res.json(ticketUpdate);
    }

    if (req.body.message === process.env.ORDER_DELETED_MESSAGE) {
      const ticketUpdate = await Ticket.findByIdAndUpdate(req.params.id, { $pull: { orders: req.body.orderId }, $set: { status: 'available' } });
      return res.json(ticketUpdate);
    }

    const ticketUpdate = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(ticketUpdate);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// This is only for orderUpdate Event in Order Service
router.put('/ticket/:id/order', async (req, res) => {
  try {

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (req.body.message === process.env.ORDER_CREATED_MESSAGE) {
      const ticketUpdate = await Ticket.findByIdAndUpdate(req.params.id, { $push: { orders: req.body.orderId } });
      return res.json(ticketUpdate);
    }

    if (req.body.message === process.env.ORDER_DELETED_MESSAGE) {
      const ticketUpdate = await Ticket.findByIdAndUpdate(req.params.id, { $pull: { orders: req.body.orderId }, $set: { status: 'available' } });
      return res.json(ticketUpdate);
    }

    const ticketUpdate = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(ticketUpdate);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/ticket/:id', auth, authorizeRoles("admin", "client"), async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== "client") return res.status(403).json({ message: 'Access denied' });
    const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    await Ticket.findByIdAndDelete(req.params.id);
    await axios.put(`${process.env.EVENT_SERVICE_URL}/event/${ticket.eventId}`, { message: process.env.TICKET_DELETED_MESSAGE, ticketId: req.params.id }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).then((response) => {
      console.log('Ticket deleted send to event service')
    }).catch((error) => {
      console.log(error)
      res.status(500).json({ message: "Update ticket's array in event collection request failed (delete route)" });
    })
    res.json({ message: 'Ticket deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Ticket delete failed' });
  }
});

module.exports = router;
