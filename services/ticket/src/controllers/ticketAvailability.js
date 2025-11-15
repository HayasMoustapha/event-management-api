const Ticket = require('../models/Ticket');
const axios = require('axios');

const updateTicketStatus = async () => {
    try {
        const tickets = await Ticket.find({ status : { $ne: 'unavailable' } });
        tickets.forEach(async (ticket) => {
            const orders = await axios.get(`${process.env.ORDER_SERVICE_URL}/order/ticket/${ticket._id}`).then((response) => {
                return response.data
            })

            const totalQuantity = orders.reduce((total, order) => total + order.quantity, 0);

            if (totalQuantity >= ticket.quantity) {
                await Ticket.updateOne({ _id: ticket._id }, { status : 'unavailable' });
                console.log('Ticket status updated to filled');
            } else {
                await Ticket.updateOne({ _id: ticket._id }, { status : 'available' });
                console.log('Ticket status updated to available');
            }
        })
    } catch (error) {
        console.error('Error updating ticket status:', error);
    }
};

setInterval(updateTicketStatus, 3600000); // Execute every 1 hour