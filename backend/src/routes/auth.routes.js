const express = require('express');
const authRouter = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware")

authRouter.post("/register", authController.registerUserController);

authRouter.post("/login", authController.loginUserController);

authRouter.get("/logout",authController.logoutUserController);

authRouter.get("/get-me", authMiddleware.authUser, authController.getMeController);

authRouter.post("/get-security-question", authController.getSecurityQuestionController);
authRouter.post("/verify-security-answer", authController.verifySecurityAnswerController);
authRouter.post("/reset-password", authController.resetPasswordController);
authRouter.delete("/delete-account", authMiddleware.authUser, authController.deleteAccountController);
module.exports = authRouter;