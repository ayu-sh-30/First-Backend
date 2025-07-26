import { ApiError } from "../utils/ApiError.js"
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
export const verifyJWT = asyncHandler(async (req, res, next) =>
{
    try {
        // get the loggedIN user's token
        console.log("Cookies:", req.cookies);
        console.log("Authorization header:", req.header("Authorization"));
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        
        console.log("Token is",token);
        if(!token){
            throw new ApiError(401, "Unauthorized request")
        }
        
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user){
            // discuss abt frontend
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})