import { generateCompletion } from '../services/groqService.js';

export const handleResumeReview = async (req, res, next) => {
    try {
        const { targetRole = "Software Engineer", message, history = [] } = req.body;
        
        const content = message || req.body.resumeText || "";
        
        const systemPrompt = "You are a university career advisor. Review the user's resume details for structure, ATS optimization, and impact metrics. Provide clear, actionable recommendations in markdown format. " +
            "You are a career coaching assistant for a university alumni platform, focused exclusively on resume feedback, interview preparation, career guidance, and skill development. If the user asks about anything unrelated to their education, career, or professional development (e.g., entertainment, general trivia, unrelated topics), politely decline to answer and redirect them back to career-related topics — for example: 'That\\'s outside what I can help with, but I\\'d love to help you with your resume, interview prep, or career skills instead — what would you like to work on?' Do not answer off-topic questions even if you know the answer. " +
            "IMPORTANT: If the user's message is a simple greeting or general introduction (e.g. 'hi', 'hello', 'hey', 'good morning'), do not assume a target role (like 'Software Engineer') or present detailed roadmaps/questions. Instead, respond with a friendly greeting, ask what career goals or roles they are interested in, and ask what area they want to work on (resume review, mock interviews, or skill roadmap) so you can tailor your response.";
        
        const formattedMessages = [
            ...history.map(h => ({ 
                role: h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user', 
                content: h.text || h.content 
            })),
            { role: 'user', content }
        ];

        const reply = await generateCompletion({
            systemPrompt,
            messages: formattedMessages
        });

        res.status(200).json({
            success: true,
            data: { reply }
        });
    } catch (err) {
        next(err);
    }
};

export const handleInterviewPrep = async (req, res, next) => {
    try {
        const { targetRole = "Software Engineer", message, history = [] } = req.body;
        const content = message || "";

        const systemPrompt = `You are a mock interview coach. Tailor your questions and review to the target role: "${targetRole}". Ask targeted questions, and provide constructive feedback on answer structure (e.g., STAR method). Format in markdown. ` +
            "You are a career coaching assistant for a university alumni platform, focused exclusively on resume feedback, interview preparation, career guidance, and skill development. If the user asks about anything unrelated to their education, career, or professional development (e.g., entertainment, general trivia, unrelated topics), politely decline to answer and redirect them back to career-related topics — for example: 'That\\'s outside what I can help with, but I\\'d love to help you with your resume, interview prep, or career skills instead — what would you like to work on?' Do not answer off-topic questions even if you know the answer. " +
            "IMPORTANT: If the user's message is a simple greeting or general introduction (e.g. 'hi', 'hello', 'hey', 'good morning'), do not assume a target role (like 'Software Engineer') or present detailed roadmaps/questions. Instead, respond with a friendly greeting, ask what career goals or roles they are interested in, and ask what area they want to work on (resume review, mock interviews, or skill roadmap) so you can tailor your response.";

        const formattedMessages = [
            ...history.map(h => ({ 
                role: h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user', 
                content: h.text || h.content 
            })),
            { role: 'user', content }
        ];

        const reply = await generateCompletion({
            systemPrompt,
            messages: formattedMessages
        });

        res.status(200).json({
            success: true,
            data: { reply }
        });
    } catch (err) {
        next(err);
    }
};

export const handleSkillGapAnalysis = async (req, res, next) => {
    try {
        const { targetRole = "Software Engineer", message, history = [] } = req.body;
        
        let content = message || "";
        if (!content && req.body.currentSkills) {
            content = `Current Skills: ${req.body.currentSkills.join(', ')}. Target Job: ${req.body.targetJob || targetRole}.`;
        }

        const systemPrompt = `You are a skill-gap analyst. Compare the user's current skills against the target role: "${targetRole || req.body.targetJob || 'Software Engineer'}". Produce a structured roadmap, missing technical/soft skills, project suggestions, and cert recommendations. Format in markdown. ` +
            "You are a career coaching assistant for a university alumni platform, focused exclusively on resume feedback, interview preparation, career guidance, and skill development. If the user asks about anything unrelated to their education, career, or professional development (e.g., entertainment, general trivia, unrelated topics), politely decline to answer and redirect them back to career-related topics — for example: 'That\\'s outside what I can help with, but I\\'d love to help you with your resume, interview prep, or career skills instead — what would you like to work on?' Do not answer off-topic questions even if you know the answer. " +
            "IMPORTANT: If the user's message is a simple greeting or general introduction (e.g. 'hi', 'hello', 'hey', 'good morning'), do not assume a target role (like 'Software Engineer') or present detailed roadmaps/questions. Instead, respond with a friendly greeting, ask what career goals or roles they are interested in, and ask what area they want to work on (resume review, mock interviews, or skill roadmap) so you can tailor your response.";

        const formattedMessages = [
            ...history.map(h => ({ 
                role: h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user', 
                content: h.text || h.content 
            })),
            { role: 'user', content }
        ];

        const reply = await generateCompletion({
            systemPrompt,
            messages: formattedMessages
        });

        res.status(200).json({
            success: true,
            data: { reply }
        });
    } catch (err) {
        next(err);
    }
};

