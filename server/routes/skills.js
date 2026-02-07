import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Skill, Category } from '../db/models.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateSkillFromPrompt, validatePromptForGeneration } from '../services/skillGenerator.js';

const router = Router();

// All skills routes require authentication
router.use(authenticateToken);

function sanitizeFilename(name) {
  return name
    .replace(/[^\w\s.-]+/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .substring(0, 80) || 'skill';
}

function buildSkillMarkdown(skill) {
  const frontmatterLines = [
    `name: ${skill.name}`,
    `description: ${skill.description || ''}`
  ];

  if (skill.category) {
    frontmatterLines.push(`category: ${skill.category}`);
  }
  if (skill.tags && skill.tags.length > 0) {
    frontmatterLines.push(`tags: [${skill.tags.join(', ')}]`);
  }

  return `---\n${frontmatterLines.join('\n')}\n---\n\n${skill.content || ''}`.trim();
}

// Rate limit for AI skill generation (per user)
const generateSkillLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  skip: (req) => !!req.user?.isAdmin,
  message: { error: 'Too many skill generations. Please try again later.' }
});

/**
 * POST /api/skills/generate
 * Generate a skill from a structured prompt using AI
 * Returns a preview of the generated skill (not saved)
 */
router.post('/generate', generateSkillLimiter, async (req, res) => {
  try {
    const { persona, task, context, format, references, answer } = req.body;

    // Validate input
    const validation = validatePromptForGeneration({ persona, task, context, answer });
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid prompt for skill generation',
        details: validation.errors
      });
    }

    // Generate skill using AI
    const generatedSkill = await generateSkillFromPrompt({
      persona,
      task,
      context,
      format,
      references,
      answer
    });

    res.json({
      success: true,
      skill: {
        name: generatedSkill.name,
        description: generatedSkill.description,
        content: generatedSkill.content
      },
      source_prompt: {
        persona,
        task,
        context: context || null,
        answer: answer || null
      }
    });
  } catch (err) {
    console.error('Generate skill error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate skill' });
  }
});

/**
 * GET /api/skills
 * List user's skills with optional filters
 * Query params: category, tag, enabled, search, page, limit
 */
router.get('/', async (req, res) => {
  try {
    const { category, tag, enabled, search, page = 1, limit = 50 } = req.query;

    // Build query
    const query = { user: req.user.id };

    if (category) {
      query.category = category;
    }

    if (tag) {
      query.tags = tag;
    }

    if (enabled !== undefined) {
      query.enabled = enabled === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Skill.countDocuments(query);

    const skills = await Skill.find(query)
      .select('-content -source_prompt')  // Exclude large fields in list view
      .sort({ updated_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      skills: skills.map(s => ({
        id: s._id,
        name: s.name,
        description: s.description,
        category: s.category,
        tags: s.tags,
        enabled: s.enabled,
        created_at: s.created_at,
        updated_at: s.updated_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('List skills error:', err);
    res.status(500).json({ error: 'Failed to list skills' });
  }
});

/**
 * POST /api/skills
 * Create a new skill
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, content, category, tags, enabled, source_prompt } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Skill name is required' });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Skill content is required' });
    }

    if (name.length > 100) {
      return res.status(400).json({ error: 'Skill name must be 100 characters or less' });
    }

    if (content.length > 50000) {
      return res.status(400).json({ error: 'Skill content must be 50000 characters or less' });
    }

    // Validate tags if provided
    let cleanTags = [];
    if (tags && Array.isArray(tags)) {
      cleanTags = tags
        .filter(t => typeof t === 'string' && t.trim().length > 0)
        .map(t => t.trim().toLowerCase())
        .slice(0, 10);  // Max 10 tags
    }

    const skill = await Skill.create({
      user: req.user.id,
      name: name.trim(),
      description: description?.trim() || '',
      content: content.trim(),
      category: category?.trim() || null,
      tags: cleanTags,
      enabled: enabled !== false,
      source_prompt: source_prompt || null
    });

    res.status(201).json({
      success: true,
      skill: {
        id: skill._id,
        name: skill.name,
        description: skill.description,
        content: skill.content,
        category: skill.category,
        tags: skill.tags,
        enabled: skill.enabled,
        created_at: skill.created_at,
        updated_at: skill.updated_at
      }
    });
  } catch (err) {
    console.error('Create skill error:', err);
    res.status(500).json({ error: 'Failed to create skill' });
  }
});

/**
 * GET /api/skills/export
 * Export skills as markdown (bundle or per-skill)
 * Query params: enabled=true, bundle=true
 */
router.get('/export', async (req, res) => {
  try {
    const enabledOnly = req.query.enabled === 'true';
    const bundle = req.query.bundle !== 'false';

    const query = { user: req.user.id };
    if (enabledOnly) {
      query.enabled = true;
    }

    const skills = await Skill.find(query).sort({ updated_at: -1 });

    const dateStamp = new Date().toISOString().split('T')[0];
    if (bundle) {
      const content = skills.map(skill => buildSkillMarkdown(skill)).join('\n\n<!-- skill separator -->\n\n');
      return res.json({
        bundle: true,
        filename: `skills_export_${dateStamp}.md`,
        content
      });
    }

    const files = skills.map(skill => {
      const safeName = sanitizeFilename(skill.name || 'skill');
      return {
        filename: `${safeName}.md`,
        content: buildSkillMarkdown(skill)
      };
    });

    res.json({
      bundle: false,
      files
    });
  } catch (err) {
    console.error('Export skills error:', err);
    res.status(500).json({ error: 'Failed to export skills' });
  }
});

/**
 * GET /api/skills/:id
 * Get a single skill with full content
 */
router.get('/:id', async (req, res) => {
  try {
    const skill = await Skill.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    res.json({
      skill: {
        id: skill._id,
        name: skill.name,
        description: skill.description,
        content: skill.content,
        category: skill.category,
        tags: skill.tags,
        enabled: skill.enabled,
        source_prompt: skill.source_prompt,
        created_at: skill.created_at,
        updated_at: skill.updated_at
      }
    });
  } catch (err) {
    console.error('Get skill error:', err);
    res.status(500).json({ error: 'Failed to get skill' });
  }
});

/**
 * PUT /api/skills/:id
 * Update a skill
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, description, content, category, tags, enabled } = req.body;

    const skill = await Skill.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    // Update fields if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Skill name cannot be empty' });
      }
      if (name.length > 100) {
        return res.status(400).json({ error: 'Skill name must be 100 characters or less' });
      }
      skill.name = name.trim();
    }

    if (description !== undefined) {
      skill.description = description?.trim() || '';
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ error: 'Skill content cannot be empty' });
      }
      if (content.length > 50000) {
        return res.status(400).json({ error: 'Skill content must be 50000 characters or less' });
      }
      skill.content = content.trim();
    }

    if (category !== undefined) {
      skill.category = category?.trim() || null;
    }

    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        skill.tags = tags
          .filter(t => typeof t === 'string' && t.trim().length > 0)
          .map(t => t.trim().toLowerCase())
          .slice(0, 10);
      }
    }

    if (enabled !== undefined) {
      skill.enabled = !!enabled;
    }

    await skill.save();

    res.json({
      success: true,
      skill: {
        id: skill._id,
        name: skill.name,
        description: skill.description,
        content: skill.content,
        category: skill.category,
        tags: skill.tags,
        enabled: skill.enabled,
        created_at: skill.created_at,
        updated_at: skill.updated_at
      }
    });
  } catch (err) {
    console.error('Update skill error:', err);
    res.status(500).json({ error: 'Failed to update skill' });
  }
});

/**
 * DELETE /api/skills/:id
 * Delete a skill
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await Skill.deleteOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    res.json({ success: true, message: 'Skill deleted' });
  } catch (err) {
    console.error('Delete skill error:', err);
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

/**
 * PATCH /api/skills/:id/toggle
 * Toggle a skill's enabled status
 */
router.patch('/:id/toggle', async (req, res) => {
  try {
    const skill = await Skill.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    skill.enabled = !skill.enabled;
    await skill.save();

    res.json({
      success: true,
      enabled: skill.enabled
    });
  } catch (err) {
    console.error('Toggle skill error:', err);
    res.status(500).json({ error: 'Failed to toggle skill' });
  }
});

/**
 * GET /api/skills/categories/list
 * List user's categories
 */
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Category.find({ user: req.user.id })
      .sort({ name: 1 });

    // Also get categories from skills (for uncategorized ones)
    const skillCategories = await Skill.distinct('category', {
      user: req.user.id,
      category: { $ne: null }
    });

    // Merge and deduplicate
    const allCategories = new Set([
      ...categories.map(c => c.name),
      ...skillCategories
    ]);

    res.json({
      categories: categories.map(c => ({
        id: c._id,
        name: c.name,
        color: c.color,
        icon: c.icon
      })),
      all_category_names: Array.from(allCategories).sort()
    });
  } catch (err) {
    console.error('List categories error:', err);
    res.status(500).json({ error: 'Failed to list categories' });
  }
});

/**
 * POST /api/skills/categories
 * Create a new category
 */
router.post('/categories', async (req, res) => {
  try {
    const { name, color, icon } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    if (name.length > 50) {
      return res.status(400).json({ error: 'Category name must be 50 characters or less' });
    }

    // Check for duplicate
    const existing = await Category.findOne({
      user: req.user.id,
      name: name.trim()
    });

    if (existing) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const category = await Category.create({
      user: req.user.id,
      name: name.trim(),
      color: color || '#6366f1',
      icon: icon || null
    });

    res.status(201).json({
      success: true,
      category: {
        id: category._id,
        name: category.name,
        color: category.color,
        icon: category.icon
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Category already exists' });
    }
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

/**
 * DELETE /api/skills/categories/:id
 * Delete a category (skills using it will have category set to null)
 */
router.delete('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Remove category from all skills using it
    await Skill.updateMany(
      { user: req.user.id, category: category.name },
      { $set: { category: null } }
    );

    await Category.deleteOne({ _id: category._id });

    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

/**
 * GET /api/skills/tags/list
 * List all unique tags used by user's skills
 */
router.get('/tags/list', async (req, res) => {
  try {
    const tags = await Skill.distinct('tags', { user: req.user.id });

    res.json({
      tags: tags.sort()
    });
  } catch (err) {
    console.error('List tags error:', err);
    res.status(500).json({ error: 'Failed to list tags' });
  }
});

/**
 * GET /api/skills/enabled
 * Get all enabled skills with full content (for prompt building)
 */
router.get('/enabled/list', async (req, res) => {
  try {
    const skills = await Skill.find({
      user: req.user.id,
      enabled: true
    }).select('name description content');

    res.json({
      skills: skills.map(s => ({
        id: s._id,
        name: s.name,
        description: s.description,
        content: s.content
      }))
    });
  } catch (err) {
    console.error('Get enabled skills error:', err);
    res.status(500).json({ error: 'Failed to get enabled skills' });
  }
});

export default router;
