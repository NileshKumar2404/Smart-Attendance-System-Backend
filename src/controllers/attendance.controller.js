import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { Attendance } from "../models/attendance.model.js"
import {Session} from "../models/session.model.js"
import { Class } from "../models/class.model.js"
import mongoose from "mongoose"
import haversine from "haversine-distance"

const MarkAttendance = asyncHandler(async (req, res) => {
    try {
        const {sessionId, latitude, longitude} = req.body
        const studentId = req.user._id

        if(!latitude || !longitude) throw new ApiError(400, "Location required");
    
        const session = await Session.findById(sessionId)
        if(!session) throw new ApiError(401, "Session not found");
    
        const now = new Date()
        if(now > session.expiresAt) throw new ApiError(401, "Qr Code expired");

        const classData = await Class.findById(session.classId)
        if(!classData.students.includes(studentId)) throw new ApiError(401, "Student not enrolled in the class");

        const alreadyMarked = await Attendance.findOne({sessionId, studentId})
        if(alreadyMarked) throw new ApiError(401, "The attendance of the student for that session is already marked");

        const classLocation = {
            latitude: classData.location.coordinates[1],
            longitude: classData.location.coordinates[0]
        }
        const studentLocation = {
            latitude: parseFloat(latitude), 
            longitude: parseFloat(longitude)
        }

        const distance = haversine(classLocation, studentLocation) //in meters
        if(distance > 100) throw new ApiError(403, "You are too far from the classroom");

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
        const studentId = req.user._id;

        // Step 1: Get classes in which the student is enrolled
        const classes = await Class.find({ students: studentId }).select('_id name subject');

        const classIds = classes.map(cls => cls._id);

        // Step 2: Get all sessions for those classes
        const sessions = await Session.find({ classId: { $in: classIds } })
            .populate('classId', 'name subject')
            .sort({ date: -1 });

        // Step 3: For each session, check if attendance is marked for the student
        const attendanceRecords = await Promise.all(
            sessions.map(async (session) => {
                const marked = await Attendance.findOne({
                    sessionId: session._id,
                    studentId,
                });

                return {
                    _id: session._id,
                    sessionDate: session.date,
                    className: session.classId.name,
                    subject: session.classId.subject,
                    status: marked ? 'Present' : 'Absent', // ✅ Add status
                };
            })
        );

        return res.status(200).json(
            new ApiResponse(
                200,
                attendanceRecords,
                'Attendance fetched successfully.'
            )
        );
    } catch (error) {
        console.error('Failed to get attendance: ', error);
        return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
});

const getAttendanceAnalyticsForTeacher = asyncHandler(async (req, res) => {
    try {
        const teacherId = req.user._id

        const classes = await Class.find({createdBy: teacherId}).select('_id name subject students');
        const classIds = classes.map(cls => cls._id)

        const analytics = await Promise.all(
            classes.map(async (cls) => {
                const sessions = await Session.find({classId: cls._id})

                const totalSessions = sessions.length
                const totalStudents = cls.students.length

                const attendanceCount = await Attendance.countDocuments({
                    sessionId: {$in: sessions.map(s => s._id)}
                })

                const totalPossible = totalSessions * totalStudents
                const percentage = totalPossible > 0 ? ((attendanceCount/totalPossible) * 100).toFixed(2) : 0

                return {
                    classsId: cls._id,
                    className: cls.name,
                    subject: cls.subject,
                    totalSessions,
                    totalStudents,
                    totalAttendanceMarked: attendanceCount,
                    attendancePercentage: percentage
                }
            })
        )

        return res
        .status(201)
        .json(new ApiResponse(
            201,
            analytics,
            "Attendance analytics fetched successfully."
        ))
    } catch (error) {
        console.error("Failed to get the data: ", error);   
    }
})

export {
    MarkAttendance,
    getAttendanceForSession,
    getAttendanceForStudent,
    getAttendanceAnalyticsForTeacher
}