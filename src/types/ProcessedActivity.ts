import mongoose from "mongoose";

const processedActivitySchema = new mongoose.Schema({
    activityId: {
        type: String,
        required: true,
        unique: true,
    },
    processedAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model("ProcessedActivity", processedActivitySchema);
