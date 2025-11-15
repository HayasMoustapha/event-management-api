const dotenv = require('dotenv')
const express = require('express');
const bodyParser = require('body-parser');
const ticketRoutes = require('./routes/tickets');
const databaseConnection = require('./utils/database');
require('./controllers/ticketAvailability')
const port = process.env.TICKET_PORT || 3000;
  
dotenv.config();  
databaseConnection();
 
const app = express(); 
 
app.use(bodyParser.json());

app.use('/', ticketRoutes);

app.listen(port, () => console.log(`Ticket service running on port ${port}`));