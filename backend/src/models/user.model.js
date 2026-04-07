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
    securityQuestion: {
        type: String,
        required: [true, "Security question is required"],
    },
    securityAnswer: {
        type: String,
        required: [true, "Security answer is required"],
    }
})

const User = mongoose.model("users", userSchema);

module.exports = User;