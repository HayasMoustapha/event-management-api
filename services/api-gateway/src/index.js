const express = require('express')
const axios = require('axios')
const cors = require('cors')
require('dotenv').config();

const app = express()
app.use(express.json())
app.use(cors())

// Configuration des services
const services = {
    users: process.env.USER_SERVICE_URL,
    auth: process.env.USER_SERVICE_URL,
    events: process.env.EVENT_SERVICE_URL,
    tickets: process.env.TICKET_SERVICE_URL,
    orders: process.env.ORDER_SERVICE_URL,
    payments: process.env.PAYMENT_SERVICE_URL
}


const proxy = (service) => {
    return async (req, res) => {
        const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];
        console.log(`Request received for ${req.method} ${req.url}`)
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
        res.set('Pragma', 'no-cache')
        res.set('Expires', '0')
        try {
            console.log({ url: `${services[service]}` })
            console.log({ url: `${req.url}` })
            console.log({ url: `${services[service]}${req.url}` })
            const response = await axios({
                method: req.method,
                url: `${services[service]}${req.url}`,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                data: req.body 
            });

            console.log(`Response received for ${response.status} ${response.statusText}`)
            res.status(response.status).send(response.data);
        }
        catch (error) {
            console.error(error);
            res.status(500).send({ error: 'Internal server error' });
        }
    } 
}   
 
// Route pour les services  
app.use('/user-service', proxy('users')) 
app.use('/auth-service', proxy('auth')) 
app.use('/event-service', proxy('events'))
app.use('/ticket-service', proxy('tickets'))
app.use('/order-service', proxy('orders')) 
app.use('/payment-service', proxy('payments'))

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`API Gateway listening on ${port}`)); 