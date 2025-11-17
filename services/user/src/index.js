const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const databaseConnection = require('./utils/database');
const errorHandler = require('./middlewares/errorHandler');

const app = express();  
  
    
dotenv.config()   
app.use(bodyParser.json())   
         
databaseConnection();  
app.use(errorHandler);
app.use('/', authRoutes);
app.use('/', userRoutes); 
 
app.listen(process.env.USER_PORT, () => {
    console.log(`Auth service running on port ${process.env.USER_PORT}`);
});