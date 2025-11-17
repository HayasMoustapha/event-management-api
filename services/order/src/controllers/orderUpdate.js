const axios = require('axios');
const Order = require('../models/Order');

const updateTicketStatus = async (ticket) => {
    try {

        const orders = await Order.find({ _id: { $in: ticket.orders } });
        const allPaid = orders.every(order => order.status === 'paid');

        if (allPaid) {
            await axios.put(`${process.env.TICKET_SERVICE_URL}/ticket/${ticket._id}/order`, { status: 'sold' }).then((response) => {
                console.log('Order set ticket status to sold and send to ticket service')
            })
        }
    } catch (err) {
        throw new Error(err.message);
    }
}

Order.on('update', async (order) => {
    try {
        if (order.status === 'paid') {
            const ticket = await axios.get(`${process.env.TICKET_SERVICE_URL}/ticket/${order.ticketId}`).then((response) => {
                return response.data
            });
            if (ticket) {
                await updateTicketStatus(ticket);
            }
        }
    } catch (err) {
        console.log(err);
    }
})

Order.on('save', async (order) => {
    try {
        if (order.status === 'paid') {
            const ticket = await axios.get(`${process.env.TICKET_SERVICE_URL}/ticket/${order.ticketId}`).then((response) => {
                return response.data
            });
            if (ticket) {
                await updateTicketStatus(ticket);
            }
        }
    } catch (err) {
        console.log(err);
    }
}
)

