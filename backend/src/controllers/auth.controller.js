const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")
const crypto = require("crypto") 

const isProduction = process.env.NODE_ENV === "production";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// ─── REGISTER ─────────────────────────────────────────────────────────────────
async function registerUserController(req, res) {
    const {username, email, password, securityQuestion, securityAnswer} = req.body;
    if(!username || !email || !password || !securityQuestion || !securityAnswer) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        })
    }

    if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email format. Please provide a valid email address (e.g., user@example.com)"
        })
    }

    const isUserAlreadyExist = await userModel.findOne({
        $or: [
            {username},
            {email}
        ]
    })
    
    if(isUserAlreadyExist) {
        return res.status(400).json({
            success: false,
            message: "User already exists"
        })
    }
    
    const hash = await bcrypt.hash(password, 10);
    const hashedSecurityAnswer = await bcrypt.hash(securityAnswer.toLowerCase().trim(), 10);

    const user = await userModel.create({
        username,
        email,
        password: hash,
        securityQuestion,
        securityAnswer: hashedSecurityAnswer
    })
    
    const token = jwt.sign({id: user._id, username: user.username}, process.env.JWT_SECRET, {expiresIn: "1d"})
    
    res.cookie("token", token, {
        httpOnly: true,
        secure: isProduction,               
        sameSite: isProduction ? 'none' : 'lax', 
        maxAge: 24 * 60 * 60 * 1000         // 1 day
    });
    
    return res.status(201).json({
        success: true,
        message: "User registered successfully",
        user:{
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
async function loginUserController(req, res) {
    const {email, password} = req.body;
    if(!email || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        })
    }
    
    const user = await userModel.findOne({email})
    if(!user) {
        return res.status(400).json({
            success: false,
            message: "Invalid credentials"
        })
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if(!isPasswordMatch) {
        return res.status(400).json({
            success: false,
            message: "Invalid credentials"
        })
    }
    
    const token = jwt.sign({id: user._id, username: user.username}, process.env.JWT_SECRET, {expiresIn: "1d"})
    
    res.cookie("token", token, {
        httpOnly: true,
        secure: isProduction,               
        sameSite: isProduction ? 'none' : 'lax', 
        maxAge: 24 * 60 * 60 * 1000         // 1 day
    });
    
    return res.status(200).json({
        success: true,
        message: "User logged in successfully",
        user:{
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}

async function logoutUserController(req, res) {
    const token = req.cookies.token;
    if(token){
        await tokenBlacklistModel.create({token})
    }
    res.clearCookie("token");
    res.status(200).json({
        success: true,
        message: "User logged out successfully"
    })
}

async function getMeController(req, res) {
    const user = await userModel.findById(req.user.id);
    if(!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        })
    }
    return res.status(200).json({
        success: true,
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}

// ─── FORGOT PASSWORD FLOW (SECURITY QUESTIONS) ─────────────────────────────────────────────────────

async function getSecurityQuestionController(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email is required"
        })
    }

    const user = await userModel.findOne({ email });
    if (!user) {
        return res.status(400).json({
            success: false,
            message: "No account found with this email address"
        })
    }

    if (!user.securityQuestion) {
        return res.status(400).json({
            success: false,
            message: "This account does not have a security question set. Please contact support."
        })
    }

    return res.status(200).json({
        success: true,
        message: "Security question retrieved",
        securityQuestion: user.securityQuestion
    })
}

async function verifySecurityAnswerController(req, res) {
    const { email, securityAnswer } = req.body;

    if (!email || !securityAnswer) {
        return res.status(400).json({
            success: false,
            message: "Email and security answer are required"
        })
    }

    const user = await userModel.findOne({ email });
    if (!user) {
        return res.status(400).json({
            success: false,
            message: "User not found"
        })
    }

    const isAnswerValid = await bcrypt.compare(securityAnswer.toLowerCase().trim(), user.securityAnswer);

    if (!isAnswerValid) {
        return res.status(400).json({
            success: false,
            message: "Incorrect answer. Please try again."
        })
    }

    // ISSUE A RESET TOKEN: Short-lived JWT (5 minutes) that authorizes password reset
    const resetToken = jwt.sign(
        { email, purpose: "password-reset" },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
    );

    return res.status(200).json({
        success: true,
        message: "Answer verified successfully",
        resetToken
    })
}

async function resetPasswordController(req, res) {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
        return res.status(400).json({
            success: false,
            message: "Reset token and new password are required"
        })
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters long"
        })
    }

    let decoded;
    try {
        decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Reset token has expired or is invalid. Please start over."
        })
    }

    if (decoded.purpose !== "password-reset") {
        return res.status(400).json({
            success: false,
            message: "Invalid token type"
        })
    }

    const user = await userModel.findOne({ email: decoded.email });
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
        success: true,
        message: "Password reset successfully. You can now log in with your new password."
    })
}

async function deleteAccountController(req, res){
    try {
        const { password } = req.body;
        if(!password){
            return res.status(400).json({
                success: false,
                message: "Password is required for termination verification."
            })
        }
        const user = await userModel.findById(req.user.id);
        if(!user){
            return res.status(404).json({
                success: false,
                message: "Operative record not found"
            })
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(401).json({
                success: false,
                message: "Invalid credentials. Protocol termination denied."
            })
        }

        await userModel.findByIdAndDelete(user._id);

        res.clearCookie('token'); 

        return res.status(200).json({
            success: true,
            message: "Account and associated tactical records purged successfully."
        })
    } catch (error) {
        console.error('Error during account deletion:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to purge operative records. System anomaly detected."
        })
    }
}

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController,
    getSecurityQuestionController,
    verifySecurityAnswerController,
    resetPasswordController,
    deleteAccountController
}