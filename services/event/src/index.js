const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const eventRoutes = require('./routes/events');
const databaseConnection = require('./utils/database');
require('./controllers/eventFilled')
require('./controllers/eventTerminated')

dotenv.config()    
databaseConnection();  
       
const app = express(); 
app.use(bodyParser.json())   
 
app.use('/', eventRoutes); 


app.listen(process.env.EVENT_PORT, () => {
    console.log(`Event service running on port ${process.env.EVENT_PORT}`);
});