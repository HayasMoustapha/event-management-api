const Event = require('../models/Event');
const moment = require('moment');

const updateEventStatus = async () => {
    try {
        const events = await Event.find({ 
           $or: [
                { 
                    endDate: { $lt: moment.utc(new Date()).format('YYYY-MM-DD') }
                },
                {
                    endDate: moment.utc(new Date()).format('YYYY-MM-DD'),
                    endTime: { $lt: moment.utc(new Date(), 'HH:mm').add(1, 'hour').toDate() }
                }
           ], 
            status: { $ne: 'terminated' } 
        });

        events.forEach(async (event) => {
            await Event.findOneAndUpdate({ _id: event._id }, { $set: { status: 'terminated' } });
            console.log('Event status updated to terminated');
            console.log(event.status)
        })

    } catch (error) {
        console.error('Error updating event status:', error);
    }
}; 

setInterval(updateEventStatus, 86400000); // Execute every 24 hours