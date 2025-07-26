import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true,  //used for searching
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullname: {
        type: String,
        required: true,
        index: true,  //used for searching
        trim: true
    },
    avatar: {
        type: String, //cloudinary url
        required: true
    },
    coverImage: {
        type: String, //cloudinary url
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password:{
        type: String,
        required: [true, "Password is required"]
    },
    refreshToken: {
        type: String,
    }

},{ timestamps: true });

// we have used pre hook of mongoose middleware
userSchema.pre("save", async function(next){//we cannot use arrow fn here bcz 
                                            //this keyword is not accessible in it
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next()
})
// using our own method to check password is correct or not
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)  //this will return true/false
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
        _id : this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(   //returning a refresh token that contains user id
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model("User",userSchema);