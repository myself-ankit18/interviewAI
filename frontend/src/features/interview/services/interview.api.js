import axios from "axios";
const api = axios.create({
    baseURL: 'http://localhost:3000',
    withCredentials: true
});

export const generateInterviewReport = async ({resume, selfDescription, jobDescription, aiModel}) => {
    try {
        const formData = new FormData();
        formData.append("resume", resume);
        formData.append("selfDescription", selfDescription);
        formData.append("jobDescription", jobDescription);
        if (aiModel) formData.append("aiModel", aiModel);
        const response = await api.post("/api/interview", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error generating interview report:", error);
        throw error;
    }
};

export const getInterviewReportById = async (interviewId) => {
    try {
        const response = await api.get(`/api/interview/${interviewId}`);    
        return response.data;
    } catch (error) {
        console.error("Error fetching interview report:", error);
        throw error;
    }   
};

export const getAllInterviewReports = async () => {
    try {
        const response = await api.get("/api/interview");    
        return response.data;
    } catch (error) {
        console.error("Error fetching interview reports:", error);
        throw error;
    }   
};

export const generateResumePDF = async ({interviewId, aiModel}) => {
    const response = await api.post(`/api/interview/resume/pdf/${interviewId}`, { aiModel }, {
        responseType: 'blob'
    });
    return response.data;
};

export const getProjectIdeas = async ({interviewId}) => {
    try {
        const response = await api.post(`/api/interview/project-ideas/${interviewId}`);
        return response.data;
    } catch (error) {
        console.error("Error generating project ideas:", error);
        throw error;
    }
};