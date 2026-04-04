import {getAllInterviewReports, getInterviewReportById, generateInterviewReport, generateResumePDF, getProjectIdeas as getProjectIdeasAPI} from "../services/interview.api"
import {useContext, useEffect, useState} from "react"
import {InterviewContext} from "../interview.context.jsx"
import {useParams} from "react-router"

export const useInterview = () => {
    const {interviewId} = useParams()
    const context = useContext(InterviewContext);
    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider");
    }
    const {loading, setLoading, pdfLoading, setPdfLoading, error, setError, report, setReport, reports, setReports} = context;
    const generateReport = async ({resume, selfDescription, jobDescription, aiModel}) => {
        setLoading(true)
        setError('')
        setReport(null)
        let data = null
        try {
            data = await generateInterviewReport({resume, selfDescription, jobDescription, aiModel})
            setReport(data.data)
        } catch (error) {
            setError('Failed to generate interview report. Please try again.')
            console.error("Error generating interview report:", error)
        } finally {
            setLoading(false)
        }
            return data.data
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
        let data = null
        try {
                data = await generateResumePDF({interviewId, aiModel})
                const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
                const link = document.createElement('a')
                link.href = url
                link.setAttribute('download', `resume_${interviewId}.pdf`)
                document.body.appendChild(link)
                link.click()
                link.remove()
        } catch (error) {
            setError('Failed to generate resume PDF. Please try again.')
            console.error("Error generating resume PDF:", error)
        } finally {
            setPdfLoading(false)
        }
        return data
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

    useEffect(() => {
        if (interviewId) {
            getReportByID(interviewId)
        } else {
            getAllReports()
        }
    }, [interviewId])

    return {loading, pdfLoading, error, setError, report, reports, generateReport, getReportByID, getAllReports, getResumePDF, getProjectIdeasForReport}
}

