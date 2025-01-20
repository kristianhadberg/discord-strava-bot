const mongoose = require('mongoose');
require('dotenv').config();

module.exports = () => {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not defined");
    }
    mongoose
        .connect(process.env.MONGODB_URI)
        .then(() => console.log("Connected to MongoDB"))
        .catch((error: any) => console.error(error));
};