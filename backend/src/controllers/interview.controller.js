const pdfParse = require("pdf-parse")
const {generateInterviewReport, generateResumePDF, generateProjectIdeas, validateInputs, generateFullReportPDF, convertHTMLToPDF} = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")
async function generateInterviewReportController(req, res) {
    try {
        const resumeFile = req.file
        const resumeData = await (new pdfParse.PDFParse(Uint8Array.from(resumeFile.buffer))).getText();
        const resumeContent = resumeData.text
        const {selfDescription, jobDescription, aiModel} = req.body

        const validation = await validateInputs({
            resume: resumeContent,
            selfDescription,
            jobDescription,
            aiModel
        });

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                isValidationError: true,
                message: "Validation Failed",
                reason: validation.reason
            });
        }

        const interviewReportbyAI = await generateInterviewReport({
            resume: resumeContent,
            selfDescription,
            jobDescription,
            aiModel
        });

        // Generate a title from the job description (first 50 characters)
        const title = jobDescription.length > 50
            ? jobDescription.substring(0, 50) + '...'
            : jobDescription

        const aiResponse = JSON.parse(interviewReportbyAI);
        
        // --- Sanitize AI Data ---
        // Ensure skillGaps have 'skill' property (AI sometimes uses 'name', 'gap', etc.)
        if (Array.isArray(aiResponse.skillGaps)) {
            aiResponse.skillGaps = aiResponse.skillGaps.map(g => ({
                skill: g.skill || g.name || g.gap || g.skillName || g.topic || "Technical Skill",
                severity: g.severity || "Medium"
            }));
        }

        // Ensure other mandatory arrays exist
        if (!Array.isArray(aiResponse.technicalQuestions)) aiResponse.technicalQuestions = [];
        if (!Array.isArray(aiResponse.behavioralQuestions)) aiResponse.behavioralQuestions = [];
        
        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeContent,
            selfDescription,
            jobDescription,
            title,
            aiModel: aiModel || 'meta-llama/llama-4-scout-17b-16e-instruct',
            ...aiResponse
        })
        return res.status(201).json({
            success: true,
            data: interviewReport,
            message: "Interview report generated successfully"
        })
    } catch (error) {
        console.error("Error generating interview report:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate interview report. Please try again."
        });
    }
}

async function getInterviewReportByIdController(req, res) {
    const { interviewId } = req.params;
    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id });

    if (!interviewReport) {
        return res.status(404).json({
            success: false,
            message: "Interview report not found"
        });
    }
    return res.status(200).json({
        success: true,
        data: interviewReport
    });

}

async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan");
    return res.status(200).json({
        success: true,
        data: interviewReports
    });
}

// controller for generating resume PDF using AI
async function generateResumePDFController(req, res) {
    try {
        const { interviewId } = req.params;
        const { aiModel } = req.body;
        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id });

        if (!interviewReport) {
            return res.status(404).json({
                success: false,
                message: "Interview report not found"
            });
        }

        // RESTRICTION: Check if this model has already been used to generate a resume for this report.
        const existingResume = interviewReport.enhancedResumes?.find(r => r.aiModel === aiModel);
        if (existingResume) {
            return res.status(400).json({
                success: false,
                message: `You have already generated a professional resume using ${aiModel}. Please access it from your history or choose a different AI agent.`
            });
        }

        const result = await generateResumePDF({
            resume: interviewReport.resume,
            selfDescription: interviewReport.selfDescription,
            jobDescription: interviewReport.jobDescription,
            aiModel
        });

        if (!result || !result.html) {
            console.error("AI failed to generate HTML content for resume.");
            return res.status(500).json({
                success: false,
                message: "AI agent failed to synthesize your resume. Please try a different model or try again later."
            });
        }

        const { pdf, html } = result;

        // Persistent Storage: Save the generated HTML content to the history array.
        interviewReport.enhancedResumes.push({
            aiModel,
            htmlContent: html
        });
        await interviewReport.save();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
        return res.status(200).send(pdf);
    } catch (error) {
        console.error("Error in generateResumePDFController:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to generate resume PDF. Please try again."
        });
    }
}

// Controller to download a previously generated resume from the history
async function downloadExistingResumePDFController(req, res) {
    const { interviewId } = req.params;
    const { modelName } = req.query;
    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id });

    if (!interviewReport) {
        return res.status(404).json({
            success: false,
            message: "Interview report not found"
        });
    }

    const existingResume = interviewReport.enhancedResumes?.find(r => r.aiModel === modelName);
    if (!existingResume) {
        return res.status(404).json({
            success: false,
            message: "Historical resume version not found for this AI agent."
        });
    }

    // Re-generate the PDF from the stored HTML content (free, no AI call needed)
    const pdf = await convertHTMLToPDF(existingResume.htmlContent);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="enhanced_resume_${modelName.replace(/\//g, '_')}.pdf"`);
    return res.status(200).send(pdf);
}

async function deleteInterviewReportController(req, res){
    const {interviewId} = req.params;
    const deleteReport = await interviewReportModel.findOneAndDelete({ _id: interviewId, user: req.user.id });
    if(!deleteReport){
        return res.status(404).json({
            success: false,
            message: "Interview report not found"
        });
    }
    return res.status(200).json({
        success: true,
        message: "Interview report deleted successfully"
    });
}

async function generateProjectIdeasController(req, res) {
    const {interviewId} = req.params;
    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id });

    if (!interviewReport) {
        return res.status(404).json({
            success: false,
            message: "Interview report not found"
        });
    }

    // Check if we already generated these ideas to save API budget!
    if (interviewReport.projectIdeas && interviewReport.projectIdeas.length > 0) {
        return res.status(200).json({
            success: true,
            data: { projects: interviewReport.projectIdeas }
        });
    }

    const skillGaps = interviewReport.skillGaps.filter(g => g.severity === 'High' || g.severity === 'Medium');
    
    let parsedProjectIdeas;
    try {
        const projectIdeasRaw = await generateProjectIdeas({
            skillGaps,
            jobDescription: interviewReport.jobDescription,
            aiModel: interviewReport.aiModel
        });
        parsedProjectIdeas = JSON.parse(projectIdeasRaw);
    } catch (err) {
        console.error("AI Generation failed:", err);
        return res.status(500).json({ success: false, message: "AI generation failed" });
    }

    // Save to database
    interviewReport.projectIdeas = parsedProjectIdeas.projects;
    await interviewReport.save();

    return res.status(200).json({
        success: true,
        data: parsedProjectIdeas
    });
}
async function downloadFullReportPDFController(req, res) {
    try {
        const { interviewId } = req.params;
        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id });

        if (!interviewReport) {
            return res.status(404).json({
                success: false,
                message: "Interview report not found"
            });
        }

        const pdf = await generateFullReportPDF(interviewReport);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="interview_report_${interviewId}.pdf"`);
        return res.status(200).send(pdf);
    } catch (error) {
        console.error("Error generating full report PDF:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate full report PDF"
        });
    }
}

module.exports = {
    generateInterviewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePDFController,
    downloadExistingResumePDFController,
    generateProjectIdeasController,
    downloadFullReportPDFController,
    deleteInterviewReportController
};