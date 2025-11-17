// Payment service entrypoint
const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const databaseConnection = require('./utils/database');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.use(bodyParser.json())
 
dotenv.config()
databaseConnection();

app.use(errorHandler);
// mount payment routes; webhook uses raw body
app.use('/', require('./routes/payments')); 


app.listen(process.env.PAYMENT_PORT, () => {
    console.log(`Payment service running on port ${process.env.PAYMENT_PORT}`);
});
