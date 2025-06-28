import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.model.js"
import jwt from 'jsonwebtoken'

const generateAccessTokenandRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(401, "Something went wrong")
    }
}

const registerUser = asyncHandler(async (req, res) => {
try {
        const { name, email, password, role} = req.body
    
        if (!name || !email || !password || !role) {
            throw new ApiError(400, "All fields are required");
        }
    
        const validRoles = ["Student", "Teacher"]
        if(!validRoles.includes(role)){
            return res
            .status(401)
            .json(new ApiResponse(
                401,
                {},
                "Invalid user role selected"
            ))
        }
    
        const existedUser = await User.findOne({email})
        if(existedUser) throw new ApiError(401, "User already registered");
    
        const user = await User.create({
            name,
            email,
            password,
            role
        })
    
        const {accessToken, refreshToken} = await generateAccessTokenandRefreshToken(user._id)
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            201, 
            {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                accessToken,
                refreshToken
            },
            "User registered successfully"
        ))
} catch (error) {
    console.error("Failed to register user: ", error);
}
})

const loginUser = asyncHandler(async (req, res) => {
    try {
        const {email, password} = req.body
    
        if(!email || !password) throw new ApiError(401, "All fields are required");
    
        const user = await User.findOne({email})
        if(!user) throw new ApiError(401, "User not exist");
    
        const checkPassword = await user.isPasswordCorrect(password)
        if(!checkPassword) throw new ApiError(401, "Password is incorrect");
    
        const {accessToken, refreshToken} = await generateAccessTokenandRefreshToken(user._id)
    
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            201,
            {loggedInUser, accessToken, refreshToken},
            "User logged in successfully"
        ))
    } catch (error) {
        console.error("Failed to log in user: ", error);
    }
})

const logoutUser = asyncHandler(async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    refreshToken: ""
                }
            },
            {new: true}
        )

        if(!user) throw new ApiError(401, "User not logged in");

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
        .status(201)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(
            201,
            {},
            "User logged out successfully."
        ))
    } catch (error) {
        console.error("Failed to logout user: ", error);
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    try {
        const {oldPassword, newPassword} = req.body
    
        if(!oldPassword || !newPassword) throw new ApiError(401, "All fields are required");
    
        const user = await User.findById(req.user._id)
        if(!user) throw new ApiError(401, "User not exist");
    
        const passCorrect = await user.isPasswordCorrect(oldPassword)
        if(!passCorrect) throw new ApiError(401, "Old password is not correct");
    
        user.password = newPassword
        await user.save()
    
        return res
        .status(201)
        .json(new ApiResponse(
            201,
            {},
            "Password changed successfully."
        ))
    } catch (error) {
        console.error("Failed to change password: ", error);
    }
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

        if(!incomingRefreshToken) throw new ApiError(401, "Unauthorized access");

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)
        if(!user) throw new ApiError(401, "Token may be expired or used");

        if(incomingRefreshToken !== user?.refreshToken) throw new ApiError(401, "Invalid token");

        const {accessToken, refreshToken} = await generateAccessTokenandRefreshToken(user._id)

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            201,
            {accessToken, refreshToken},
            "Access Token refreshed."
        ))
    } catch (error) {
        console.error("Failed to refresh access token: ", error);
    }
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    try {
        const {name} = req.body
    
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    name: name
                }
            }, 
            {new: true}
        )
    
        if(!user) throw new ApiError(401, "User not found");
    
        return res
        .status(201)
        .json(new ApiResponse(
            201,
            user,
            "User details updated successfully."
        ))
    } catch (error) {
        console.error("Failed to update account details: ", error);
    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    changeCurrentPassword,
    refreshAccessToken,
    updateAccountDetails
}