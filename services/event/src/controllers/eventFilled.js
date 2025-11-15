const Event = require('../models/Event');
const axios = require('axios');

const updateEventStatus = async () => {
    try {
        const events = await Event.find({ status : { $ne: 'filled' } });
        events.forEach(async (event) => {
            const tickets = await axios.get(`${process.env.TICKET_SERVICE_URL}/event/${event._id}/ticket/`).then((response) => {
                return response.data
            })

            const totalQuantity = tickets.reduce((total, ticket) => total + ticket.quantity, 0);

            if (totalQuantity >= event.capacity) {
                await Event.updateOne({ _id: event._id }, { status : 'filled' });
                console.log('Event status updated to filled');
            } else {
                await Event.updateOne({ _id: event._id }, { status : 'active' });
                console.log('Event status not updated');
            }
        })
    } catch (error) {
        console.error('Error updating event status:', error);
    }
};

setInterval(updateEventStatus, 3600000); // Execute every 1 hour