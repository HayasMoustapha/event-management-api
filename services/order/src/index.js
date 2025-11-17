require('./controllers/orderUpdate')
const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const orderRoutes = require('./routes/orders');
const databaseConnection = require('./utils/database');
const errorHandler = require('./middlewares/errorHandler');


dotenv.config() 
databaseConnection();  

const app = express(); 
app.use(bodyParser.json())
app.use(errorHandler);

app.use('/', orderRoutes);


app.listen(process.env.ORDER_PORT, () => {
    console.log(`Order service running on port ${process.env.ORDER_PORT}`);
});