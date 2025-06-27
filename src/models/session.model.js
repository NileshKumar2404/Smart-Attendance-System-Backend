import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    },
    date: Date,
    qrCode: String,
    expiresAt: Date

}, {timestamps: true})

export const session = mongoose.model("Session", sessionSchema)