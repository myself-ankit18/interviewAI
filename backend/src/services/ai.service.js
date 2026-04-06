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
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const puppeteer = require("puppeteer");

const ai = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .describe(
      "A score between 0 and 100 that indicates how well the candidate matches the job requirements based on the analysis of the resume, self-description, and job description.",
    ),
  technicalQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe(
            "The technical question can be asked during the interview.",
          ),
        intention: z
          .string()
          .describe(
            "The intention by the interviewer behind asking the technical question.",
          ),
        answer: z
          .string()
          .describe(
            "How to answer the technical question, including key points that should be covered in the answer.",
          ),
      }),
    )
    .describe(
      "A list of technical questions(at least 10) that can be asked during the interview, along with the intention behind each question and how to answer it.",
    ),
  behavioralQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe(
            "The behavioral question can be asked during the interview.",
          ),
        intention: z
          .string()
          .describe(
            "The intention by the interviewer behind asking the behavioral question.",
          ),
        answer: z
          .string()
          .describe(
            "How to answer the behavioral question, including key points that should be covered in the answer.",
          ),
      }),
    )
    .describe(
      "A list of behavioral questions (at least 10) that can be asked during the interview, along with the intention behind each question and how to answer it.",
    ),
  skillGaps: z
    .array(
      z.object({
        skill: z
          .string()
          .describe(
            "The skill that the candidate is lacking based on the analysis of the resume, self-description, and job description.",
          ),
        severity: z
          .enum(["Low", "Medium", "High"])
          .describe(
            "The severity of the skill gap, indicating how critical it is for the candidate to improve in this area.",
          ),
      }),
    )
    .describe(
      "A list of skill gaps that the candidate has, along with the severity of each gap.",
    ),
  preparationPlan: z
    .array(
      z.object({
        day: z
          .number()
          .describe("The day number in the preparation plan, starting from 1."),
        focus: z
          .string()
          .describe(
            "The main focus for the day, such as a specific topic, skill, or type of question to practice.",
          ),
        tasks: z
          .array(z.string())
          .describe(
            "A list of specific tasks or activities that the candidate should complete on this day to prepare for the interview.",
          ),
      }),
    )
    .describe(
      "A detailed preparation plan for the candidate, outlining what they should focus on and do each day leading up to the interview.",
    ),
  title: z
    .string()
    .describe(
      "The title of the job position that the candidate is applying for, which can be used to tailor the interview report and preparation plan to the specific role.",
    ),
  resumeAnalysis: z
    .object({
      matchedKeywords: z
        .array(z.string())
        .describe(
          "EXACT keywords or short technical phrases found in the resume that match the job description.",
        ),
      missingKeywords: z
        .array(z.string())
        .describe(
          "Critical keywords or required technologies from the job description that are NOT found in the resume.",
        ),
    })
    .describe(
      "ATS-style keyword analysis for showing a heatmap of match vs gaps.",
    ),
});

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
  aiModel,
}) {
  const jsonSchema = zodToJsonSchema(interviewReportSchema);

  const prompt = `You are a brutally honest, world-class recruiting strategist and interview coach with 20+ years of experience across EVERY major industry — FAANG, Big 4, Fortune 100, top-tier hospitals, law firms, investment banks, engineering conglomerates, and creative agencies. You have reviewed over 50,000 resumes and conducted thousands of live technical and behavioral interviews.

Your reputation is built on ONE thing: accuracy. Hiring managers trust your assessments because you never inflate scores, never fabricate matches, and never produce generic output. Every report you generate is forensically tailored to the specific candidate and specific role.

=== INPUTS ===
Resume:            ${resume}
Self-Description:  ${selfDescription || "[NOT PROVIDED — work strictly from resume]"}
Target Job (JD):   ${jobDescription}

=== PRE-ANALYSIS PHASE — COMPLETE THIS BEFORE GENERATING ANY OUTPUT ===

Step 1 — Deconstruct the JD
  a. Extract every REQUIRED skill, tool, certification, and methodology (label each as R = Required)
  b. Extract every PREFERRED / NICE-TO-HAVE qualification (label each as P = Preferred)
  c. Identify the seniority signal: junior / mid / senior / staff / principal / director
  d. Identify the industry domain and any domain-specific jargon

Step 2 — Forensic Resume Scan
  a. List every technical skill, tool, and methodology present in the resume
  b. List every quantified achievement present
  c. Note years of total experience and years in the relevant domain
  d. Note any explicit certifications, degrees, or credentials

Step 3 — Gap Matrix
  For each Required skill from Step 1a: Does the resume/self-description show clear evidence? 
  Mark: MATCH / PARTIAL / ABSENT
  For each Preferred skill from Step 1b: Same exercise.

This internal analysis drives EVERY section below. Do not skip it.

=== SECTION 1: matchScore (integer 0–100) ===

Compute a PRECISE, HONEST score using this exact weighted formula:

  Dimension A — Required Technical Skills (40% weight)
    Score = (number of MATCH) × 1.0 + (number of PARTIAL) × 0.4) / (total Required skills) × 100
    
  Dimension B — Experience Level Match (25% weight)
    Compare candidate's total YOE + domain YOE vs what the JD implies.
    • Meets or exceeds requirement → 85–100
    • 1–2 years short → 55–70
    • 3+ years short or wrong seniority level → 20–45

  Dimension C — Domain / Industry Expertise (20% weight)
    • Same industry + same function → 85–100
    • Adjacent industry, same function → 55–75
    • Different industry, transferable skills → 30–55
    • Different industry, few transferable → 10–30

  Dimension D — Preferred / Nice-to-Have Match (15% weight)
    Score = (Preferred skills matched / total Preferred skills) × 100

  Final Score = (A × 0.40) + (B × 0.25) + (C × 0.20) + (D × 0.15)
  Round to nearest integer. Never round to a multiple of 5 unless the math produces it.

CALIBRATION RULES — these are hard constraints:
  • 90–100: Candidate exceeds nearly ALL requirements + has domain expertise. Extremely rare.
  • 75–89:  Strong candidate, matches most required skills, right seniority, right domain.
  • 60–74:  Solid candidate with clear gaps. Competitive but not a lock.
  • 45–59:  Moderate fit. Multiple high-severity gaps. Needs significant prep.
  • 30–44:  Weak fit. Missing core requirements. Long-shot candidate.
  • 0–29:   Poor fit. Wrong domain, wrong skills, wrong level.

FORBIDDEN outputs: 85, 80, 75, 70, 65, 60, 50 (exact round numbers signal lazy scoring)
You MUST output a precise number like 67, 73, 82, 58, 41, 77, 63, 88, 34.
If your formula produces exactly 80, recheck your PARTIAL scoring — you likely rounded too aggressively.

=== SECTION 2: technicalQuestions (array of 12+ objects) ===

Generate questions a REAL senior interviewer at this specific type of company would ask.
These must feel like they came from a person — not a textbook or a quiz generator.

Mandatory question distribution:
  • 3–4 foundational questions: Core concepts directly from the JD tech stack
  • 3–4 intermediate applied questions: Real scenarios — debugging, optimization, trade-offs
  • 2–3 system design / architecture questions: Scaled to the role's seniority level
  • 2–3 advanced questions: Edge cases, failure modes, competing approaches

Each object must have EXACTLY these fields:

  question:
    Write exactly as an interviewer would say it — conversational, specific, grounded in the JD.
    Reference actual tools, systems, or scenarios from the JD where possible.
    BAD: "Explain polymorphism."
    GOOD: "You're migrating [Company's implied stack] from a monolith to microservices. 
           One of your services is hitting 500 errors under load every ~3 minutes. 
           Walk me through how you'd diagnose and fix this without taking down production."

  intention:
    What is the interviewer ACTUALLY probing for? Be specific.
    BAD: "Tests technical knowledge."
    GOOD: "Evaluates whether the candidate can distinguish between CPU-bound and I/O-bound 
           bottlenecks and knows which profiling tools to reach for first."

  answer:
    A comprehensive model answer, 200–400 words. Must include:
    • The correct core answer
    • At least one concrete example or pseudocode snippet
    • Trade-offs or when the approach breaks down
    • 1–2 common mistakes candidates make and why they're wrong
    Write this as if coaching the candidate — clear, teachable, honest about nuance.

=== SECTION 3: behavioralQuestions (array of 12+ objects) ===

Cover a WIDE range of competency dimensions. Use this as a checklist — do not cluster:
  Leadership under ambiguity | Technical disagreement with a senior | 
  Failure and recovery | Stakeholder conflict | Deadline under pressure |
  Owning a mistake | Cross-functional influence without authority |
  Onboarding / mentoring others | Prioritization under competing demands |
  Proactively improving a broken process | Navigating org politics |
  Adapting to sudden scope change

Each object must have EXACTLY these fields:

  question:
    Conversational, role-specific phrasing. Reference the actual role or domain where possible.
    BAD: "Tell me about a time you showed leadership."
    GOOD: "Tell me about a time you had to push back on a product decision you believed 
           was technically unsound — how did you make your case, and what happened?"

  intention:
    The specific competency or leadership principle being assessed. Name it precisely.
    Example: "Assesses psychological safety, ability to escalate constructively, 
               and how the candidate handles being overruled."

  answer:
    A full STAR-method response, 200–350 words, plausibly drawn from the candidate's 
    actual resume background. Include:
    • Situation: specific, not vague
    • Task: candidate's personal responsibility
    • Action: at least 3 concrete steps taken
    • Result: quantified or clearly demonstrable outcome
    • Reflection: what the candidate learned / would do differently
    The story must feel like it could actually have happened in this person's career.

=== SECTION 4: skillGaps (array of objects) ===

Derived DIRECTLY from the Gap Matrix in the Pre-Analysis phase.
Only include gaps for skills that are EXPLICITLY required or strongly implied by THIS JD.
Do not include generic tech skills unless the JD specifically calls for them.

Each object must have:
  skill:
    Be surgical. Not "Cloud experience" — say "Multi-region failover configuration on AWS RDS".
    Not "Communication" — say "Executive stakeholder reporting for capital expenditure proposals".

  severity:
    'High'   = Required by JD, completely absent from candidate profile. Blocking gap.
    'Medium' = Required by JD, partially present or inferred from adjacent experience.
    'Low'    = Preferred by JD, absent from profile. Minor competitive disadvantage.

  context:
    One sentence explaining WHY this gap matters for this specific role.
    Example: "The JD requires daily use of [Tool X] for [Workflow Y], which does not appear 
              anywhere in the candidate's resume or self-description."

=== SECTION 5: preparationPlan (array of 7–10 day objects) ===

Design a realistic plan for a working professional with 2–4 hours per day.
Every task must be SPECIFIC and ACTIONABLE — not "study X" or "practice Y".

Day structure template:
  Days 1–3:   Close High-severity skill gaps. Hard technical focus.
  Days 4–6:   Applied practice — coding challenges, case studies, mock system design.
  Days 7–8:   Behavioral prep — STAR story bank, mock interviews, answer refinement.
  Days 9–10:  Weakness review + confidence calibration + logistics prep.

Each day object must have:
  day:    integer (5–20)
  focus:  A sharp topic label (e.g., "Distributed Systems Fundamentals + Write-Heavy DB Design")
tasks: Array of 3–5 strings. Each string must be a single, self-contained, 
actionable sentence that embeds the WHAT, HOW, and SUCCESS CRITERION inline.

Each task string must follow this pattern:
"[Action verb] [specific concept/tool] by [format/method] — success = [measurable goal]"

Examples of CORRECT task strings:
  "Diagram a multi-tenant auth flow using JWT + refresh tokens in a drawing tool — 
   success = can explain every node without notes"
  
  "Record yourself answering 'Tell me about a time you missed a deadline' using STAR 
   in under 2.5 minutes — re-record until zero filler words remain"
  
  "Write a working SQL query with window functions (RANK, LAG) on a mock sales dataset 
   — success = query runs and returns correct ranked results"

WRONG (do NOT output objects, nested keys, or JSON inside tasks):
  { task: "...", format: "...", goal: "..." }   ← NEVER do this
  ["item1", "item2"]                            ← tasks must be strings, not arrays

=== SECTION 6: title (string) ===
Extract the verbatim job title from the job description. Do not paraphrase.

=== SECTION 7: resumeAnalysis (object) ===

Perform a ruthless ATS + human reviewer audit. Imagine you are a skeptical senior hiring 
manager actively looking for reasons to deprioritize this candidate.

  matchedKeywords (array of strings):
    Every technical skill, tool, certification, methodology, and industry phrase from the JD 
    that is EXPLICITLY AND CLEARLY present in the resume.
    Rules:
    • Use the EXACT string as it appears in the resume (case-sensitive where relevant)
    • Do NOT include inferred or implied skills — only explicit matches
    • Do NOT include soft skills unless the JD specifically phrases them as requirements
    • Include version numbers if the JD specifies them and the resume matches

  missingKeywords (array of strings — minimum 10, no maximum):
    Every technical skill, tool, certification, methodology, or credential the JD requires 
    or strongly prefers that is COMPLETELY ABSENT from the resume and self-description.
    Rules:
    • Be specific: "ISO 13485 quality management certification" not "quality certification"
    • Do NOT fabricate matches — if in doubt, it's MISSING
    • Do NOT include generic tech skills unless THIS JD explicitly requires them
    • Prioritize by JD emphasis (most-emphasized missing skills listed first)

=== OUTPUT FORMAT ===

Return ONLY valid, raw JSON. No markdown. No code fences. No preamble. No explanation.
All arrays must be populated. Empty arrays are NEVER acceptable.

${JSON.stringify(jsonSchema, null, 2)}

=== FINAL QUALITY CHECKLIST (verify before outputting) ===
  ✓ matchScore is a non-round number derived from the weighted formula
  ✓ matchScore is NOT 85, 80, 75, 70, 65, 60, or 50
  ✓ technicalQuestions has 12+ entries with 200+ word answers
  ✓ behavioralQuestions has 12+ entries with 200+ word answers
  ✓ Every skillGap includes a context field
  ✓ preparationPlan has 7–10 days with 3–5 specific tasks each
  ✓ matchedKeywords contains only EXPLICIT resume matches
  ✓ missingKeywords contains at least 10 entries specific to THIS JD
  ✓ All content is tailored to THIS candidate and THIS job — zero generic filler`;

  const response = await ai.chat.completions.create({
    model: aiModel || "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "system",
        content:
          "You are an elite interview preparation coach. You produce thorough, honest, and actionable interview reports. Your match scores are always precise and well-calibrated — you never default to generic numbers like 85 or 80. Your questions are at real interview difficulty level. Your answers are comprehensive and production-ready. Respond with valid JSON only — no markdown formatting.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.25,
    max_tokens: 8000,
    response_format: { type: "json_object" },
  });

  console.log("AI response:", JSON.parse(response.choices[0].message.content));
  return response.choices[0].message.content;
}

async function generateResumePDF({
  resume,
  selfDescription,
  jobDescription,
  aiModel,
}) {
  const resumePdfSchema = z.object({
    html: z
      .string()
      .describe(
        "Complete HTML resume document with inline CSS styling, ready for PDF conversion.",
      ),
  });

  const prompt = `You are an elite resume strategist and technical writer with 20+ years of experience placing candidates at FAANG, Fortune 100, unicorn startups, Big 4 consultancies, and top healthcare and engineering firms. You write with the precision of a headhunter, the insight of a hiring manager, and the craft of an award-winning copywriter.

Your mission: Transform the provided source material into a 1–2 page, ATS-optimized, human-compelling resume in clean HTML — tailored with surgical precision to the target job description. Every word must earn its place. Every bullet must prove impact. The final document should feel like it was written by a human expert who knows the industry cold.

=== INPUTS ===
Resume (raw):         ${resume}
Self-description:     ${selfDescription || "[NOT PROVIDED — infer from resume context]"}
Target Job (JD):      ${jobDescription}

=== CONTENT STRATEGY — READ CAREFULLY ===

━━ STEP 1: ANALYZE BEFORE WRITING ━━
Before generating any HTML, internally complete this analysis:
  1. Identify the top 8–12 keywords/phrases from the JD (skills, tools, methodologies, outcomes)
  2. Map each keyword to candidate evidence in the resume or self-description
  3. Flag any critical JD requirements the resume does NOT address — note them for the summary
  4. Determine the seniority level implied by the JD and calibrate tone accordingly

━━ STEP 2: PROFESSIONAL SUMMARY (4–5 lines max) ━━
Write a tightly crafted paragraph — NOT a list — that:
  • Opens with title + years of experience + primary domain
  • Weaves in 2–3 of the JD's top keywords naturally (do NOT stuff)
  • References 1 career-defining achievement with a metric
  • Closes with a forward-looking sentence aligned to the target role

Tone guide: Confident, specific, human. Never generic. Never passive.

Bad:  "Results-driven professional with strong communication skills"
Good: "Full-stack engineer with 7 years building high-traffic consumer products at scale,
       specializing in React.js and Node.js microservices. Reduced API latency 62% at
       Acme Corp by redesigning the caching layer, directly improving NPS by 14 points.
       Joining [Company] to architect resilient, user-first systems at global scale."

━━ STEP 3: EXPERIENCE BULLETS — THE CORE OF THE RESUME ━━
For EACH role, rewrite ALL bullets following these non-negotiable rules:

  RULE A — STRONG ACTION VERB FIRST (no exceptions)
  Use tier-1 verbs for senior impact:
    Architected, Spearheaded, Orchestrated, Pioneered, Engineered, Transformed,
    Overhauled, Championed, Negotiated, Drove, Scaled, Automated
  Use tier-2 for execution:
    Implemented, Delivered, Deployed, Optimized, Streamlined, Redesigned,
    Migrated, Integrated, Launched, Reduced, Accelerated, Built, Led, Partnered
  NEVER use:
    "Responsible for", "Worked on", "Helped with", "Assisted", "Participated in"

  RULE B — QUANTIFY EVERY BULLET (infer if necessary)
  Revenue:      "…generating $1.8M ARR in the first year post-launch"
  Performance:  "…reducing p95 latency from 840ms to 120ms (85% improvement)"
  Scale:        "…serving 2M+ monthly active users across 14 countries"
  Efficiency:   "…cutting manual QA time by 70%, saving ~$200K/year in engineering hours"
  Team:         "…leading a squad of 6 engineers across 3 time zones"

  If the resume lacks metrics, INFER conservative, credible estimates based on:
    – Company size and industry norms
    – Feature/project scope described
    – Role seniority and team structure
  Mark inferred metrics in your internal reasoning only — do NOT expose them in the HTML.

  RULE C — XYZ FORMULA (Google's gold standard)
  "Accomplished [X measured outcome], by doing [Z specific action], resulting in [Y impact]"
  Apply loosely — bullets should feel natural, not formulaic.

  RULE D — RELEVANCE ORDERING
  Within each role, sort bullets: most relevant to JD first.
  Trim or cut bullets that have zero relevance to the target role.
  Aim for 3–5 bullets per role (4 is ideal for primary roles).

  RULE E — KEYWORD MIRRORING
  If JD says "TypeScript"              → use "TypeScript" (not "TS")
  If JD says "cross-functional collaboration" → use that exact phrase in at least one bullet
  If JD says "CI/CD pipelines"         → use "CI/CD pipelines" verbatim

━━ STEP 4: SKILLS SECTION ━━
Group into labeled categories. Include ALL that apply:
  Languages | Frameworks & Libraries | Databases | Cloud & DevOps |
  Tools & Platforms | Methodologies | Soft Skills (limit to 3–4 only)

Priority rule:
  Tier 1 (green badges)  = skills explicitly required in JD that candidate has
  Tier 2 (blue badges)   = skills mentioned in JD or strongly relevant to role
  Tier 3 (purple badges) = additional skills from resume not in JD

Include skills from the JD that the candidate demonstrably has, even if not explicitly listed.

━━ STEP 5: EDUCATION ━━
  • Include GPA only if ≥ 3.5 (or regional equivalent)
  • List relevant coursework only if it directly maps to JD requirements
  • Include academic awards, thesis titles, or honors if present
  • For senior candidates (10+ years), keep education compact (2 lines per degree)

━━ STEP 6: OPTIONAL SECTIONS (include only if evidence exists) ━━
  • Certifications     — if current and JD-relevant
  • Projects / Open Source — if technical role + strong portfolio evidence
  • Publications / Speaking — if leadership or thought-leadership role
  • Volunteer / Leadership — only if highly relevant — do NOT pad

━━ ATS HARDENING ━━
  • Mirror JD keywords exactly — acronym AND full form: "Amazon Web Services (AWS)"
  • Standard heading names only: Professional Summary | Experience | Skills | Education
  • No tables for layout, no multi-column text blocks, no SVG/images, no headers/footers
  • All dates in consistent format: "Jan 2020 – Present" or "2020 – Present"
  • Company names bolded, job titles in plain weight (ATS reads titles more reliably this way)
  • Unicode bullets (•) only — no custom glyphs that confuse parsers

=== HTML OUTPUT CONTRACT ===

━━ STRUCTURE ━━
  Single-column layout. No flexbox columns. No CSS Grid for body layout (breaks ATS).
  Section order: Name/Contact → Summary → Experience → Skills → Education → Optional

━━ TYPOGRAPHY ━━
  Font stack:        'Segoe UI', 'Helvetica Neue', Arial, sans-serif
  Name:              22pt, font-weight: 700, color: #1a365d
  Section headers:   11pt, font-weight: 700, text-transform: uppercase,
                     color: #2d3748, letter-spacing: 0.08em
  Job title:         10.5pt, font-weight: 600, color: #2d3748
  Company + dates:   10pt, color: #4a5568
  Body text:         10pt, color: #1a202c, line-height: 1.45
  Contact line:      9.5pt, color: #4a5568, separator: " · "

━━ SPACING & LAYOUT ━━
  Page margins:   0.55in left/right, 0.4in top/bottom
  Section gap:    10px between sections
  Bullet indent:  16px left padding, margin-bottom: 3px per bullet
  Role block gap: 8px between roles within same section

━━ VISUAL ELEMENTS ━━
  Section divider:
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 6px 0 10px;">

  Skill badges — inline-block, border-radius: 3px, padding: 2px 8px, font-size: 9pt:
    Tier 1 (green):  background: #dcfce7; color: #14532d; border: 1px solid #bbf7d0
    Tier 2 (blue):   background: #dbeafe; color: #1e3a8a; border: 1px solid #bfdbfe
    Tier 3 (purple): background: #f3e8ff; color: #581c87; border: 1px solid #e9d5ff

━━ QUALITY BAR ━━
  ✓ Resume renders cleanly in both screen and print/PDF
  ✓ All inline CSS — zero external stylesheets or class dependencies
  ✓ Fits 1 page for <8 years experience, 2 pages max for senior profiles
  ✓ No lorem ipsum, no placeholder text, no template artifacts
  ✓ Looks like it was crafted by a human designer, not generated from a template

=== OUTPUT FORMAT ===

Return a single JSON object. No preamble. No explanation. No markdown fences.

Schema: ${JSON.stringify(zodToJsonSchema(resumePdfSchema), null, 2)}

The "html" field must contain the complete, self-contained HTML document as a string.
Escape all double quotes inside the HTML string with \".
The HTML must be valid, render correctly in a headless browser, and print to A4 cleanly.`;

  try {
    console.log(
      `AI Synthesis initiated with model: ${aiModel || "llama-3.3-70b-versatile"}`,
    );

    let response = await ai.chat.completions.create({
      model: aiModel || "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are an expert professional resume writer. You MUST produce the resume in HTML format. Your JSON response MUST include a non-empty 'html' string field. Do NOT return null.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 6000,
      response_format: { type: "json_object" },
    });

    let content = response.choices[0].message.content;
    let jsonResponse = JSON.parse(content);

    // FALLBACK MECHANISM: If the selected model (e.g. Kimi or Llama 4 Scout) returns null for HTML,
    // we'll automatically try the most powerful/stable model (Llama 3.3 70B) to ensure the user gets their resume.
    if (!jsonResponse || !jsonResponse.html || jsonResponse.html === null) {
      console.warn(
        `Primary model ${aiModel} failed or returned null HTML. Triggering fallback to llama-3.3-70b-versatile...`,
      );

      response = await ai.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are an expert resume writer. You produce ATS-optimized, professionally written resumes that get candidates interviews at top companies. Always output valid JSON with an 'html' field.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.25,
        max_tokens: 6000,
        response_format: { type: "json_object" },
      });

      content = response.choices[0].message.content;
      jsonResponse = JSON.parse(content);
    }

    if (!jsonResponse || !jsonResponse.html) {
      console.error(
        "Critical: Both primary model and fallback failed to generate HTML.",
      );
      throw new Error(
        "AI engine failed to synthesize resume content. Please try again later or with a different resume.",
      );
    }

    console.log("Successfully synthesized resume HTML. Converting to PDF...");
    const pdf = await convertHTMLToPDF(jsonResponse.html);
    return { pdf, html: jsonResponse.html };
  } catch (error) {
    console.error("Error in generateResumePDF service:", error);
    throw error;
  }
}

async function convertHTMLToPDF(htmlContent) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true, // Use true instead of deprecated "new"
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ format: "A4" });
    return pdf;
  } catch (err) {
    console.error("Puppeteer PDF conversion failed:", err);
    throw new Error("Failed to convert resume to PDF. System engine error.");
  } finally {
    if (browser) await browser.close();
  }
}


async function generateProjectIdeas({ skillGaps, jobDescription, aiModel }) {
  const projectIdeasSchema = z.object({
    projects: z
      .array(
        z.object({
          title: z.string().describe("A catchy, portfolio-ready project title"),
          description: z
            .string()
            .describe(
              "2-3 sentence description of what the project does and why it's impressive",
            ),
          techStack: z
            .array(z.string())
            .describe("List of technologies used in this project"),
          skillsCovered: z
            .array(z.string())
            .describe("Which skill gaps this project addresses"),
          difficulty: z
            .enum(["Beginner", "Intermediate", "Advanced"])
            .describe("Project difficulty level"),
          estimatedTime: z
            .string()
            .describe("Estimated time to complete, e.g. '1-2 weeks'"),
          keyFeatures: z
            .array(z.string())
            .describe("3-5 key features to implement"),
          whyItImpresses: z
            .string()
            .describe(
              "Why this project would impress a recruiter or hiring manager",
            ),
        }),
      )
      .describe("2-3 portfolio-ready side project ideas"),
  });

  const prompt = `You are a senior engineering manager and technical hiring lead with 15+ years of experience 
evaluating developer portfolios at top-tier companies. You have rejected thousands of 
"todo app" and "weather widget" projects, and you know exactly what makes a side project 
stand out in a hiring review versus what gets scrolled past in 3 seconds.

Your job: Recommend 2–3 portfolio projects that are GENUINELY impressive, directly close 
the candidate's most critical skill gaps, and are realistically completable in 1–3 weeks 
by a motivated developer. These must be projects you yourself would pause on while 
reviewing a GitHub profile.

=== INPUTS ===

Skill Gaps:
${JSON.stringify(skillGaps, null, 2)}

Target Job Description:
${jobDescription}

=== PRE-ANALYSIS — COMPLETE BEFORE GENERATING PROJECTS ===

Step 1 — Identify the 3–5 most damaging skill gaps (High severity first, then Medium).
Step 2 — Identify the exact tech stack keywords the JD emphasizes most.
Step 3 — For each project idea, verify it closes at least 2 High/Medium gaps AND uses 
          at least 2 JD-emphasized technologies. If not, discard and ideate again.
Step 4 — Rank projects by difficulty: Beginner-Friendly → Intermediate → Advanced.
          Each must be meaningfully harder than the previous.

=== PROJECT GENERATION RULES ===

RULE 1 — NO TOY PROJECTS
Banned concepts (these are instant portfolio killers):
  • Todo apps, note-taking apps, weather apps, calculator apps
  • "Basic CRUD" apps with no real business logic
  • Tutorial clones with a different color scheme
  • Anything described as "simple [X] app"

Every project must solve a REAL problem that a real user or business would care about.
Ask yourself: "Would someone actually use this?" — if not, redesign it.

RULE 2 — INTERVIEW DEMO-ABILITY
Each project must have at least one "wow moment" — a feature the candidate can demo 
live in a 5-minute interview screen share that makes the interviewer lean forward.
Examples of wow moments:
  • A real-time feature that updates without page refresh
  • A dashboard that visualizes complex data in an insightful way
  • An AI/ML feature that produces a visible, non-trivial output
  • A performance benchmark showing measurable optimization
  • A multi-user feature with live collaboration

RULE 3 — GAP COVERAGE IS MANDATORY
Each project MUST directly address at least 2 High or Medium severity skill gaps 
from the provided list. Name the gaps explicitly in skillsCovered.
Do NOT suggest projects that only cover Low severity gaps.

RULE 4 — TECH STACK ALIGNMENT
Use the exact technology names from the job description (e.g., "React.js" not "React",
"PostgreSQL" not "Postgres" if that's what the JD says).
Every item in techStack must appear in either the JD or the skill gaps list.
Do NOT pad the tech stack with trendy tools not relevant to the role.

RULE 5 — PROGRESSIVE DIFFICULTY
Project 1 (Beginner-Friendly): 
  Completable in 5–7 days. Focused scope. 1–2 new technologies.
  Best for: Building foundational confidence with the most critical gap.
  
Project 2 (Intermediate): 
  Completable in 1–2 weeks. Multiple integrated systems. 3–4 technologies.
  Best for: Demonstrating applied, full-stack thinking.
  
Project 3 (Advanced): 
  Completable in 2–3 weeks. Production-grade architecture. 4+ technologies.
  Best for: Differentiating the candidate from other applicants.
  Should include: CI/CD, testing, deployment, or performance optimization.

RULE 6 — SPECIFICITY OVER GENERALITY
Bad title:    "E-commerce Platform"
Good title:   "Multi-Vendor Marketplace with Real-Time Inventory Sync and Stripe Connect Payouts"

Bad feature:  "User authentication"
Good feature: "JWT-based auth with refresh token rotation and device session management"

Bad whyItImpresses: "Shows you can build full-stack apps"
Good whyItImpresses: "Demonstrates understanding of distributed state management and 
                       event-driven architecture — directly mirrors the infrastructure 
                       described in the job description."

=== OUTPUT SCHEMA RULES ===

Each project object MUST contain ALL of these fields — no exceptions, no omissions:

  title (string):
    Specific, descriptive, portfolio-worthy. Not generic. Reads like a real product name.

  description (string, 2–4 sentences):
    What it does, who it's for, and what technical challenge it solves.
    Must convey genuine product thinking, not just technology listing.

  difficulty (string):
    Exactly one of: "Beginner-Friendly" | "Intermediate" | "Advanced"

  estimatedTime (string):
    Realistic for a working developer. Format: "X days" or "X–Y weeks"

  techStack (array of strings):
    3–6 items. Exact names from the JD. No padding.

  skillsCovered (array of strings):
    3–5 items. Must map directly to skill gap names from the input.
    Use the EXACT skill names from the skillGaps input where possible.

  keyFeatures (array of strings, minimum 4 items):
    Specific, technical, demo-able features. Each one should be a complete sentence.
    At least one must be the "wow moment" feature described in Rule 2.
    No vague entries like "user login" or "database integration".

  whyItImpresses (string, 2–3 sentences):
    Written as if you're the hiring manager explaining to your team why this project 
    stands out. Reference the specific role, the skill gaps it closes, and the 
    interview signal it sends. Make it compelling.

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
    messages: [
      {
        role: "system",
        content:
          "You are a senior engineering hiring manager. You suggest impressive, practical portfolio projects that help candidates close their skill gaps. Respond with valid JSON only. NEVER omit any fields from the requested schema.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.4,
    max_tokens: 3000,
    response_format: { type: "json_object" },
  });

  return response.choices[0].message.content;
}

async function validateInputs({
  resume,
  selfDescription,
  jobDescription,
  aiModel,
}) {
  const validationSchema = z.object({
    isValid: z
      .boolean()
      .describe(
        "true ONLY if ALL three inputs are genuinely valid. false if ANY single input is problematic.",
      ),
    reason: z
      .string()
      .describe(
        "If isValid is false, a brief explanation of which field failed and why.",
      ),
  });

  const prompt = `You are a FAIR and CONTEXT-AWARE input validator for an AI interview preparation tool. Your job is to catch genuinely invalid or spam inputs while ALLOWING real user data through — even if it's messy.

=== INPUTS TO VALIDATE ===

FIELD 1 - Resume (extracted from a PDF):
"""
${resume && resume.trim().length > 0 ? resume.substring(0, 2000) : "[EMPTY]"}
"""

FIELD 2 - Self-Description (user typed):
"""
${selfDescription && selfDescription.trim().length > 0 ? selfDescription : "[EMPTY]"}
"""

FIELD 3 - Job Description (user typed):
"""
${jobDescription && jobDescription.trim().length > 0 ? jobDescription : "[EMPTY]"}
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
      messages: [
        {
          role: "system",
          content:
            "You are a fair input validator. Accept any input that looks like a real resume, job description, or professional content — even if messy or poorly formatted. Self-description is optional and can be empty. Only reject clearly spam, gibberish, or harmful content. When in doubt, ACCEPT. Respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.05,
      max_tokens: 200,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log("Validation result:", result);
    return result;
  } catch (e) {
    console.error(
      "Input validation AI call failed, letting it pass by default:",
      e,
    );
    return { isValid: true, reason: "" };
  }
}

async function generateFullReportPDF(reportData) {
  const {
    title,
    matchScore,
    technicalQuestions,
    behavioralQuestions,
    skillGaps,
    preparationPlan,
    projectIdeas,
    aiModel,
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
                <p>AI Agent: ${aiModel || "Primary AI"}</p>
            </div>
            <div class="score-container" style="text-align: right;">
                <div class="score-value">${matchScore}%</div>
                <div style="font-size: 12px; color: #718096; font-weight: 600;">MATCH SCORE</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Critical Skill Gaps</div>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                ${
                  skillGaps
                    ?.map(
                      (gap) => `
                    <div class="card" style="flex: 1; min-width: 200px;">
                        <span class="label">Skill</span>
                        <div class="content"><strong>${gap.skill}</strong></div>
                        <span class="severity severity-${gap.severity?.toLowerCase()}">${gap.severity} Priority</span>
                    </div>
                `,
                    )
                    .join("") || "<p>No skill gaps identified.</p>"
                }
            </div>
        </div>

        <div class="section">
            <div class="section-title">Technical Interview Questions</div>
            ${
              technicalQuestions
                ?.map(
                  (q, i) => `
                <div class="card">
                    <h3>${i + 1}. ${q.question}</h3>
                    <span class="label">Interviewer Intention</span>
                    <div class="content">${q.intention}</div>
                    <span class="label">Model Answer</span>
                    <div class="content">${q.answer}</div>
                </div>
            `,
                )
                .join("") || "<p>No technical questions generated.</p>"
            }
        </div>

        <div class="section">
            <div class="section-title">Behavioral Interview Questions</div>
            ${
              behavioralQuestions
                ?.map(
                  (q, i) => `
                <div class="card">
                    <h3>${i + 1}. ${q.question}</h3>
                    <span class="label">Candidate Story Focus</span>
                    <div class="content">${q.intention}</div>
                    <span class="label">Model Answer (STAR Method)</span>
                    <div class="content">${q.answer}</div>
                </div>
            `,
                )
                .join("") || "<p>No behavioral questions generated.</p>"
            }
        </div>

        <div class="section">
            <div class="section-title">Preparation Battle Plan</div>
            ${
              preparationPlan
                ?.map(
                  (day) => `
                <div class="card">
                    <span class="label">Day ${day.day}</span>
                    <div class="content"><strong>Focus: ${day.focus}</strong></div>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #4a5568;">
                        ${day.tasks?.map((task) => `<li>${task}</li>`).join("")}
                    </ul>
                </div>
            `,
                )
                .join("") || "<p>No plan available.</p>"
            }
        </div>

        ${
          projectIdeas?.length > 0
            ? `
        <div class="section">
            <div class="section-title">Portfolio Project Ideas</div>
            ${projectIdeas
              .map(
                (project) => `
                <div class="card">
                    <h3>${project.title}</h3>
                    <div class="content" style="margin-bottom: 8px;">${project.description}</div>
                    <span class="label">Tech Stack</span>
                    <div style="margin-bottom: 10px;">
                        ${project.techStack?.map((tech) => `<span class="tag">${tech}</span>`).join("")}
                    </div>
                    <span class="label">Key Features</span>
                    <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #4a5568;">
                        ${project.keyFeatures?.map((feat) => `<li>${feat}</li>`).join("")}
                    </ul>
                </div>
            `,
              )
              .join("")}
        </div>
        `
            : ""
        }

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
  generateFullReportPDF,
};
