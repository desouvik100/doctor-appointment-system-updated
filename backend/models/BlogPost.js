const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  excerpt: String,
  featuredImage: String,
  author: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    name: String,
    avatar: String,
    designation: String
  },
  category: {
    type: String,
    enum: ['health-tips', 'nutrition', 'fitness', 'mental-health', 'diseases', 'treatments', 'news', 'lifestyle'],
    required: true
  },
  tags: [String],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: Date,
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  engagement: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    comments: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      userName: String,
      content: String,
      createdAt: { type: Date, default: Date.now }
    }]
  },
  relatedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost' }],
  readTime: Number
}, { timestamps: true });

// Generate slug from title
blogPostSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  // Calculate read time (avg 200 words per minute)
  if (this.content) {
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.ceil(wordCount / 200);
  }
  next();
});

module.exports = mongoose.model('BlogPost', blogPostSchema);
