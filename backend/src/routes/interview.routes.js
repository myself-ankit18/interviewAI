const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const interview = require("../controllers/interview.controller")
const upload = require("../middlewares/file.middleware")
const interviewRouter = express.Router()

interviewRouter.post("/", authMiddleware.authUser, upload.single("resume"), interview.generateInterviewReportController)
interviewRouter.get("/", authMiddleware.authUser, interview.getAllInterviewReportsController)
interviewRouter.get("/:interviewId", authMiddleware.authUser, interview.getInterviewReportByIdController)

interviewRouter.post("/resume/pdf/:interviewId", authMiddleware.authUser, interview.generateResumePDFController)
interviewRouter.post("/project-ideas/:interviewId", authMiddleware.authUser, interview.generateProjectIdeasController)
module.exports = interviewRouter