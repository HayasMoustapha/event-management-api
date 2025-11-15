
/*
  Event model
*/
const mongoose = require('mongoose');
const EventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  duration: { type: Number,  default: 0 },
  endDate: { type: Date },
  type: { type: String }, 
  location: { type: String },
  description: { type: String },
  category: { type: String, enum: ['free', 'paid'], default: 'paid' },
  capacity: { type: Number, required: true },
  status: { type: String, enum: ['active', 'terminated', 'cancelled'], default: 'active' },
  tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }]
}, { timestamps: true });


module.exports = mongoose.model('Event', EventSchema);
