const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({    
    username: {
        type: String,
        unique: [true, "Username must be unique"],
        required: [true, "Username is required"],
    },
    email :{
        type: String,
        unique: [true, "Email must be unique"],
        required: [true, "Email is required"],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    // ISVERIFIED FLAG: Ensures only users who proved ownership of their email
    // (by entering the correct OTP sent to their inbox) can access the app.
    // Default is false — set to true only after successful OTP verification.
    // Users with isVerified=false are blocked from logging in.
    isVerified: {
        type: Boolean,
        default: false
    }
})

const User = mongoose.model("users", userSchema);

module.exports = User;