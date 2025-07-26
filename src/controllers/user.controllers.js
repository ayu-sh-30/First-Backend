import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/Cloudinary.js"
import { ApiResponse }from "../utils/ApiResponse.js"
// const registerUser = asyncHandler(async (req, res) =>
// {
//     res.status(200).json({
//         message: "Pehla API testing is succesfull"
//     })
// })   

// method to generate access and refresh token
const generateAccessTokenAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const refreshToken = user.generateRefreshToken()
        const accessToken = user.generateAccessToken()
        
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}
    } catch (error) {
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
    if(!email || !username){
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })
    if(!user){
        throw new ApiError(404, "User does not exist")
    }
    const idPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid user credentials")
    }
    const {accessToken, refreshToken}= await generateAccessTokenAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    // cookie options
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .cookie("Access Token: ", accessToken, options)
    .cookie("Refresh Token: ", refreshToken, options)
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
export {
    registerUser,
    loginUser,
    logoutUser
}