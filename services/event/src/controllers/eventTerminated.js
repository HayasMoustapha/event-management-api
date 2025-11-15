const Event = require('../models/Event');
const moment = require('moment');

const updateEventStatus = async () => {
    try {
        const events = await Event.find({ 
           $or: [
                { 
                    endDate: { $lt: moment.utc().toDate() }
                },
                {
                    endDate: moment.utc().toDate(),
                    endTime: { $lt: moment.utc().format('HH:mm') }
                }
           ], 
            status: { $ne: 'terminated' } 
        });
        events.forEach(async (event) => {
            await Event.updateOne({ _id: event._id }, { $set: { status: 'terminated' } });
            console.log('Event status updated to terminated');
        })
    } catch (error) {
        console.error('Error updating event status:', error);
    }
};

setInterval(updateEventStatus, 8640000); // Execute every 24 hours