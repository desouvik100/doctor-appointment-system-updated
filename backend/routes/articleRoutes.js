const express = require('express');
const router = express.Router();
const HealthArticle = require('../models/HealthArticle');

// Get all published articles
router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 10, featured } = req.query;
    const query = { isPublished: true };
    
    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;

    const articles = await HealthArticle.find(query)
      .select('title slug excerpt category coverImage authorName readTime views likes publishedAt')
      .sort({ publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await HealthArticle.countDocuments(query);

    res.json({
      articles,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get article by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const article = await HealthArticle.findOneAndUpdate(
      { slug: req.params.slug, isPublished: true },
      { $inc: { views: 1 } },
      { new: true }
    ).populate('authorId', 'name specialization profilePhoto');

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    res.json(article);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get categories with count
router.get('/categories', async (req, res) => {
  try {
    const categories = await HealthArticle.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create article (admin/doctor)
router.post('/', async (req, res) => {
  try {
    const article = new HealthArticle(req.body);
    if (req.body.isPublished) {
      article.publishedAt = new Date();
    }
    await article.save();
    res.status(201).json({ message: 'Article created', article });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update article
router.put('/:id', async (req, res) => {
  try {
    const article = await HealthArticle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    res.json({ message: 'Article updated', article });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Like article
router.post('/:id/like', async (req, res) => {
  try {
    const article = await HealthArticle.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    res.json({ likes: article.likes });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search articles
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    const articles = await HealthArticle.find({
      isPublished: true,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    }).select('title slug excerpt category coverImage').limit(10);
    
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
