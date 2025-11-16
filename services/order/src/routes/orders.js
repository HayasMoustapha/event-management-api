
/*
  Order routes
  - Public listing and detail endpoints
  - Protected create/update/delete for admin role
*/
const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const Order = require('../models/Order');
const axios = require('axios');
const { auth, authorizeRoles } = require('../middlewares/auth');

dotenv.config();

router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find();
        if (!orders) return res.status(404).json({ message: 'Orders not found' });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Orders Not Found' });
    }
});

router.get('/order/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'order not found' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/ticket/:ticketId/orders', async (req, res) => {
    try {
        const orders = await Order.find({ ticketId: req.params.ticketId });
        if (!orders) return res.status(404).json({ message: 'orders not found' });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Orders Not Found' });
    }
});


router.get('/event/:eventId/orders', async (req, res) => {
    try {
        const orders = await Order.find({ eventId: req.params.eventId });
        if (!orders) return res.status(404).json({ message: 'orders not found' });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Order Not Found' });
    }
});

router.post('/ticket/:ticketId/order', auth, authorizeRoles("client"), async (req, res) => {
    try {
        if (req.user.role !== 'client') return res.status(403).json({ message: 'Access denied' });
        const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];

        const response = await axios.get(`${process.env.TICKET_SERVICE_URL}/ticket/${req.params.ticketId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }).then((response) => {
            console.log('Ticket found')
            return response
        }).catch((error) => {
            console.log(error)
            return res.status(403).json({ message: 'Ticket not found' })
        });

        const ticket = await response.data

        const event = await axios.get(`${process.env.EVENT_SERVICE_URL}/event/${ticket.eventId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }).then((response) => {
            return response.data
        }).catch((error) => {
            res.status(500).json({ message: 'Event not found' });
        });


        if (ticket.status !== 'available') return res.status(403).json({ message: 'Ticket not available' })

        const result = await Order.aggregate([
            {
                $group: {
                    _id: "$ticketId",
                    sum: { $sum: "$quantity" }
                }
            }
        ])

        const cumulativeCapacity = result[0]?.sum + req.body?.quantity;
        console.log(result[0]?.sum)
        console.log({ cumulativeCapacity, qte: req.body?.quantity })
        console.log(ticket.quantity)
        if (cumulativeCapacity > ticket.quantity) {
            return res.status(403).json({ message: 'Ticket capacity exceeded' })
        }

        if (req.body.quantity <= 0) {
            return res.status(403).json({ message: 'Quantity must be greater than 0' })
        }

        if (cumulativeCapacity === ticket.quantity) {
            await axios.put(`${process.env.TICKET_SERVICE_URL}/ticket/${req.params.ticketId}`, { status: 'unavailable' }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }).then((response) => {
                console.log("Order set ticket's status to unavailable and send  to ticket service")
            }).catch((error) => {
                console.log(error)
                res.status(500).json({ message: "Update ticket's status request failed" });
            })
        }

        if (event.category === 'free') {
            req.body.status = 'paid'
        }

        const order = new Order({ ...req.body, userId: req.user._id, ticketId: req.params.ticketId, eventId: ticket.eventId, total: ticket.price * req.body.quantity });
        await order.save();

        await axios.put(`${process.env.TICKET_SERVICE_URL}/ticket/${req.params.ticketId}`, { message: process.env.ORDER_CREATED_MESSAGE, orderId: order._id }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }).then((response) => {
            console.log('Order created send to ticket service')
        }).catch((error) => {
            res.status(500).json({ message: "Update orders's array in ticket collection request failed  (post route)" });
        })

        res.status(201).json(order);
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Order create request failed" });
    }
});


router.put('/order/:id', auth, authorizeRoles("admin", "client"), async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== "client") return res.status(403).json({ message: 'Access denied' });

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (req.body.message === process.env.PAYMENT_PAID_MESSAGE) {
            const orderUpdate = await Order.findByIdAndUpdate(req.params.id, { $set: { status: req.body.status } });
            return res.json(orderUpdate);
        }

        if (req.body.message === process.env.PAYMENT_CANCELED_MESSAGE || req.body.message === process.env.PAYMENT_DELETED_MESSAGE) {
            const orderUpdate = await Order.findByIdAndUpdate(req.params.id, { $set: { status: req.body.status } });
            return res.json(orderUpdate);
        }

        const orderUpdate = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(orderUpdate)

    } catch (err) {
        res.status(500).json({ message: 'Order update request failed' });
    }
});

router.delete('/order/:id', auth, authorizeRoles("admin", "client"), async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== "client") return res.status(403).json({ message: 'Access denied' });
        const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];

        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ message: 'Order not found' });

        await Order.findByIdAndDelete(req.params.id);

        await axios.put(`${process.env.TICKET_SERVICE_URL}/ticket/${order.ticketId}`, { message: process.env.ORDER_DELETED_MESSAGE, orderId: req.params.id, quantity: order.quantity }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }).then((response) => {
            console.log('Order deleted send to ticket service')
        }).catch((error) => {
            res.status(500).json({ message: 'Update orders array in ticket collection request failed  (delete route)' });
        })

        res.json({ message: 'Order deleted' });
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Order delete request failed' });
    }
});

module.exports = router;
