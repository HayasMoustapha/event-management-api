
/*
  Payment model
*/
const mongoose = require('mongoose');
const PaymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'usd' },
  status: { type: String, enum: ['pending', 'succeeded', 'failed', 'cancelled', 'deleted'], default: 'pending' },
  stripePaymentIntentId: { type: String },
  metadata: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
