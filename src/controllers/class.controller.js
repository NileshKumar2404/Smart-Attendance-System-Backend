import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { Class } from "../models/class.model.js"
import {User} from "../models/user.model.js"
import mongoose from "mongoose"

const createClass = asyncHandler(async (req, res) => {
    try {
        const {subject, name} = req.body
    
        if(!subject || !name) throw new ApiError(401, "All fields are required");
    
        if(req.user.role !== "Teacher") throw new ApiError(401, "You are not authorized to do this.");
    
        const newClass = await Class.create({
            name,
            subject,
            createdBy: req.user._id
        })
    
        if(!newClass) throw new ApiError(401, "Unable to create class");
    
        return res
        .status(201)
        .json(new ApiResponse(
            201,
            newClass,
            "Class created successfully."
        ))
    } catch (error) {
        console.error("Failed to create class: ", error);
    }
})

const getAllClassesForTeacher = asyncHandler(async (req, res) => {
    try {
        const teacherId = new mongoose.Types.ObjectId(req.user._id)
    
        const getAllClasses = await Class.aggregate([
            {
                $match: {
                    createdBy: teacherId
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'students',
                    foreignField: '_id',
                    as: 'studentInfo'
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    subject: 1,
                    createdBy: 1,
                    students: '$studentInfo.name',
                    studentDetails: '$studentInfo.email',
                    createdAt: 1
                }
            }
        ])
    
        return res
        .status(200)
        .json(new ApiResponse(
            201,
            getAllClasses,
            "Successfully get all classes for teachers."
        ))
    } catch (error) {
        console.error("Failed to get classes: ", error);
    }
})

const getClassDetails = asyncHandler(async (req, res) => {
    try {
        const classId = new mongoose.Types.ObjectId(req.params.classId)

        const getClass = await Class.aggregate([
            {
                $match: {
                    _id: classId
                }
            }, 
            {
                $lookup: {
                    from: 'users',
                    localField: 'students',
                    foreignField: '_id',
                    as: 'studentInfo'
                }
            }, 
            {
                $project: {
                    name: 1,
                    subject: 1,
                    createdBy: 1,
                    students: {
                        $map: {
                            input: "$studentInfo",
                            as: "student",
                            in: {
                                _id: "$$student._id",
                                name: "$$student.name",
                                email: "$$student.email"
                            }
                        }
                    },
                    createdAt: 1
                }
            }
        ])

        if(getClass.length === 0) throw new ApiError(401, "Class not found");

        return res
        .status(201)
        .json(new ApiResponse(
            201,
            getClass,
            "All classes are get successfully."
        ))
    } catch (error) {
        console.error("Failed to get class details: ", error);
    }
})

const addStudentToClass = asyncHandler(async (req, res) => {
try {
        const {studentEmail} = req.body
        const {classId} = req.params

        // if(req.user.role !== "Teacher") throw new ApiError(401, "You are not authorize to do this.");
    
        const student = await User.findOne({email: studentEmail})
        if(!student) throw new ApiError(401, "Student not found");
    
        const classes = await Class.findById(classId);
        if(!classes) throw new ApiError(401, "Class not found");
    
        if(!classes.students.includes(student._id)){
            classes.students.push(student._id)
            await classes.save()
        }
    
        return res
        .status(201)
        .json(new ApiResponse(
            201,
            classes,
            "Student added in the class."
        ))
    } catch (error) {
        console.error("Failed to add students: ", error);
    }   
})

const getAllClassesForStudents = asyncHandler(async (req, res) => {
    const studentId = new mongoose.Types.ObjectId(req.user._id)

    const classes = await Class.aggregate([
        {
            $match: {
                students: studentId
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'createdBy',
                foreignField: '_id',
                as: 'teacher'
            }
        },
        {
            $unwind: '$teacher'
        },
        {
            $project: {
                name: 1,
                subject: 1,
                createdBy: {
                    _id: '$teacher._id',
                    name: '$teacher.name',
                    email: '$teacher.email'
                },
                createdAt: 1
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(
        201,
        classes,
        "Enrolled classes fetched"
    ))
})

export {
    createClass,
    getAllClassesForTeacher,
    getClassDetails,
    addStudentToClass,
    getAllClassesForStudents
}