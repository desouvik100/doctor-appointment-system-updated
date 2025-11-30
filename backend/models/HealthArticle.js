const mongoose = require('mongoose');

const healthArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    maxlength: 300
  },
  category: {
    type: String,
    enum: ['general_health', 'nutrition', 'fitness', 'mental_health', 'diseases', 'prevention', 'lifestyle', 'news'],
    required: true
  },
  tags: [String],
  coverImage: String,
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  authorName: String,
  authorCredentials: String,
  readTime: {
    type: Number, // minutes
    default: 5
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  isFeatured: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Generate slug from title
healthArticleSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

healthArticleSchema.index({ category: 1, publishedAt: -1 });
healthArticleSchema.index({ tags: 1 });

module.exports = mongoose.model('HealthArticle', healthArticleSchema);
