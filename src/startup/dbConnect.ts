import mongoose from 'mongoose';
import { config } from '../config';

export default () => {

    if (!config.MONGODB_URI) {
        throw new Error("MONGODB_URI is not defined");
    }
    mongoose
        .connect(config.MONGODB_URI)
        .then(() => console.log("Connected to MongoDB"))
        .catch((error: any) => console.error(error));
};