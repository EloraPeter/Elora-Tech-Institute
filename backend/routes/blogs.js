const express = require('express');
const pool = require('../db');
const { authenticateJWT } = require('../auth');
const upload = require('../middleware/multer');
const slugify = require('slugify');

const router = express.Router();

// Upload media
router.post('/upload', authenticateJWT, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
});

// Get all blogs (public, with pagination)
router.get('/', async (req, res) => {
    const { page = 1, limit = 10, category, tag, search } = req.query;
    const offset = (page - 1) * limit;
    let query = 'SELECT id, title, slug, author_id, category, tags, image_url, created_at FROM blogs WHERE is_draft = FALSE';
    let countQuery = 'SELECT COUNT(*) FROM blogs WHERE is_draft = FALSE';
    const params = [];
    let countParams = [];

    if (category) {
        query += ' AND category = $' + (params.length + 1);
        countQuery += ' AND category = $' + (countParams.length + 1);
        params.push(category);
        countParams.push(category);
    }
    if (tag) {
        query += ' AND $' + (params.length + 1) + ' = ANY(tags)';
        countQuery += ' AND $' + (countParams.length + 1) + '= ANY(tags)';
        params.push(tag);
        countParams.push(tag);
    }
    if (search) {
        query += ' AND (title ILIKE $' + (params.length + 1) + ' OR content ILIKE $' + (params.length + 1) + ')';
        countQuery += ' AND (title ILIKE $' + (countParams.length + 1) + ' OR content ILIKE $' + (countParams.length + 1) + ')';
        params.push(`%${search}%`);
        countParams.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    try {
        const [blogsResult, countResult] = await Promise.all([
            pool.query(query, params),
            pool.query(countQuery, countParams)
        ]);
        const total = parseInt(countResult.rows[0].count);
        res.json({
            blogs: blogsResult.rows,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error('Error fetching blogs:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single blog by slug (public)
router.get('/:slug', async (req, res) => {
    const { slug } = req.params;
    try {
        const result = await pool.query(
            'SELECT b.*, u.name AS author_name FROM blogs b LEFT JOIN users u ON b.author_id = u.id WHERE b.slug = $1 AND b.is_draft = FALSE',
            [slug]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Blog not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching blog:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create blog (admin only)
router.post('/', authenticateJWT, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    const { title, content, category, tags, image_url, video_url, is_featured, is_draft } = req.body;
    let slug = slugify(title, { lower: true, strict: true });
    try {
        // Check for existing slug
        let slugExists = true;
        let counter = 1;
        let newSlug = slug;
        while (slugExists) {
            const { rows } = await db.query('SELECT id FROM blogs WHERE slug = $1', [newSlug]);
            if (rows.length === 0) {
                slugExists = false;
            } else {
                newSlug = `${slug}-${counter}`;
                counter++;
            }
        }
        slug = newSlug;

        const { rows } = await db.query(
            `INSERT INTO blogs (title, slug, content, author_id, category, tags, image_url, video_url, is_featured, is_draft)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [title, slug, content, req.user.id, category, tags || [], image_url, video_url, is_featured || false, is_draft || false]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error creating blog:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update blog (admin only)
router.put('/:id', authenticateJWT, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    const { id } = req.params;
    const { title, content, category, tags, image_url, video_url, is_featured, is_draft } = req.body;
    const slug = slugify(title, { lower: true, strict: true });
    try {
        if (is_featured) {
            await pool.query('UPDATE blogs SET is_featured = FALSE WHERE is_featured = TRUE');
        }
        const result = await pool.query(
            'UPDATE blogs SET title = $1, slug = $2, content = $3, category = $4, tags = $5, image_url = $6, video_url = $7, is_featured = $8, is_draft = $9 WHERE id = $10 RETURNING *',
            [title, slug, content, category, tags, image_url, video_url, is_featured, is_draft, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Blog not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating blog:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete blog (admin only)
router.delete('/:id', authenticateJWT, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM blogs WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Blog not found' });
        }
        res.json({ message: 'Blog deleted', blog: result.rows[0] });
    } catch (err) {
        console.error('Error deleting blog:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;