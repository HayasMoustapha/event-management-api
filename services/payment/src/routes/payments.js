
// Payment controller - HTTP endpoints for payments
// Endpoints:
// POST /payments/create-intent    -> create PaymentIntent and store Payment (returns client_secret)
// POST /payments/webhook          -> Stripe webhook (raw body); updates DB and notifies Order Service
// POST /payments/simulate-success -> dev helper to mark order as paid (calls Order Service)
// POST /payments/cancel           -> cancel a PaymentIntent and update DB + Order Service
// DELETE /payments/delete         -> cancel (delete) a PaymentIntent and mark DB as deleted
const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const Payment = require('../models/Payment');
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const { auth } = require('../middlewares/auth');
const { createPaymentIntent, handleStripeEvent, cancelPayment } = require('../services/paymentService');
const axios = require('axios');

// Get all payment
router.get('/payments', async (req, res) => {
  try {
    const payments = await Payment.find();
    if (!payments) return res.status(404).json({ message: 'payments not found' });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Payment Not Found' });
  }
})

// create payment intent
router.post('/order/:orderId/payment/create-intent', auth, async (req, res) => {
  try {
    const { currency } = req.body;
    const orderId = req.params.orderId;
    const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];

    const response = await axios.get(`${process.env.ORDER_SERVICE_URL}/order/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).then((response) => {
      console.log('Order found')
      return response
    }).catch((error) => {
      console.log(error)
      return res.status(403).json({ message: 'Order not found' })
    });

    const amount = await response?.data?.total
    if (!orderId || !amount) return res.status(400).json({ message: 'orderId and amount required' });
    const { payment, clientSecret } = await createPaymentIntent(orderId, parseFloat(amount), currency || 'usd');

    res.json({ paymentId: payment._id.toString(), clientSecret, stripeId: payment.stripePaymentIntentId });
  } catch (err) {
    console.error('create-intent error', err);
    res.status(500).json({ message: 'Payment create request failed' });
  }
});

// stripe webhook - raw body required
router.post('/payment/webhook', auth, bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    // delegate to service handler
    await handleStripeEvent(event);
    res.json({ received: true });
  } catch (err) {
    console.error('webhook error', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// simulate success (dev helper)
router.post('/payment/simulate-success', auth, async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'orderId required' });
    const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];

    await axios.put(`${process.env.ORDER_SERVICE_URL}/order/${orderId}`, { 
      message: process.env.PAYMENT_PAID_MESSAGE, 
      status: 'paid'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).then((response) => {
      console.log('Paiment succeded')
    }).catch((error) => {
      res.status(500).json({ message: "Simulate payment request failed" });
    })

    res.json({ message: 'Order marked as paid (simulated)' });
  } catch (err) {
    console.error('simulate-success error', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// cancel payment
router.post('/payment/cancel', auth, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) return res.status(400).json({ message: 'paymentIntentId required' });
    const cancelled = await cancelPayment(paymentIntentId);

    const Payment = require('../models/Payment');
    const p = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
    const orderId = p?.metadata?.orderId;
    const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];

    await axios.put(`${process.env.ORDER_SERVICE_URL}/order/${orderId}`, { 
      message: process.env.PAYMENT_CANCELLED_MESSAGE, 
      status: 'cancelled'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).then((response) => {
      console.log('Paiment canceled send to order service')
    }).catch((error) => {
      res.status(500).json({ message: "Delete payment's array in order collection request failed" });
    })
    res.json({ message: 'Payment cancelled', cancelled });
  } catch (err) {
    console.error('cancel error', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// delete payment (alias for cancel + mark deleted)
router.delete('/payment/delete', auth, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) return res.status(400).json({ message: 'paymentIntentId required' });
    const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];

    const cancelled = await cancelPayment(paymentIntentId);
    // mark DB record as deleted if exists
    const Payment = require('../models/Payment');
    const p = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
    if (p) {
      p.status = 'deleted';
      await p.save();
      const orderId = p?.metadata?.orderId;
      await axios.put(`${process.env.ORDER_SERVICE_URL}/order/${orderId}`, { 
        message: process.env.PAYMENT_DELETED_MESSAGE, 
        status: 'deleted' 
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }).then((response) => {
        console.log('Paiment canceled send to order service')
      }).catch((error) => {
        res.status(500).json({ message: "Delete payment's array in order collection request failed" });
      })
    }
    res.json({ message: 'Payment deleted (cancelled)', cancelled });
  } catch (err) {
    console.error('delete error', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
