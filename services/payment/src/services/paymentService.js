
// Payment service - encapsulates Stripe and DB logic.
// - createPaymentIntent(orderId, amount, currency): create DB record and Stripe PaymentIntent
// - handleStripeEvent(event): update DB record and notify Order Service synchronously via Axios
// - cancelPayment(paymentIntentId): cancel on Stripe, update DB and optionally notify Order Service
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const axios = require('axios');
const Payment = require('../models/Payment');

async function createPaymentIntent(orderId, amount, currency='usd') {
  // Create DB record (pending)
  const payment = new Payment({ orderId, amount, currency, status: 'pending' });
  await payment.save();

  // Create Stripe PaymentIntent with metadata linking to our payment record
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata: { paymentId: payment._id.toString(), orderId }
  });

  // Save Stripe id back to DB
  payment.stripePaymentIntentId = intent.id;
  payment.metadata = intent.metadata || {};
  await payment.save();

  return { payment, clientSecret: intent.client_secret };
}

async function handleStripeEvent(event) {
  const type = event.type;
  // Only handle relevant payment_intent events
  if (!type.startsWith('payment_intent.')) return;

  const intent = event.data.object;
  const stripeId = intent.id;

  // Find our Payment record by stripePaymentIntentId
  const payment = await Payment.findOne({ stripePaymentIntentId: stripeId });
  if (!payment) {
    console.warn('[paymentService] no payment record for intent', stripeId);
    return;
  }

  if (type === 'payment_intent.succeeded') {
    payment.status = 'succeeded';
    await payment.save();
    // Notify Order Service synchronously that payment succeeded
    try {
      await axios.put(`${process.env.ORDER_SERVICE_URL}/order/${payment?.metadata?.orderId}/`, { status: 'paid' });
    } catch (err) {
      console.error('[paymentService] failed to notify order service of success', err.message);
    }
  } else if (type === 'payment_intent.payment_failed') {
    payment.status = 'failed';
    await payment.save();
    try {
      await axios.put(`${process.env.ORDER_SERVICE_URL}/order/${payment?.metadata?.orderId}`, { status: 'failed' });
    } catch (err) {
      console.error('[paymentService] failed to notify order service of failure', err.message);
    }
  } else if (type === 'payment_intent.canceled' || type === 'payment_intent.cancellation_requested') {
    payment.status = 'cancelled';
    await payment.save();
    try {
      await axios.put(`${process.env.ORDER_SERVICE_URL}/order/${payment?.metadata?.orderId}`, { status: 'cancelled' });
    } catch (err) {
      console.error('[paymentService] failed to notify order service of cancellation', err.message);
    }
  } else {
    // ignore other events
    console.log('[paymentService] unhandled event type', type);
  }
}

async function cancelPayment(paymentIntentId) {
  // Cancel PaymentIntent on Stripe
  const cancelled = await stripe.paymentIntents.cancel(paymentIntentId);
  // Update DB record if exists
  const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
  console.log(payment)
  if (payment) {
    payment.status = 'cancelled';
    await payment.save();
    // Notify order service
    try {
      await axios.put(`${process.env.ORDER_SERVICE_URL}/order/${payment.metadata.orderId}`, { status: 'cancelled' });
    } catch (err) {
      console.error('[paymentService] failed to notify order service after cancel', err.message);
    }
  } 
  return cancelled; 
}

module.exports = { createPaymentIntent, handleStripeEvent, cancelPayment };
