import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

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

  useEffect(() => { fetchArticles(); fetchFeatured(); }, [selectedCategory]);
  useEffect(() => { if (searchQuery.length >= 3) searchArticles(); else if (searchQuery.length === 0) fetchArticles(); }, [searchQuery]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '20' });
      if (selectedCategory) params.append('category', selectedCategory);
      const response = await axios.get(`/api/articles?${params}`);
      setArticles(response.data.articles || []);
    } catch { setArticles(getSampleArticles()); }
    finally { setLoading(false); }
  };

  const fetchFeatured = async () => { try { const r = await axios.get('/api/articles?featured=true&limit=1'); if (r.data.articles?.length > 0) setFeaturedArticle(r.data.articles[0]); } catch {} };
  const searchArticles = async () => { try { setLoading(true); const r = await axios.get(`/api/articles/search?q=${searchQuery}`); setArticles(r.data || []); } catch {} finally { setLoading(false); } };
  const openArticle = async (article) => { try { const r = await axios.get(`/api/articles/slug/${article.slug}`); setSelectedArticle(r.data); } catch { setSelectedArticle(article); } };
  const likeArticle = async (articleId) => {
    setLikedArticles([...likedArticles, articleId]);
    if (selectedArticle?._id === articleId) setSelectedArticle({ ...selectedArticle, likes: (selectedArticle.likes || 0) + 1 });
    toast.success('Article liked!');
    try { await axios.post(`/api/articles/${articleId}/like`); } catch {}
  };

  const getCategoryLabel = (categoryId) => CATEGORIES.find(c => c.id === categoryId)?.label || categoryId?.replace('_', ' ') || 'General';

  const getSampleArticles = () => [
    { _id: '1', title: '10 Tips for a Healthy Heart', slug: 'healthy-heart-tips', excerpt: 'Learn simple lifestyle changes that can significantly improve your cardiovascular health.', category: 'general_health', authorName: 'Dr. Sharma', readTime: 5, views: 1250, likes: 89 },
    { _id: '2', title: 'The Importance of Mental Health', slug: 'mental-health-importance', excerpt: 'Understanding why mental health is just as important as physical health.', category: 'mental_health', authorName: 'Dr. Patel', readTime: 7, views: 980, likes: 156 },
    { _id: '3', title: 'Balanced Diet for Better Living', slug: 'balanced-diet-guide', excerpt: 'A comprehensive guide to maintaining a balanced diet for optimal health.', category: 'nutrition', authorName: 'Dr. Gupta', readTime: 6, views: 2100, likes: 234 },
    { _id: '4', title: 'Exercise Routines for Beginners', slug: 'beginner-exercise-routines', excerpt: 'Start your fitness journey with these easy-to-follow exercise routines.', category: 'fitness', authorName: 'Dr. Singh', readTime: 8, views: 1560, likes: 178 },
    { _id: '5', title: 'Preventing Common Diseases', slug: 'disease-prevention-tips', excerpt: 'Simple preventive measures to protect yourself from common illnesses.', category: 'prevention', authorName: 'Dr. Kumar', readTime: 5, views: 890, likes: 67 },
    { _id: '6', title: 'Stress Management Techniques', slug: 'stress-management', excerpt: 'Effective techniques to manage stress and improve your quality of life.', category: 'lifestyle', authorName: 'Dr. Reddy', readTime: 6, views: 1340, likes: 145 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            <i className="fas fa-lightbulb text-white text-xl"></i>
          </div>
          Health Tips & Articles
        </h2>
        <div className="relative">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input type="text" placeholder="Search articles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full lg:w-80 pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-200'}`}>
            <i className={cat.icon}></i> {cat.label}
          </button>
        ))}
      </div>

      {/* Featured Article */}
      {featuredArticle && !selectedCategory && !searchQuery && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <i className="fas fa-star text-amber-500"></i> Featured Article
          </h3>
          <div onClick={() => openArticle(featuredArticle)} className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-6 lg:p-8 text-white cursor-pointer hover:shadow-xl transition-all">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-xs font-medium mb-4">
              <i className="fas fa-fire"></i> Featured
            </span>
            <h3 className="text-2xl font-bold mb-2">{featuredArticle.title}</h3>
            <p className="text-indigo-100 mb-4">{featuredArticle.excerpt}</p>
            <div className="flex flex-wrap gap-4 text-sm text-indigo-200">
              <span><i className="fas fa-user-md mr-1"></i> {featuredArticle.authorName}</span>
              <span><i className="fas fa-clock mr-1"></i> {featuredArticle.readTime} min read</span>
              <span><i className="fas fa-eye mr-1"></i> {featuredArticle.views} views</span>
            </div>
          </div>
        </div>
      )}

      {/* Articles Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500">Loading articles...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <i className="fas fa-newspaper text-3xl text-slate-400"></i>
          </div>
          <p className="text-slate-500">No articles found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map(article => (
            <div key={article._id} onClick={() => openArticle(article)}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer overflow-hidden group">
              <div className="h-40 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                {article.coverImage ? <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover" /> : <i className="fas fa-newspaper text-4xl text-indigo-300"></i>}
              </div>
              <div className="p-5">
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{getCategoryLabel(article.category)}</span>
                <h4 className="font-bold text-slate-800 mt-2 mb-2 group-hover:text-indigo-600 transition-colors">{article.title}</h4>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{article.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span><i className="fas fa-user-md mr-1"></i> {article.authorName || 'HealthSync'}</span>
                  <div className="flex gap-3">
                    <span><i className="fas fa-clock mr-1"></i> {article.readTime || 5}m</span>
                    <span><i className="fas fa-heart mr-1"></i> {article.likes || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedArticle(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{getCategoryLabel(selectedArticle.category)}</span>
              <button onClick={() => setSelectedArticle(null)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                <i className="fas fa-times text-slate-500"></i>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">{selectedArticle.title}</h2>
              <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-6">
                <span><i className="fas fa-user-md mr-1"></i> {selectedArticle.authorName || 'HealthSync Team'}</span>
                <span><i className="fas fa-clock mr-1"></i> {selectedArticle.readTime || 5} min read</span>
                <span><i className="fas fa-eye mr-1"></i> {selectedArticle.views || 0} views</span>
                <span><i className="fas fa-heart mr-1"></i> {selectedArticle.likes || 0} likes</span>
              </div>
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                {selectedArticle.content || selectedArticle.excerpt || 'Full article content will be displayed here.'}
              </div>
              <button onClick={() => likeArticle(selectedArticle._id)} disabled={likedArticles.includes(selectedArticle._id)}
                className={`mt-6 flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${likedArticles.includes(selectedArticle._id) ? 'bg-rose-100 text-rose-600' : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:shadow-lg'}`}>
                <i className="fas fa-heart"></i> {likedArticles.includes(selectedArticle._id) ? 'Liked' : 'Like this article'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthTips;
