import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        unique: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        unique: true 
    },
    markedAt: Date,
}, {timestamps: true})

attendanceSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

export const attendance = mongoose.model("Attendance", attendanceSchema)