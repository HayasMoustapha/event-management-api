
/*
  Event model
*/
const mongoose = require('mongoose');
const _ = require('underscore');

const EventSchema = new mongoose.Schema({
  name: {
    type: String, required: true, validate: [
      { validator: (value) => value.length <= 50, message: '{VALUE} must be less than 50 characters' },
      { validator: (value) => _.isString(value), message: '{VALUE} is not a string' }
    ]
  },
  startDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  duration: { type: Number, default: 0 },
  endDate: { type: Date },
  type: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ['free', 'paid'], default: 'paid' },
  capacity: {
    type: Number,
    required: true,
    validate: [
      { validator: Number.isInteger, message: '{VALUE} is not an integer' },
      { validator: (value) => value > 0, message: '{VALUE} must be greater than 0' }
    ]
  },
  status: { type: String, enum: ['active', 'terminated', 'cancelled', 'filled'], default: 'active' },
  tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }]
}, { timestamps: true });


module.exports = mongoose.model('Event', EventSchema);
