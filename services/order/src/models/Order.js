
/*
  Order model
*/
const mongoose = require('mongoose');
const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  quantity: { type: Number, required: true },
  total: { type: Number },
  status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
