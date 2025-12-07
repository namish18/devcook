import { Router, Response } from 'express';
import { Submission } from '../models/Submission';
import { Problem } from '../models/Problem';
import { AuthRequest, authenticate } from '../middleware/auth';
import { submissionLimiter } from '../middleware/rateLimiter';
import { addSubmissionJob } from '../queues/submissionQueue';
import { logger } from '../utils/logger';

const router = Router();

// Submit code
router.post('/', authenticate, submissionLimiter, async (req: AuthRequest, res: Response) => {
    try {
        const { problemId, language, code } = req.body;

        if (!problemId || !language || !code) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Verify problem exists
        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        // Verify language is allowed
        if (!problem.allowedLanguages.includes(language as any)) {
            return res.status(400).json({ error: 'Language not allowed for this problem' });
        }

        // Create submission
        const submission = new Submission({
            userId: req.userId,
            problemId,
            language,
            code,
            totalTests: problem.testcases.length,
        });

        await submission.save();

        // Add to evaluation queue
        await addSubmissionJob(
            submission._id.toString(),
            req.userId!,
            problemId
        );

        res.status(201).json({
            submissionId: submission._id,
            status: submission.status,
        });
    } catch (error) {
        logger.error('Submit code error:', error);
        res.status(500).json({ error: 'Failed to submit code' });
    }
});

// Get submission by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const submission = await Submission.findById(id)
            .populate('problemId', 'title slug')
            .lean();

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        // Users can only see their own submissions (unless admin)
        if (
            submission.userId.toString() !== req.userId &&
            req.user?.role !== 'ADMIN'
        ) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(submission);
    } catch (error) {
        logger.error('Get submission error:', error);
        res.status(500).json({ error: 'Failed to fetch submission' });
    }
});

// Get user's submissions
router.get('/user/:userId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const { page = '1', limit = '20', problemId } = req.query;

        // Users can only see their own submissions (unless admin)
        if (userId !== req.userId && req.user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        const query: any = { userId };
        if (problemId) {
            query.problemId = problemId;
        }

        const [submissions, total] = await Promise.all([
            Submission.find(query)
                .populate('problemId', 'title slug difficulty')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .select('-code') // Don't include code in list view
                .lean(),
            Submission.countDocuments(query),
        ]);

        res.json({
            submissions,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        logger.error('Get user submissions error:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

// Quick debug run (not a full submission)
router.post('/run-debug', authenticate, submissionLimiter, async (req: AuthRequest, res: Response) => {
    try {
        const { problemId, language, code, customInput } = req.body;

        if (!problemId || !language || !code) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // For quick debug, we'll create a lightweight execution
        // This should use a simpler runner without full testcase evaluation
        // For now, return a placeholder
        res.json({
            message: 'Debug run feature - to be fully implemented with lightweight runner',
            stdout: '',
            stderr: '',
        });
    } catch (error) {
        logger.error('Debug run error:', error);
        res.status(500).json({ error: 'Failed to run debug' });
    }
});

export default router;
