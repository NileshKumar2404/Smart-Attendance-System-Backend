import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Session } from "../models/session.model.js"
import QrCode from 'qrcode'
import {Class} from "../models/class.model.js"
import mongoose from "mongoose"

const createSession = asyncHandler(async (req, res) => {
    //get classId from frontend - params
    //Check that class exists in the Class db or not
    //generate qrCode for that session
    //create session
    //return res
    
try {
        const {classId} = req.body 

        const classes = await Class.findById(classId)
        if(!classes) throw new ApiError(401, "Class not found");
    
        const sessionDate = new Date()
        const expiresAt = new Date(sessionDate.getTime() + 15 * 60 * 1000)
    
        const qrData = {
            classId: classId.toString(),
            generateAt: sessionDate.toISOString(),
            expiresAt: expiresAt.toISOString 
        }
    
        const qrCodeImg = await QrCode.toDataURL(JSON.stringify(qrData))
        console.log("Qrcode: ", qrCodeImg);
        
    
        const session = await Session.create({
            classId,
            date: sessionDate,
            qrCode: qrCodeImg, 
            expiresAt: expiresAt,
        })
    
        return res
        .status(201)
        .json(new ApiResponse(
            201,
            session,
            "Session created successfully."
        ))
    } catch (error) {
        console.error("Failed to create session: ", error);
    }
})

const getSessionForClass = asyncHandler(async (req, res) => {
    const {classId} = req.params

    const sessions = await Session.find({classId}).sort({date: -1})
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        sessions, 
        "Get all sessions successfully."
    ))
})

const getSessionById = asyncHandler(async (req, res) => {
    const {sessionId} = req.params

    const session = await Session.findById(sessionId)
    if(!session) throw new ApiError(401, "Session not exist");

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        session,
        "Get session by id successfully."
    ))
})

export {
    createSession,
    getSessionForClass,
    getSessionById
}