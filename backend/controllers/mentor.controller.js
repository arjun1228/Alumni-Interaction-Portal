import { z } from 'zod';
import { analyzeResume, generateMockInterview, analyzeSkillGap } from '../services/geminiService.js';

const resumeSchema = z.object({
    resumeText: z.string().min(1, 'Resume text is required')
});

const interviewSchema = z.object({
    role: z.string().min(1, 'Target role is required'),
    skills: z.array(z.string()).min(1, 'At least one skill is required')
});

const skillsSchema = z.object({
    currentSkills: z.array(z.string()).min(1, 'At least one current skill is required'),
    targetJob: z.string().min(1, 'Target job title is required')
});

export const handleResumeReview = async (req, res, next) => {
    try {
        const parsed = resumeSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const { resumeText } = parsed.data;
        const feedback = await analyzeResume(resumeText);

        res.status(200).json({
            success: true,
            data: { feedback }
        });
    } catch (err) {
        next(err);
    }
};

export const handleInterviewPrep = async (req, res, next) => {
    try {
        const parsed = interviewSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const { role, skills } = parsed.data;
        const questions = await generateMockInterview(role, skills);

        res.status(200).json({
            success: true,
            data: { questions }
        });
    } catch (err) {
        next(err);
    }
};

export const handleSkillGapAnalysis = async (req, res, next) => {
    try {
        const parsed = skillsSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const { currentSkills, targetJob } = parsed.data;
        const gapAnalysis = await analyzeSkillGap(currentSkills, targetJob);

        res.status(200).json({
            success: true,
            data: { gapAnalysis }
        });
    } catch (err) {
        next(err);
    }
};
