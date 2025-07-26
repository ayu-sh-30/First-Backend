import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/Cloudinary.js"
import { ApiResponse }from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
// const registerUser = asyncHandler(async (req, res) =>
// {
//     res.status(200).json({
//         message: "Pehla API testing is succesfull"
//     })
// })   

// method to generate access and refresh token
const generateAccessTokenAndRefreshToken = async(userId)=>{
    try {
        console.log('Generating tokens for userId:', userId);
        const user = await User.findById(userId)
        const refreshToken = user.generateRefreshToken()
        const accessToken = user.generateAccessToken()
        
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}
    } catch (error) {
        console.error('Error in generateAccessTokenAndRefreshToken:', error);
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}

const registerUser = asyncHandler(async (req, res)=>{
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response
    const {fullname, email, username, password} = req.body
    // check if any of the fld is empty or not after trimming
    if ([fullname, email, username, password].some((field)=>field?.trim()==="")) {
        throw new ApiError(400, "All fields are required")
    }
    const userExists = await User.findOne({       // if one of the fields is true it will return true, else false
        $or: [{username},{email}]
    })
    if(userExists){
        throw new ApiError(409,"User with email or username already exists")
    }
// used .file property(is an object) of multer that contains all file uploaded 
    const avatarLocalPath = req.files?.avatar[0]?.path; //contains local path of the first image of avatar
    const coverImageLocalPath = req.files?.coverImage[0]?.path; //contains local path of the first image of coverImage
    // check for avatar
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath); // await bcz uploading takes time
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar){
        throw new ApiError(409, "Avatar file is required");
    }
    // create user and upload on db
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "", //agar hai toh url dedo varna empty rehne do
        username: username.toLowerCase(),
        email,
        password
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken") //jo field nahi chahiye use '-' ke sath likh dena hai string ke andar
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})  
// making login
const loginUser = asyncHandler(async (req, res)=>
{
    // retrieve data from req. body
    // check username or email
    // find the user
    // password check
    // access and refresh token generate karke user ko do
    // send cookie as a response

    const {email, username, password} = req.body
    if(!(email || username)){
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })
    if(!user){
        throw new ApiError(404, "User does not exist")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials")
    }
    const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    // cookie options
    const options = {
        httpOnly: true,
        secure: true
    } 
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)  //inside "" cannot have trailing/leading spaces or special characters other than -
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User Logged in Successfully"
        )
    )
})
const logoutUser = asyncHandler(async (req, res)=>{
    // whenever user clicks on logout -> we need to first clear his cookies also the refreshToken
    // needs to be deleted to

    // the question is how we will access the userID that has logged in???

    await User.findByIdAndUpdate(
         req.user._id,
        {
            refreshToken: undefined
        },
        {
            new: true       
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .cookie("accessToken", options)
    .cookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged Out")
    )
})

const refreshAccessToken = asyncHandler(async (req, res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, " unauthorixed access")
    }
    try {
        const decodedToken =  jwt.verify(refreshAccessToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken._id)
        if(!user){
            throw new ApiError("Invalid refresh token")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token has expired or used")
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newRefreshToken} = await generateAccessTokenAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken, options)
        .cookie("refreshToken",newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access Token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res)=>{
    //get the required details
    const {oldPassword, newPassword} = req.body
    // if the user wants to change the curr pswd-->means he is already logged in
    const user = await User.findById(req.user?._id)
    // check for old password first
    const isPasswordValid = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordValid){
        throw new ApiError(400, "Invalid old password")
    }
    // assign the new password
    user.password = newPassword
    user.save({validateBeforeSave: false}) //we need to save the new password

    return res
    .status(200)
    .json(new ApiResponse(200,{},
        "Password changed successfully"
    ))
})
const getCurrentUser = asyncHandler(async (req, res)=>{
    return res
    .status(200)
    .json(200, req.user, "Current user fetched successfully")
})
const updateAccountDetails = asyncHandler(async (req, res)=>{
    const {fullname, email} = req.body

    if(!fullname || !email){
        throw new ApiError(400, "All fields are reuired")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname: fullname,
                email: email
            }
        },
        {new : true} //update hone ke baad updated details return karta hai true hai toh
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Account details updates successfully" )
    )
})
const updateUserAvatar = asyncHandler(async (req, res)=>{
    // get the local path of the avatar
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }
    // upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading avatar")
    }
    // update the avatar
    const user  = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:
            {
                avatar : avatar.url
            }
        },
        {new: true}
    ).select("-password")
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar updated successfully")
    )
})
const updateUserCoverImage = asyncHandler(async (req, res)=>{
    // get the local path of the CoverImage
    const CoverImageLocalPath = req.file?.path
    if(!CoverImageLocalPath){
        throw new ApiError(400, "CoverImage file is missing")
    }
    // upload on cloudinary
    const CoverImage = await uploadOnCloudinary(CoverImageLocalPath)
    if(!CoverImage.url){
        throw new ApiError(400, "Error while uploading CoverImage")
    }
    // update the CoverImage
    const user  = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:
            {
                CoverImage : CoverImage.url
            }
        },
        {new: true}
    ).select("-password")
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "CoverImage updated successfully")
    )
})
const getUserChannelProfile = asyncHandler(async (req, res)=>{
    const {username} = req.params //hame url chahiye hota hai na profile pe jane ke liye isliye .params and not .body
    if(!username?.trim()){
        throw new ApiError(400, " username is missing")
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        $if: {$in: [req.user?._id,"$subscribers.subscriber"]},
                        $then: true,
                        $else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(400, "channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async (req, res)=>{
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id) 
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,
            user[0].watchHistory,
            "Watch History fetched successfully"
        )
    )
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}