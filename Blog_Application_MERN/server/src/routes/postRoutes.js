const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Please upload a JPG, PNG, WEBP, or GIF image.'));
  }
});
const validatePost = [
  body('title').trim().isLength({ min: 3, max: 140 }).withMessage('Title must be 3–140 characters.'),
  body('content').custom(v => typeof v === 'string' && v.replace(/<[^>]*>/g, '').trim().length >= 5).withMessage('Blog content must contain at least 5 characters.')
];
const checkErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
};
const publicPost = p => ({
  id: p._id, title: p.title, content: p.content, coverImage: p.coverImage,
  author: p.author ? { id: p.author._id, name: p.author.name } : null,
  createdAt: p.createdAt, updatedAt: p.updatedAt
});

// Public feed and search
router.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim().slice(0, 100);
    const filter = q ? { $or: [{ title: { $regex: q, $options: 'i' } }, { content: { $regex: q, $options: 'i' } }] } : {};
    const posts = await Post.find(filter).populate('author', 'name').sort({ createdAt: -1 }).limit(100);
    res.json({ posts: posts.map(publicPost) });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'name');
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    res.json({ post: publicPost(post) });
  } catch (e) { next(e); }
});

router.post('/', auth, upload.single('coverImage'), validatePost, checkErrors, async (req, res, next) => {
  try {
    const post = await Post.create({
      title: req.body.title.trim(),
      content: req.body.content,
      coverImage: req.file ? `/uploads/${req.file.filename}` : '',
      author: req.user._id
    });
    await post.populate('author', 'name');
    res.status(201).json({ post: publicPost(post) });
  } catch (e) { next(e); }
});

router.put('/:id', auth, upload.single('coverImage'), validatePost, checkErrors, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    if (String(post.author) !== String(req.user._id)) return res.status(403).json({ message: 'You can only edit your own posts.' });
    post.title = req.body.title.trim();
    post.content = req.body.content;
    if (req.file) {
      if (post.coverImage) {
        const oldPath = path.join(__dirname, '../..', post.coverImage.replace(/^\//, ''));
        if (fs.existsSync(oldPath)) fs.unlink(oldPath, () => {});
      }
      post.coverImage = `/uploads/${req.file.filename}`;
    }
    await post.save();
    await post.populate('author', 'name');
    res.json({ post: publicPost(post) });
  } catch (e) { next(e); }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    if (String(post.author) !== String(req.user._id)) return res.status(403).json({ message: 'You can only delete your own posts.' });
    if (post.coverImage) {
      const oldPath = path.join(__dirname, '../..', post.coverImage.replace(/^\//, ''));
      if (fs.existsSync(oldPath)) fs.unlink(oldPath, () => {});
    }
    await post.deleteOne();
    res.json({ message: 'Post deleted.' });
  } catch (e) { next(e); }
});
module.exports = router;
