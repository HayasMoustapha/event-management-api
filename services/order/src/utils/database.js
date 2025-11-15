const mongoose = require('mongoose')
const dotenv = require('dotenv')

dotenv.config()
const databaseConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("Connection succesfully with data base")
    } catch (error) {
        console.log(error)
    }
}


module.exports = databaseConnection