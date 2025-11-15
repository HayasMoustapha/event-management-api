
/*
  Ticket model
*/
const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  category: { type: String, enum: ['vip', 'classic'], default: 'classic' },
  price: { type: Number, default: 0 },
  quantity: { type: Number, required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  status: { type: String, enum: ['available', 'sold', 'unavailable'], default: 'available' }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', TicketSchema);
