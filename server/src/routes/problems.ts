import { Router } from 'express';
import { Problem } from '../models/Problem';
import { AuthRequest, optionalAuth, authenticate, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Get all problems with filtering and pagination
router.get('/', optionalAuth, async (req: AuthRequest, res) => {
    try {
        const {
            page = '1',
            limit = '20',
            domain,
            difficulty,
            tags,
            language,
            sort = 'createdAt',
            order = 'desc',
            search,
        } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        // Build query
        const query: any = {};

        if (domain) {
            query.domain = domain;
        }

        if (difficulty) {
            query.difficulty = difficulty;
        }

        if (tags) {
            const tagArray = (tags as string).split(',');
            query.tags = { $in: tagArray };
        }

        if (language) {
            query.allowedLanguages = language;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        // Build sort
        const sortField = sort as string;
        const sortOrder = order === 'asc' ? 1 : -1;
        const sortObj: any = { [sortField]: sortOrder };

        // Execute query
        const [problems, total] = await Promise.all([
            Problem.find(query)
                .select('-testcases -createdBy') // Exclude testcases and createdBy for list view
                .sort(sortObj)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Problem.countDocuments(query),
        ]);

        res.json({
            problems,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        logger.error('Get problems error:', error);
        res.status(500).json({ error: 'Failed to fetch problems' });
    }
});

// Get problem by slug
router.get('/:slug', optionalAuth, async (req: AuthRequest, res) => {
    try {
        const { slug } = req.params;

        const problem = await Problem.findOne({ slug }).lean();

        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        // For non-admin users, filter out hidden testcases
        if (!req.user || req.user.role !== 'ADMIN') {
            problem.testcases = problem.testcases.filter((tc: any) => tc.isPublic);

            // Remove expected output for hidden testcases (extra security)
            problem.testcases = problem.testcases.map((tc: any) => ({
                ...tc,
                expectedOutput: undefined, // Don't expose expected output to users
            }));
        }

        res.json(problem);
    } catch (error) {
        logger.error('Get problem error:', error);
        res.status(500).json({ error: 'Failed to fetch problem' });
    }
});

// Get public testcases
router.get('/:id/testcases/public', async (req, res) => {
    try {
        const { id } = req.params;

        const problem = await Problem.findById(id).select('testcases').lean();

        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        const publicTestcases = problem.testcases
            .filter((tc: any) => tc.isPublic)
            .map((tc: any) => ({
                id: tc.id,
                input: tc.input,
                // Don't expose expected output - users shouldn't see it
            }));

        res.json({ testcases: publicTestcases });
    } catch (error) {
        logger.error('Get testcases error:', error);
        res.status(500).json({ error: 'Failed to fetch testcases' });
    }
});

// Create problem (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
        const problemData = req.body;
        problemData.createdBy = req.userId;

        const problem = new Problem(problemData);
        await problem.save();

        res.status(201).json(problem);
    } catch (error) {
        logger.error('Create problem error:', error);
        res.status(500).json({ error: 'Failed to create problem' });
    }
});

// Update problem (admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const problem = await Problem.findByIdAndUpdate(id, updates, { new: true });

        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        res.json(problem);
    } catch (error) {
        logger.error('Update problem error:', error);
        res.status(500).json({ error: 'Failed to update problem' });
    }
});

// Delete problem (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const problem = await Problem.findByIdAndDelete(id);

        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        res.json({ message: 'Problem deleted' });
    } catch (error) {
        logger.error('Delete problem error:', error);
        res.status(500).json({ error: 'Failed to delete problem' });
    }
});

export default router;
