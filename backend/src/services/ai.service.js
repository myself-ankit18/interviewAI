// GEMINI SYSTEM (COMMENTED OUT)
// const { GoogleGenAI } = require("@google/genai");
// const {z} = require("zod")
// const {zodToJsonSchema} = require("zod-to-json-schema")
// const ai = new GoogleGenAI({
//     apiKey: process.env.GOOGLE_GENAI_API_KEY,
// });

// const interviewReportSchema = z.object({
//     matchScore: z.number().describe("A score between 0 and 100 that indicates how well the candidate matches the job requirements based on the analysis of the resume, self-description, and job description."),
//     technicalQuestions: z.array(z.object({
//         question: z.string().describe("The technical question can be asked during the interview."),
//         intention: z.string().describe("The intention by the interviewer behind asking the technical question."),
//         answer: z.string().describe("How to answer the technical question, including key points that should be covered in the answer.")
//     })).describe("A list of technical questions that can be asked during the interview, along with the intention behind each question and how to answer it."),
//     behavioralQuestions: z.array(z.object({
//         question: z.string().describe("The behavioral question can be asked during the interview."),
//         intention: z.string().describe("The intention by the interviewer behind asking the behavioral question."),
//         answer: z.string().describe("How to answer the behavioral question, including key points that should be covered in the answer.")
//     })).describe("A list of behavioral questions that can be asked during the interview, along with the intention behind each question and how to answer it."),
//     skillGaps: z.array(z.object({
//         skill: z.string().describe("The skill that the candidate is lacking based on the analysis of the resume, self-description, and job description."),
//         severity: z.enum(['Low', 'Medium', 'High']).describe("The severity of the skill gap, indicating how critical it is for the candidate to improve in this area.")
//     })).describe("A list of skill gaps that the candidate has, along with the severity of each gap."),
//     preparationPlan: z.array(z.object({
//         day: z.number().describe("The day number in the preparation plan, starting from 1."),
//         focus: z.string().describe("The main focus for the day, such as a specific topic, skill, or type of question to practice."),
//         tasks: z.array(z.string()).describe("A list of specific tasks or activities that the candidate should complete on this day to prepare for the interview.")
//     })).describe("A detailed preparation plan for the candidate, outlining what they should focus on and do each day leading up to the interview.")
// })

//  async function generateInterviewReport({resume, selfDescription, jobDescription}){
//     const prompt = `Generate an interview report based on the following information:\n\nResume: ${resume}\n\nSelf-description: ${selfDescription}\n\nJob description: ${jobDescription}\n\nThe interview report should include the following sections:\n1. Match Score: A score between 0 and 100 that indicates how well the candidate matches the job requirements based on the analysis of the resume, self-description, and job description.\n2. Technical Questions: A list of technical questions that can be asked during the interview, along with the intention behind each question and how to answer it.\n3. Behavioral Questions: A list of behavioral questions that can be asked during the interview, along with the intention behind each question and how to answer it.\n4. Skill Gaps: A list of skill gaps that the candidate has, along with the severity of each gap.\n5. Preparation Plan: A detailed preparation plan for the candidate, outlining what they should focus on and do each day leading up to the interview.`
//     const response = await ai.models.generateContent({
//         model: "gemini-2.0-flash",
//         contents:prompt,
//         config: {
//             responseMimeType: "application/json",
//             responseSchema: zodToJsonSchema(interviewReportSchema, "InterviewReport")
//         }
//     })
//     console.log("AI response:", JSON.parse(response.text))
//     return response.text;
// }

// GROQ SYSTEM (ACTIVE)
const Groq = require("groq-sdk");
const {z} = require("zod")
const {zodToJsonSchema} = require("zod-to-json-schema")
const puppeteer = require("puppeteer");

const ai = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 that indicates how well the candidate matches the job requirements based on the analysis of the resume, self-description, and job description."),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked during the interview."),
        intention: z.string().describe("The intention by the interviewer behind asking the technical question."),
        answer: z.string().describe("How to answer the technical question, including key points that should be covered in the answer.")
    })).describe("A list of technical questions(at least 10) that can be asked during the interview, along with the intention behind each question and how to answer it."),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The behavioral question can be asked during the interview."),
        intention: z.string().describe("The intention by the interviewer behind asking the behavioral question."),
        answer: z.string().describe("How to answer the behavioral question, including key points that should be covered in the answer.")
    })).describe("A list of behavioral questions (at least 10) that can be asked during the interview, along with the intention behind each question and how to answer it."),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill that the candidate is lacking based on the analysis of the resume, self-description, and job description."),
        severity: z.enum(['Low', 'Medium', 'High']).describe("The severity of the skill gap, indicating how critical it is for the candidate to improve in this area.")
    })).describe("A list of skill gaps that the candidate has, along with the severity of each gap."),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1."),
        focus: z.string().describe("The main focus for the day, such as a specific topic, skill, or type of question to practice."),
        tasks: z.array(z.string()).describe("A list of specific tasks or activities that the candidate should complete on this day to prepare for the interview.")
    })).describe("A detailed preparation plan for the candidate, outlining what they should focus on and do each day leading up to the interview."),
    title: z.string().describe("The title of the job position that the candidate is applying for, which can be used to tailor the interview report and preparation plan to the specific role."),
    resumeAnalysis: z.object({
        matchedKeywords: z.array(z.string()).describe("EXACT keywords or short technical phrases found in the resume that match the job description."),
        missingKeywords: z.array(z.string()).describe("Critical keywords or required technologies from the job description that are NOT found in the resume.")
    }).describe("ATS-style keyword analysis for showing a heatmap of match vs gaps.")
})

async function generateInterviewReport({resume, selfDescription, jobDescription, aiModel}){
    const jsonSchema = zodToJsonSchema(interviewReportSchema);

    const prompt = `You are a high-level, industry-agnostic recruiting and interview expert. You have successfully placed thousands of candidates in roles across EVERY major sector (Engineering, Medicine, Finance, Creative, Legal, Administration, etc.). Analyze this candidate thoroughly and produce a comprehensive, industry-specific interview preparation report.

=== CANDIDATE PROFILE ===
Resume:
${resume}

Self-Description:
${selfDescription || '[EMPTY]'}

Target Job Description:
${jobDescription}

=== REPORT SECTIONS ===

**1. matchScore (integer 0-100)**
Perform a RIGOROUS, HONEST gap analysis. DO NOT default to 85 or any round number.

Scoring methodology — evaluate each dimension separately, then compute weighted average:
- Required Technical Skills (40% weight): List every required skill from JD. For each, check if candidate has it. Score = (matched / total) × 100
- Experience Level (25% weight): Compare candidate's years + seniority vs JD requirements
- Domain Expertise (20% weight): Industry-specific knowledge match
- Nice-to-Have Skills (15% weight): Bonus qualifications match

IMPORTANT CALIBRATION:
- A candidate matching 70% of JD required technical skills with the right experience level should score 65-75
- Someone matching 70% of required skills with right experience level should score 65-75
- Only candidates who match nearly ALL requirements should score 80+
- 90+ is EXTREMELY rare — reserved for candidates who exceed all requirements
- NEVER output exactly 85, 80, 75, or 70 — use precise numbers like 67, 73, 82, 58, 41

**2. technicalQuestions (array of 12+ objects)**
Generate questions a REAL interviewer at this company would ask for THIS specific role:

Question mix requirements:
- 3-4 foundational questions testing core concepts from the JD tech stack
- 3-4 intermediate applied questions (debugging, optimization, real-world scenarios)
- 2-3 system design / architecture questions relevant to the role
- 2-3 advanced questions (trade-offs, scalability, edge cases)

Each object EXACTLY must have these properties:
- question: Exact phrasing an interviewer would use (natural, conversational — NOT textbook-style)
- intention: What the interviewer is REALLY evaluating (be specific, e.g., "Tests ability to reason about database indexing strategies under write-heavy workloads")
- answer: COMPREHENSIVE model answer (200-400 words) including trade-offs, code snippets, and common pitfalls.

DO NOT generate generic textbook questions. Examples of BAD vs GOOD:
- BAD: "What are your strengths?" → GOOD: "Looking at the [Specific JD Requirement], walk me through a time you overcame a [Domain-Specific Challenge] using [Specific Tool/Methodology mentioned in JD]."
- BAD: "Explain [Generic Concept]" → GOOD: "You're tasked with optimizing [Specific System/Process from JD] which is currently underperforming by [Metric]. Walk me through your diagnostic process, what tools or standards you'd apply, and how you'd validate the solution."

**3. behavioralQuestions (array of 12+ objects)**
Generate questions covering a wide range of competencies (Leadership, Failure, Conflict, Ownership, etc.).

Each object MUST have these EXACT properties:
- question: Natural conversational phrasing (not robotic)
- intention: The specific leadership principle or competency being evaluated
- answer: FULL STAR-method response (200-350 words) tailored to the candidate's resume (Situation, Task, Action, Result, Reflection).

Make stories BELIEVABLE based on the candidate's actual resume content.

**4. skillGaps (array of objects)**
Identify every gap between the candidate's profile and the JD requirements.
Each object MUST have these EXACT properties:
- skill (string): Be SPECIFIC, e.g., "AutoCAD specialized layer management" not just "Design"
- severity (string): Must be 'Low', 'Medium', or 'High' based on requirement importance.

CRITICAL: ONLY list skills or tools that are explicitly mentioned or strongly implied by the specific Job Description provided. DO NOT include generic technical skills like "Kubernetes" or "React" unless they appear in the JD.

**5. preparationPlan (array of 7-10 day objects)**
Design a realistic daily study plan for a working professional (2-4 hours/day):
- Order by PRIORITY: High severity skill gaps first
- Each day must have:
  * day: number (1-10)
  * focus: Clear topic area (e.g., "System Design Fundamentals + Database Optimization")
  * tasks: Array of 3-5 SPECIFIC, actionable items. Examples:
    - "Solve [Relevant Domain Problem/Exercise] focusing on [Specific JD Principle]"
    - "Simulate [Workflow from JD]: write the process flow, identify potential bottlenecks, and suggest [Industry Standard] optimizations"
    - "Record yourself answering 3 behavioral questions using STAR method, review for filler words and vague statements"
  AVOID generic tasks like "Study [Software]" or "Practice [Skill]"

- Recommended day structure:
  * Days 1-3: Core technical foundations, close high-severity gaps
  * Days 4-6: Applied practice (coding + system design)
  * Days 7-8: Behavioral prep + mock interviews
  * Days 9-10: Review weak areas + confidence building

**6. title (string)**
Extract the exact job title from the job description.

**7. resumeAnalysis (object)**
Perform a CRITICAL, RUTHLESS ATS-style keyword analysis. Imagine you are a senior hiring manager looking for reasons TO REJECT the candidate:
- matchedKeywords: Detect EVERY technical skill, tool, certification, and industry-standard phrase from the JD that is EXPLICITLY present in the resume. Return the EXACT string as it appears in the resume. 
- missingKeywords: Identify the 15+ MOST CRITICAL technical skills, softwares, or requirements from the JD that are COMPLETELY ABSENT from the candidate's profile. 
- BE SPECIFIC: Use "[Specific Software/Standard Name]", not just "[Generic Category]".
- DO NOT hallucinate matches. If it's not in the resume, it's MISSING.
- DO NOT return generic tech keywords (e.g., "Kubernetes", "React", "Unit Testing") unless they are EXPLICITLY required by the Job Description provided.

=== OUTPUT FORMAT ===
Respond with ONLY valid JSON matching this schema. No markdown, no code blocks, just raw JSON.
CRITICAL: ALL arrays (technicalQuestions, behavioralQuestions, skillGaps, preparationPlan, matchedKeywords, missingKeywords) MUST be populated. NO empty arrays allowed unless matchScore is 100% or 0% respectively.
${JSON.stringify(jsonSchema, null, 2)}

CRITICAL REMINDERS:
- matchScore must be an HONEST, PRECISE number (high standard — no round numbers)
- technicalQuestions and behavioralQuestions must EACH have at least 12 entries
- Every answer must be 200+ words, detailed and actionable
- preparationPlan must have 7-10 days with 3-5 specific tasks each
- All content must be tailored to THIS specific candidate and THIS specific job`

    const response = await ai.chat.completions.create({
        model: aiModel || "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{
            role: "system",
            content: "You are an elite interview preparation coach. You produce thorough, honest, and actionable interview reports. Your match scores are always precise and well-calibrated — you never default to generic numbers like 85 or 80. Your questions are at real interview difficulty level. Your answers are comprehensive and production-ready. Respond with valid JSON only — no markdown formatting."
        }, {
            role: "user",
            content: prompt
        }],
        temperature: 0.25,
        max_tokens: 8000,
        response_format: { type: "json_object" }
    })

    console.log("AI response:", JSON.parse(response.choices[0].message.content))
    return response.choices[0].message.content;
}

async function generateResumePDF({resume, selfDescription, jobDescription, aiModel}){
    const resumePdfSchema = z.object({
        html: z.string().describe("Complete HTML resume document with inline CSS styling, ready for PDF conversion.")
    });
    
    const prompt = `You are a world-class professional resume writer with 15+ years of experience placing candidates at top-tier firms across all industries (FAANG, Fortune 500, Healthcare, Engineering Firms, Creative Agencies, etc.).

Generate a COMPLETE, INDUSTRY-GRADE resume in HTML format. Your PRIMARY job is to REWRITE and ENHANCE the text content to be professional, compelling, and ATS-optimized for the SPECIFIC target role — the description details remain factually the same, but every sentence must be rewritten to the highest standards of the [Relevant Industry].

=== SOURCE INFORMATION ===
Resume: ${resume}

Self-description: ${selfDescription || '[EMPTY]'}

Target Job Description: ${jobDescription}

=== CRITICAL TEXT CONTENT RULES ===

**Professional Summary (2-3 sentences max):**
- Write a punchy, results-driven summary tailored to the TARGET job
- Include years of experience, key domain expertise, and 2-3 signature achievements
- Use industry keywords from the job description naturally
- Example tone: "Senior [Role] with 10+ years of experience driving [Key Outcome] in [Industry]. Expertise in [Core Skill 1] and [Core Skill 2] with a track record of [Specific Achievement measured by Metric]."

**Experience Section — REWRITE EVERY BULLET POINT:**
- Start EVERY bullet with a STRONG action verb (Architected, Spearheaded, Orchestrated, Engineered, Optimized, Streamlined, Pioneered, Implemented, Delivered, Reduced, Accelerated, Automated, Scaled, Led, Drove, Transformed)
- NEVER start with "Responsible for" or "Worked on" or "Helped with" — these are resume killers
- Add QUANTIFIED RESULTS to every bullet where possible:
  * Revenue impact: "...driving $2.4M in annual revenue"
  * Performance: "...reducing page load time by 65%"
  * Scale: "...serving 50K+ daily active users"
  * Efficiency: "...cutting deployment time from 4 hours to 15 minutes"
  * Team: "...leading a cross-functional team of 8 engineers"
- If the original resume lacks numbers, INFER reasonable metrics from context (e.g., if they built a feature, estimate impact)
- Each bullet should be 1-2 lines max, punchy and impactful
- Order bullets by RELEVANCE to the target job (most relevant first)
- Use the XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]"

**Skills Section:**
- Extract ALL relevant skills from resume AND job description
- Group into categories: Languages, Frameworks, Databases, Cloud/DevOps, Tools, Soft Skills
- Put JOB-MATCHING skills FIRST in each category
- Include skills from the job description that the candidate has (even if not explicitly listed)

**Education:**
- Include GPA only if > 3.5
- Add relevant coursework only if it matches job requirements
- Include honors, awards, or relevant extracurriculars

**ATS Optimization:**
- Mirror EXACT keywords from the job description (if JD says "React.js", use "React.js" not just "React")
- Include both acronyms and full forms (e.g., "Amazon Web Services (AWS)")
- Use standard section headings: "Professional Summary", "Experience", "Skills", "Education"
- No headers/footers, no images, no columns that confuse ATS parsers

=== HTML STYLING RULES ===
- Use inline CSS only (no external stylesheets)
- Clean, single-column layout (ATS-friendly)
- Font: 'Segoe UI', Arial, sans-serif; body 10.5pt, name 20pt bold, section headers 12pt bold uppercase
- Color: Name header in #1a365d (dark navy), section dividers in #2d3748, body text in #1a202c
- Skill badges with subtle background colors:
  * Job-critical skills: background #dcfce7, color #166534 (green)
  * Important skills: background #dbeafe, color #1e40af (blue)  
  * Additional: background #f3e8ff, color #6b21a8 (purple)
- Margins: 0.6in sides, 0.4in top/bottom (optimized for A4 PDF)
- Subtle horizontal rules between sections (1px solid #e2e8f0)
- Compact spacing — the resume MUST fit on 1-2 pages maximum
- Professional, clean, modern look — like a senior engineer's resume

=== FINAL CHECKLIST ===
- Every experience bullet starts with a strong action verb
- Every bullet has a quantified result or clear impact
- Skills section mirrors job description keywords exactly
- Professional summary is tailored to THIS specific job
- Resume is 1-2 pages max (be concise!)
- Text reads naturally — NOT robotic or AI-generated
- All facts remain truthful to the source resume

Respond with a JSON object with a single 'html' field containing the complete HTML resume.
Schema: ${JSON.stringify(zodToJsonSchema(resumePdfSchema), null, 2)}`;

    const response = await ai.chat.completions.create({
        model: aiModel || "moonshotai/kimi-k2-instruct-0905",
        messages: [{
            role: "system",
            content: "You are an expert resume writer. You produce ATS-optimized, professionally written resumes that get candidates interviews at top companies. Always output valid JSON with an 'html' field."
        }, {
            role: "user",
            content: prompt
        }],
        temperature: 0.3,
        max_tokens: 6000,
        response_format: { type: "json_object" }
    })
    
    const jsonResponse = JSON.parse(response.choices[0].message.content);
    const pdf = await convertHTMLToPDF(jsonResponse.html);
    return { pdf, html: jsonResponse.html };
}

async function convertHTMLToPDF(htmlContent){
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4' });
    await browser.close();
    return pdf;
}

async function generateProjectIdeas({skillGaps, jobDescription, aiModel}){
    const projectIdeasSchema = z.object({
        projects: z.array(z.object({
            title: z.string().describe("A catchy, portfolio-ready project title"),
            description: z.string().describe("2-3 sentence description of what the project does and why it's impressive"),
            techStack: z.array(z.string()).describe("List of technologies used in this project"),
            skillsCovered: z.array(z.string()).describe("Which skill gaps this project addresses"),
            difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).describe("Project difficulty level"),
            estimatedTime: z.string().describe("Estimated time to complete, e.g. '1-2 weeks'"),
            keyFeatures: z.array(z.string()).describe("3-5 key features to implement"),
            whyItImpresses: z.string().describe("Why this project would impress a recruiter or hiring manager")
        })).describe("2-3 portfolio-ready side project ideas")
    });

    const prompt = `You are a senior engineering manager who reviews portfolios and side projects when hiring. Based on the candidate's skill gaps and the target job, suggest 2-3 SPECIFIC, portfolio-ready side project ideas that would:
1. Help the candidate learn the missing skills
2. Look impressive on their portfolio/GitHub
3. Be completable in 1-3 weeks by a motivated developer

=== SKILL GAPS ===
${JSON.stringify(skillGaps, null, 2)}

=== TARGET JOB DESCRIPTION ===
${jobDescription}

=== REQUIREMENTS ===
- Each project must directly address at least 2 of the High/Medium severity skill gaps
- Projects should be REAL, useful applications (not toy demos)
- Include specific tech stack choices that match the job requirements
- Make projects progressively harder (one beginner-friendly, one intermediate, one advanced)
- Each project should be something the candidate can demo in an interview
- Include key features that would showcase the skills being learned

Respond with valid JSON matching this schema exactly. CRITICAL: NO empty arrays and NO missing fields. Do not omit 'title', 'difficulty', 'estimatedTime', 'skillsCovered', 'keyFeatures', or 'whyItImpresses'.

EXAMPLE OUTPUT:
{
  "projects": [
    {
      "title": "Full-Stack Weather Dashboard",
      "description": "A scalable weather dashboard with real-time updates.",
      "difficulty": "Intermediate",
      "estimatedTime": "1-2 weeks",
      "techStack": ["React", "Node.js", "Redis"],
      "skillsCovered": ["System Design", "Caching"],
      "keyFeatures": ["Real-time data streaming", "Redis caching layer", "Responsive UI"],
      "whyItImpresses": "Demonstrates ability to handle real-time data and implement optimized caching strategies."
    }
  ]
}

Respond with valid JSON matching this schema:
${JSON.stringify(zodToJsonSchema(projectIdeasSchema), null, 2)}`;

    const response = await ai.chat.completions.create({
        model: aiModel || "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{
            role: "system",
            content: "You are a senior engineering hiring manager. You suggest impressive, practical portfolio projects that help candidates close their skill gaps. Respond with valid JSON only. NEVER omit any fields from the requested schema."
        }, {
            role: "user",
            content: prompt
        }],
        temperature: 0.4,
        max_tokens: 3000,
        response_format: { type: "json_object" }
    });

    return response.choices[0].message.content;
}


async function validateInputs({resume, selfDescription, jobDescription, aiModel}){
    const validationSchema = z.object({
        isValid: z.boolean().describe("true ONLY if ALL three inputs are genuinely valid. false if ANY single input is problematic."),
        reason: z.string().describe("If isValid is false, a brief explanation of which field failed and why.")
    });

    const prompt = `You are a FAIR and CONTEXT-AWARE input validator for an AI interview preparation tool. Your job is to catch genuinely invalid or spam inputs while ALLOWING real user data through — even if it's messy.

=== INPUTS TO VALIDATE ===

FIELD 1 - Resume (extracted from a PDF):
"""
${resume && resume.trim().length > 0 ? resume.substring(0, 2000) : '[EMPTY]'}
"""

FIELD 2 - Self-Description (user typed):
"""
${selfDescription && selfDescription.trim().length > 0 ? selfDescription : '[EMPTY]'}
"""

FIELD 3 - Job Description (user typed):
"""
${jobDescription && jobDescription.trim().length > 0 ? jobDescription : '[EMPTY]'}
"""

=== VALIDATION RULES ===

You MUST return isValid: false ONLY if ANY of the following is clearly true:

1. **Resume**: Must look like it came from a real person's resume/CV. 
   - ACCEPT if it contains ANY recognizable professional content: names, skills, job titles, education, projects, experience, etc.
   - ACCEPT even if it has formatting issues, weird characters, broken layouts, or encoding artifacts — this is NORMAL for PDF-to-text extraction.
   - ACCEPT even if there are typos or grammatical errors — real resumes often have these.
   - ACCEPT even if the resume content does NOT match the job description — the user may be pivoting careers.
   - REJECT ONLY if the content is clearly NOT a resume: pure gibberish, lorem ipsum, song lyrics, recipes, a novel, or a completely blank/empty document.

2. **Self-Description**: This field is COMPLETELY OPTIONAL.
   - ALWAYS ACCEPT if it's empty, blank, or '[EMPTY]'. Never mention it as a problem.
   - If provided, only REJECT if it's clearly offensive, spam, or troll content (e.g., hate speech, random keyboard smashing like "asdfghjkl").
   - Short descriptions are fine. Even a single sentence is acceptable.

3. **Job Description**: Must look like it describes some kind of job, role, or position.
   - ACCEPT if it contains ANY recognizable job-related content: role titles, responsibilities, requirements, qualifications, company info, etc.
   - ACCEPT even if it's short, informal, or poorly formatted.
   - ACCEPT even if it doesn't match the resume — users may be exploring new career paths.
   - REJECT ONLY if the content is clearly NOT a job description: recipes, stories, jokes, gibberish, or completely empty.

IMPORTANT: When in doubt, ACCEPT. It is better to let a borderline input through than to block a real user. Only reject inputs that are genuinely spam, nonsensical, or harmful.

Return JSON: { "isValid": boolean, "reason": string }`;

    try {
        const response = await ai.chat.completions.create({
            model: aiModel || "llama-3.1-8b-instant",
            messages: [{
                role: "system",
                content: "You are a fair input validator. Accept any input that looks like a real resume, job description, or professional content — even if messy or poorly formatted. Self-description is optional and can be empty. Only reject clearly spam, gibberish, or harmful content. When in doubt, ACCEPT. Respond with valid JSON only."
            }, {
                role: "user",
                content: prompt
            }],
            temperature: 0.05,
            max_tokens: 200,
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content);
        console.log("Validation result:", result);
        return result;
    } catch (e) {
        console.error("Input validation AI call failed, letting it pass by default:", e);
        return { isValid: true, reason: '' };
    }
}

async function generateFullReportPDF(reportData){
    const { 
        title, 
        matchScore, 
        technicalQuestions, 
        behavioralQuestions, 
        skillGaps, 
        preparationPlan, 
        projectIdeas,
        aiModel
    } = reportData;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                line-height: 1.6;
                color: #1a202c;
                margin: 0;
                padding: 40px;
                background-color: #ffffff;
            }

            .header {
                border-bottom: 2px solid #6c5ce7;
                padding-bottom: 20px;
                margin-bottom: 30px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .header-info h1 {
                margin: 0;
                color: #2d3748;
                font-size: 24px;
                letter-spacing: -0.02em;
            }

            .header-info p {
                margin: 5px 0 0;
                color: #718096;
                font-size: 14px;
            }

            .match-score {
                background: #f7fafc;
                border: 1px solid #e2e8f0;
                border-left: 5px solid #6c5ce7;
                padding: 15px 20px;
                border-radius: 8px;
                margin-bottom: 30px;
            }

            .match-score h2 {
                margin: 0;
                font-size: 18px;
                color: #4a5568;
            }

            .score-value {
                font-size: 32px;
                font-weight: 700;
                color: #6c5ce7;
            }

            .section {
                margin-bottom: 40px;
                page-break-inside: avoid;
            }

            .section-title {
                font-size: 20px;
                font-weight: 700;
                color: #2d3748;
                border-bottom: 1px solid #edf2f7;
                padding-bottom: 10px;
                margin-bottom: 20px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .card {
                background: #fff;
                border: 1px solid #edf2f7;
                padding: 15px;
                margin-bottom: 15px;
                border-radius: 6px;
            }

            .card h3 {
                margin-top: 0;
                font-size: 16px;
                color: #2d3748;
            }

            .label {
                font-weight: 600;
                color: #4a5568;
                font-size: 13px;
                display: block;
                margin-bottom: 4px;
                text-transform: uppercase;
            }

            .content {
                color: #4a5568;
                font-size: 14px;
                margin-bottom: 12px;
            }

            .severity {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
            }

            .severity-high { background: #fff5f5; color: #c53030; }
            .severity-medium { background: #fffaf0; color: #975a16; }
            .severity-low { background: #f0fff4; color: #276749; }

            .tag {
                display: inline-block;
                background: #ebf4ff;
                color: #2b6cb0;
                padding: 4px 10px;
                border-radius: 9999px;
                font-size: 12px;
                margin-right: 5px;
                margin-bottom: 5px;
            }

            .footer {
                margin-top: 50px;
                text-align: center;
                font-size: 12px;
                color: #a0aec0;
                border-top: 1px solid #edf2f7;
                padding-top: 20px;
            }

            @media print {
                .section { page-break-inside: avoid; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="header-info">
                <h1>Interview Preparation Report</h1>
                <p>Position: <strong>${title}</strong></p>
                <p>AI Agent: ${aiModel || 'Primary AI'}</p>
            </div>
            <div class="score-container" style="text-align: right;">
                <div class="score-value">${matchScore}%</div>
                <div style="font-size: 12px; color: #718096; font-weight: 600;">MATCH SCORE</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Critical Skill Gaps</div>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                ${skillGaps?.map(gap => `
                    <div class="card" style="flex: 1; min-width: 200px;">
                        <span class="label">Skill</span>
                        <div class="content"><strong>${gap.skill}</strong></div>
                        <span class="severity severity-${gap.severity?.toLowerCase()}">${gap.severity} Priority</span>
                    </div>
                `).join('') || '<p>No skill gaps identified.</p>'}
            </div>
        </div>

        <div class="section">
            <div class="section-title">Technical Interview Questions</div>
            ${technicalQuestions?.map((q, i) => `
                <div class="card">
                    <h3>${i+1}. ${q.question}</h3>
                    <span class="label">Interviewer Intention</span>
                    <div class="content">${q.intention}</div>
                    <span class="label">Model Answer</span>
                    <div class="content">${q.answer}</div>
                </div>
            `).join('') || '<p>No technical questions generated.</p>'}
        </div>

        <div class="section">
            <div class="section-title">Behavioral Interview Questions</div>
            ${behavioralQuestions?.map((q, i) => `
                <div class="card">
                    <h3>${i+1}. ${q.question}</h3>
                    <span class="label">Candidate Story Focus</span>
                    <div class="content">${q.intention}</div>
                    <span class="label">Model Answer (STAR Method)</span>
                    <div class="content">${q.answer}</div>
                </div>
            `).join('') || '<p>No behavioral questions generated.</p>'}
        </div>

        <div class="section">
            <div class="section-title">Preparation Battle Plan</div>
            ${preparationPlan?.map(day => `
                <div class="card">
                    <span class="label">Day ${day.day}</span>
                    <div class="content"><strong>Focus: ${day.focus}</strong></div>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #4a5568;">
                        ${day.tasks?.map(task => `<li>${task}</li>`).join('')}
                    </ul>
                </div>
            `).join('') || '<p>No plan available.</p>'}
        </div>

        ${projectIdeas?.length > 0 ? `
        <div class="section">
            <div class="section-title">Portfolio Project Ideas</div>
            ${projectIdeas.map(project => `
                <div class="card">
                    <h3>${project.title}</h3>
                    <div class="content" style="margin-bottom: 8px;">${project.description}</div>
                    <span class="label">Tech Stack</span>
                    <div style="margin-bottom: 10px;">
                        ${project.techStack?.map(tech => `<span class="tag">${tech}</span>`).join('')}
                    </div>
                    <span class="label">Key Features</span>
                    <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #4a5568;">
                        ${project.keyFeatures?.map(feat => `<li>${feat}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="footer">
            Generated by InterviewGenie AI &mdash; Ready to crush your next interview.
        </div>
    </body>
    </html>
    `;

    return await convertHTMLToPDF(htmlContent);
}


module.exports = {
    generateInterviewReport,
    generateResumePDF,
    convertHTMLToPDF,
    generateProjectIdeas,
    validateInputs,
    generateFullReportPDF
}