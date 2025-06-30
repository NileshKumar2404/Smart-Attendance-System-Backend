import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { Attendance } from "../models/attendance.model.js"
import {Session} from "../models/session.model.js"
import { Class } from "../models/class.model.js"
import mongoose from "mongoose"

const MarkAttendance = asyncHandler(async (req, res) => {
    //Students mark the attendance using qrCode - it sends studentId, sessionId
    //check the session is exists or not
    //assign date
    //check the expires time of the qr code using date
    //check if the student is belongs from that class or not
    //check if the student is already marked their attendance or not, otherwise mark the student attendance
    //create the attendance in db
    //return res

    try {
        const {sessionId} = req.body
        const studentId = req.user._id
    
        const session = await Session.findById(sessionId)
        if(!session) throw new ApiError(401, "Session not found");
    
        const now = new Date()
        if(now > session.expiresAt) throw new ApiError(401, "Qr Code expired");

        const classData = await Class.findById(session.classId)
        if(!classData.students.includes(studentId)) throw new ApiError(401, "Student not enrolled in the class");

        const alreadyMarked = await Attendance.findOne({sessionId, studentId})
        if(alreadyMarked) throw new ApiError(401, "The attendance of the student for that session is already marked");

        const attendance = await Attendance.create({
            sessionId,
            studentId,
            markedAt: now
        })

        if(!attendance) throw new ApiError(401, "Unable to create attendance");

        return res
        .status(201)
        .json(new ApiResponse(
            201,
            attendance,
            "Attendance marked successfully"
        ))
    } catch (error) {
        console.error("Failed to mark attendance:" , error);
    }
})

const getAttendanceForSession = asyncHandler(async (req, res) => {
    try {
        const {sessionId} = req.params

        const attendanceRecords = await Attendance.aggregate([
            {
                $match: {
                    sessionId: new mongoose.Types.ObjectId(sessionId)
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'studentId',
                    foreignField: '_id',
                    as: 'studentInfo'
                }
            },
            {
                $unwind: '$studentInfo'
            },
            {
                $project: {
                    sessionId: 1,
                    markedAt: 1,
                    studentId: {
                        _id: '$studentInfo._id',
                        name: '$studentInfo.name',
                        email: '$studentInfo.email'
                    }
                }
            }
        ])
        
        if(!attendanceRecords) throw new ApiError(401, "Failed to get attendance");

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            attendanceRecords,
            "Attendance fetched successfully."
        ))
    } catch (error) {
        console.error("Failed to get attendance for session: ", error);
    }
})

const getAttendanceForStudent = asyncHandler(async (req, res) => {
    try {
        const studentId = req.user._id
    
        const attendanceRecords = await Attendance.aggregate([
            {
                $match: {
                    studentId: new mongoose.Types.ObjectId(studentId)
                }
            },
            {
                $lookup: {
                    from: 'sessions',
                    localField: 'sessionId',
                    foreignField: '_id',
                    as: 'sessionInfo'
                }
            },
            { $unwind: '$sessionInfo' },
            {
                $lookup: {
                    from: 'classes',
                    localField: '$sessionInfo.classId',
                    foreignField: '_id',
                    as: 'classInfo'
                }
            },
            { $unwind: '$classInfo' },
            {
                $project: {
                    _id: 1,
                    sessionDate: '$sessionInfo.date',
                    className: '$classInfo.name',
                    subject: '$classInfo.subject'
                }
            }
        ])
    
        if(!attendanceRecords) throw new ApiError(401, "Failed to get attendance");
    
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            attendanceRecords,
            "Attendance fetched successfully."
        ))
    } catch (error) {
        console.error("Failed to get attendance: ", error);
    }
})

export {
    MarkAttendance,
    getAttendanceForSession,
    getAttendanceForStudent
}