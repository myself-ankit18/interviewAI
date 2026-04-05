import {getAllInterviewReports, getInterviewReportById, generateInterviewReport, generateResumePDF, getProjectIdeas as getProjectIdeasAPI, downloadFullReportPDF, downloadExistingResumePDF, deleteInterviewReport} from "../services/interview.api"
import {useContext, useEffect, useRef, useState} from "react"
import {InterviewContext} from "../interview.context.jsx"
import {useParams} from "react-router"

export const useInterview = () => {
    const {interviewId} = useParams()
    const context = useContext(InterviewContext);
    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider");
    }
    const {loading, setLoading, pdfLoading, setPdfLoading, error, setError, report, setReport, reports, setReports} = context;
    const abortControllerRef = useRef(null);
    const generateReport = async ({resume, selfDescription, jobDescription, aiModel}) => {
        setLoading(true)
        setError('')
        setReport(null)
        let data = null
        try {
            data = await generateInterviewReport({resume, selfDescription, jobDescription, aiModel})
            setReport(data.data)
            return data.data
        } catch (error) {
            if (error.response?.data?.isValidationError) {
                return { isValidationError: true, reason: error.response.data.reason };
            }
            setError('Failed to generate interview report. Please try again.')
            console.error("Error generating interview report:", error)
            return null
        } finally {
            setLoading(false)
        }
  }
    const getReportByID = async (interviewId) =>{
        setLoading(true)
        setError('')
        setReport(null)
        let data = null
        try {           
             data = await getInterviewReportById(interviewId)
            setReport(data.data)
        } catch (error) {
            setError('Failed to fetch interview report. Please try again.')
            console.error("Error fetching interview report:", error)
        } finally {
            setLoading(false)
        }
        return data.data
    }
    const getAllReports = async () =>{
        setLoading(true)
        setError('')
        setReports([])
        let data = null
        try {
             data = await getAllInterviewReports()
            setReports(data.data)
        } catch (error) {
            setError('Failed to fetch interview reports. Please try again.')
            console.error("Error fetching interview reports:", error)
        } finally {
            setLoading(false)
        }
        return data.data
    }
    const getResumePDF = async (interviewId, aiModel) => {
        setError('')
        setPdfLoading(true)
        
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();

        let data = null
        try {
                data = await generateResumePDF({interviewId, aiModel}, abortControllerRef.current.signal)
                const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
                const link = document.createElement('a')
                link.href = url
                link.setAttribute('download', `resume_${interviewId}.pdf`)
                document.body.appendChild(link)
                link.click()
                link.remove()
                
                // Refresh the local report state to include the new generation in the history
                await getReportByID(interviewId)
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('PDF generation cancelled by user');
                return null;
            }
            // Catch model restriction error from backend
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError('Failed to generate resume PDF. Please try again.')
            }
            console.error("Error generating resume PDF:", error)
        } finally {
            setPdfLoading(false)
            abortControllerRef.current = null;
        }
        return data
    }

    const getExistingResumePDF = async (interviewId, modelName) => {
        setError('')
        setPdfLoading(true)
        
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();

        try {
            const data = await downloadExistingResumePDF({interviewId, modelName}, abortControllerRef.current.signal)
            const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `enhanced_resume_${modelName}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Download cancelled by user');
                return;
            }
            setError('Failed to download existing resume version.')
            console.error("Error downloading existing resume:", error)
        } finally {
            setPdfLoading(false)
            abortControllerRef.current = null;
        }
    }

    const getProjectIdeasForReport = async (interviewId) => {
        let data = null
        try {
            data = await getProjectIdeasAPI({interviewId})
            return data.data
        } catch (error) {
            console.error("Error fetching project ideas:", error)
            return null
        }
    }

    const getFullReportPDF = async (interviewId) => {
        setError('')
        setPdfLoading(true)

        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();

        try {
            const data = await downloadFullReportPDF(interviewId, abortControllerRef.current.signal)
            const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `interview_report_${interviewId}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Download cancelled by user');
                return;
            }
            setError('Failed to download full report PDF. Please try again.')
            console.error("Error downloading full report PDF:", error)
        } finally {
            setPdfLoading(false)
            abortControllerRef.current = null;
        }
    }

    const cancelPdfGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setPdfLoading(false);
            abortControllerRef.current = null;
        }
    }

    const deleteReport = async (reportId) =>{
        try {
            setLoading(true);
            await deleteInterviewReport(reportId);
            return true;
        } catch (error) {
            console.error("Error deleting interview report:", error);
            return false;
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportByID(interviewId)
        } else {
            getAllReports()
        }
    }, [interviewId])

    return {deleteReport, loading, pdfLoading, error, setError, report, setReport, reports, setReports, generateReport, getReportByID, getAllReports, getResumePDF, getExistingResumePDF, getProjectIdeasForReport, getFullReportPDF, cancelPdfGeneration}
}

