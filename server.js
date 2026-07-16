const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Database Connection Pool ────────────────────────────────────────────────
const pool = mysql.createPool({
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQLDATABASE || 'anon_forum',
    port: process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Verify DB connection on startup
(async () => {
    try {
        const conn = await pool.getConnection();
        console.log('✅ Connected to MySQL database: anon_forum');
        conn.release();
    } catch (err) {
        console.error('❌ Failed to connect to MySQL:', err.message);
        console.error('   → Make sure XAMPP MySQL is running and database "anon_forum" exists.');
    }
})();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// ─── Page Routes ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'landing.html'));
});

app.get('/category', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'category.html'));
});

// ─── API: GET /api/posts ──────────────────────────────────────────────────────
// Mengambil semua postingan, diurutkan dari yang terbaru
app.get('/api/posts', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM posts ORDER BY created_at DESC'
        );

        // Ambil replies untuk setiap post
        const postsWithReplies = await Promise.all(rows.map(async (post) => {
            const [replies] = await pool.query(
                'SELECT * FROM replies WHERE post_id = ? ORDER BY created_at ASC',
                [post.id]
            );
            return {
                ...post,
                createdAt: post.created_at,   // alias agar front-end tetap kompatibel
                replies: replies.map(r => ({
                    ...r,
                    createdAt: r.created_at
                }))
            };
        }));

        res.json(postsWithReplies);
    } catch (err) {
        console.error('GET /api/posts error:', err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// ─── API: POST /api/posts ─────────────────────────────────────────────────────
// Menyimpan postingan baru ke MySQL
app.post('/api/posts', async (req, res) => {
    const { title, content, category } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO posts (title, content, category, views) VALUES (?, ?, ?, 0)',
            [title, content, category || 'general']
        );

        const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [result.insertId]);
        const newPost = { ...rows[0], createdAt: rows[0].created_at, replies: [] };

        res.status(201).json(newPost);
    } catch (err) {
        console.error('POST /api/posts error:', err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// ─── API: GET /api/posts/:id ──────────────────────────────────────────────────
// Mengambil satu post beserta replies-nya, dan menambah view count
app.get('/api/posts/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        // Tambah view count
        await pool.query('UPDATE posts SET views = views + 1 WHERE id = ?', [postId]);

        const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [postId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const [replies] = await pool.query(
            'SELECT * FROM replies WHERE post_id = ? ORDER BY created_at ASC',
            [postId]
        );

        const post = {
            ...rows[0],
            createdAt: rows[0].created_at,
            replies: replies.map(r => ({ ...r, createdAt: r.created_at }))
        };

        res.json(post);
    } catch (err) {
        console.error('GET /api/posts/:id error:', err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// ─── API: POST /api/posts/:id/replies ────────────────────────────────────────
// Menyimpan balasan baru ke tabel replies
app.post('/api/posts/:id/replies', async (req, res) => {
    const postId = req.params.id;
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Reply content is required' });
    }

    try {
        // Pastikan post-nya ada dulu
        const [post] = await pool.query('SELECT id FROM posts WHERE id = ?', [postId]);
        if (post.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const [result] = await pool.query(
            'INSERT INTO replies (post_id, content) VALUES (?, ?)',
            [postId, content]
        );

        const [rows] = await pool.query('SELECT * FROM replies WHERE id = ?', [result.insertId]);
        const newReply = { ...rows[0], createdAt: rows[0].created_at };

        res.status(201).json(newReply);
    } catch (err) {
        console.error('POST /api/posts/:id/replies error:', err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});