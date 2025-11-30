import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import './HealthTips.css';

const CATEGORIES = [
  { id: '', label: 'All', icon: 'fas fa-th-large' },
  { id: 'general_health', label: 'General Health', icon: 'fas fa-heartbeat' },
  { id: 'nutrition', label: 'Nutrition', icon: 'fas fa-apple-alt' },
  { id: 'fitness', label: 'Fitness', icon: 'fas fa-running' },
  { id: 'mental_health', label: 'Mental Health', icon: 'fas fa-brain' },
  { id: 'diseases', label: 'Diseases', icon: 'fas fa-virus' },
  { id: 'prevention', label: 'Prevention', icon: 'fas fa-shield-alt' },
  { id: 'lifestyle', label: 'Lifestyle', icon: 'fas fa-spa' }
];

const HealthTips = () => {
  const [articles, setArticles] = useState([]);
  const [featuredArticle, setFeaturedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [likedArticles, setLikedArticles] = useState([]);

  useEffect(() => {
    fetchArticles();
    fetchFeatured();
  }, [selectedCategory]);

  useEffect(() => {
    if (searchQuery.length >= 3) {
      searchArticles();
    } else if (searchQuery.length === 0) {
      fetchArticles();
    }
  }, [searchQuery]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '20' });
      if (selectedCategory) params.append('category', selectedCategory);
      
      const response = await axios.get(`/api/articles?${params}`);
      setArticles(response.data.articles || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      // Show sample articles if API fails
      setArticles(getSampleArticles());
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatured = async () => {
    try {
      const response = await axios.get('/api/articles?featured=true&limit=1');
      if (response.data.articles?.length > 0) {
        setFeaturedArticle(response.data.articles[0]);
      }
    } catch (error) {
      console.error('Error fetching featured:', error);
    }
  };

  const searchArticles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/articles/search?q=${searchQuery}`);
      setArticles(response.data || []);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const openArticle = async (article) => {
    try {
      const response = await axios.get(`/api/articles/slug/${article.slug}`);
      setSelectedArticle(response.data);
    } catch (error) {
      // Use the article data we have
      setSelectedArticle(article);
    }
  };

  const likeArticle = async (articleId) => {
    // Optimistically update UI first
    setLikedArticles([...likedArticles, articleId]);
    if (selectedArticle?._id === articleId) {
      setSelectedArticle({ ...selectedArticle, likes: (selectedArticle.likes || 0) + 1 });
    }
    toast.success('Article liked!');
    
    try {
      await axios.post(`/api/articles/${articleId}/like`);
    } catch (error) {
      console.error('Error liking article:', error);
      // Keep the UI updated even if API fails (for demo)
    }
  };

  const getCategoryLabel = (categoryId) => {
    const cat = CATEGORIES.find(c => c.id === categoryId);
    return cat?.label || categoryId?.replace('_', ' ') || 'General';
  };

  const getSampleArticles = () => [
    {
      _id: '1',
      title: '10 Tips for a Healthy Heart',
      slug: 'healthy-heart-tips',
      excerpt: 'Learn simple lifestyle changes that can significantly improve your cardiovascular health.',
      category: 'general_health',
      authorName: 'Dr. Sharma',
      readTime: 5,
      views: 1250,
      likes: 89
    },
    {
      _id: '2',
      title: 'The Importance of Mental Health',
      slug: 'mental-health-importance',
      excerpt: 'Understanding why mental health is just as important as physical health.',
      category: 'mental_health',
      authorName: 'Dr. Patel',
      readTime: 7,
      views: 980,
      likes: 156
    },
    {
      _id: '3',
      title: 'Balanced Diet for Better Living',
      slug: 'balanced-diet-guide',
      excerpt: 'A comprehensive guide to maintaining a balanced diet for optimal health.',
      category: 'nutrition',
      authorName: 'Dr. Gupta',
      readTime: 6,
      views: 2100,
      likes: 234
    },
    {
      _id: '4',
      title: 'Exercise Routines for Beginners',
      slug: 'beginner-exercise-routines',
      excerpt: 'Start your fitness journey with these easy-to-follow exercise routines.',
      category: 'fitness',
      authorName: 'Dr. Singh',
      readTime: 8,
      views: 1560,
      likes: 178
    },
    {
      _id: '5',
      title: 'Preventing Common Diseases',
      slug: 'disease-prevention-tips',
      excerpt: 'Simple preventive measures to protect yourself from common illnesses.',
      category: 'prevention',
      authorName: 'Dr. Kumar',
      readTime: 5,
      views: 890,
      likes: 67
    },
    {
      _id: '6',
      title: 'Stress Management Techniques',
      slug: 'stress-management',
      excerpt: 'Effective techniques to manage stress and improve your quality of life.',
      category: 'lifestyle',
      authorName: 'Dr. Reddy',
      readTime: 6,
      views: 1340,
      likes: 145
    }
  ];

  return (
    <div className="health-tips">
      <div className="health-tips__header">
        <h2 className="health-tips__title">
          <div className="health-tips__title-icon">
            <i className="fas fa-lightbulb"></i>
          </div>
          Health Tips & Articles
        </h2>
        <div className="health-tips__search">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="health-tips__categories">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`health-tips__category ${selectedCategory === cat.id ? 'health-tips__category--active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <i className={cat.icon}></i> {cat.label}
          </button>
        ))}
      </div>

      {featuredArticle && !selectedCategory && !searchQuery && (
        <div className="health-tips__featured">
          <h3 className="health-tips__section-title">
            <i className="fas fa-star"></i> Featured Article
          </h3>
          <div 
            className="health-tips__featured-card"
            onClick={() => openArticle(featuredArticle)}
          >
            <div 
              className="health-tips__featured-image"
              style={{ backgroundImage: featuredArticle.coverImage ? `url(${featuredArticle.coverImage})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            />
            <div className="health-tips__featured-content">
              <span className="health-tips__featured-badge">
                <i className="fas fa-fire"></i> Featured
              </span>
              <h3 className="health-tips__featured-title">{featuredArticle.title}</h3>
              <p className="health-tips__featured-excerpt">{featuredArticle.excerpt}</p>
              <div className="health-tips__featured-meta">
                <span><i className="fas fa-user-md"></i> {featuredArticle.authorName}</span>
                <span><i className="fas fa-clock"></i> {featuredArticle.readTime} min read</span>
                <span><i className="fas fa-eye"></i> {featuredArticle.views} views</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="health-tips__loading">
          <div className="health-tips__spinner"></div>
          <p>Loading articles...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="health-tips__empty">
          <i className="fas fa-newspaper"></i>
          <p>No articles found</p>
        </div>
      ) : (
        <div className="health-tips__grid">
          {articles.map(article => (
            <div 
              key={article._id} 
              className="health-tips__card"
              onClick={() => openArticle(article)}
            >
              <div 
                className="health-tips__card-image"
                style={{ backgroundImage: article.coverImage ? `url(${article.coverImage})` : undefined }}
              >
                {!article.coverImage && <i className="fas fa-newspaper"></i>}
              </div>
              <div className="health-tips__card-content">
                <span className="health-tips__card-category">
                  {getCategoryLabel(article.category)}
                </span>
                <h4 className="health-tips__card-title">{article.title}</h4>
                <p className="health-tips__card-excerpt">{article.excerpt}</p>
                <div className="health-tips__card-footer">
                  <span className="health-tips__card-author">
                    <i className="fas fa-user-md"></i> {article.authorName || 'HealthSync'}
                  </span>
                  <div className="health-tips__card-stats">
                    <span><i className="fas fa-clock"></i> {article.readTime || 5}m</span>
                    <span><i className="fas fa-heart"></i> {article.likes || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="health-tips__modal" onClick={() => setSelectedArticle(null)}>
          <div className="health-tips__modal-content" onClick={e => e.stopPropagation()}>
            <div className="health-tips__modal-header">
              <span className="health-tips__card-category">
                {getCategoryLabel(selectedArticle.category)}
              </span>
              <button 
                className="health-tips__modal-close"
                onClick={() => setSelectedArticle(null)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="health-tips__modal-body">
              <h2 className="health-tips__article-title">{selectedArticle.title}</h2>
              <div className="health-tips__article-meta">
                <span><i className="fas fa-user-md"></i> {selectedArticle.authorName || 'HealthSync Team'}</span>
                <span><i className="fas fa-clock"></i> {selectedArticle.readTime || 5} min read</span>
                <span><i className="fas fa-eye"></i> {selectedArticle.views || 0} views</span>
                <span><i className="fas fa-heart"></i> {selectedArticle.likes || 0} likes</span>
              </div>
              <div className="health-tips__article-content">
                {selectedArticle.content || selectedArticle.excerpt || 'Full article content will be displayed here.'}
              </div>
              <div className="health-tips__article-actions">
                <button 
                  className={`health-tips__like-btn ${likedArticles.includes(selectedArticle._id) ? 'health-tips__like-btn--liked' : ''}`}
                  onClick={() => likeArticle(selectedArticle._id)}
                  disabled={likedArticles.includes(selectedArticle._id)}
                >
                  <i className="fas fa-heart"></i>
                  {likedArticles.includes(selectedArticle._id) ? 'Liked' : 'Like this article'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthTips;
