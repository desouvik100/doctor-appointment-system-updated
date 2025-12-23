/**
 * ICD-10 Search Service
 * Provides ICD-10 code search functionality using NIH Clinical Tables API
 * with caching for frequently searched terms
 */

const axios = require('axios');

// NIH Clinical Tables API - Free, no license required
const ICD10_API_BASE = 'https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search';

// In-memory cache for frequently searched terms
const searchCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 1000;

// Common ICD-10 codes for fallback when API is unavailable
const COMMON_ICD10_CODES = [
  { code: 'Z00.00', description: 'Encounter for general adult medical examination without abnormal findings' },
  { code: 'I10', description: 'Essential (primary) hypertension' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
  { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified' },
  { code: 'M79.3', description: 'Panniculitis, unspecified' },
  { code: 'R50.9', description: 'Fever, unspecified' },
  { code: 'K59.00', description: 'Constipation, unspecified' },
  { code: 'R06.02', description: 'Shortness of breath' },
  { code: 'R51', description: 'Headache' },
  { code: 'M25.50', description: 'Pain in unspecified joint' },
  { code: 'K21.9', description: 'Gastro-esophageal reflux disease without esophagitis' },
  { code: 'F32.9', description: 'Major depressive disorder, single episode, unspecified' },
  { code: 'F41.9', description: 'Anxiety disorder, unspecified' },
  { code: 'N39.0', description: 'Urinary tract infection, site not specified' },
  { code: 'J44.1', description: 'Chronic obstructive pulmonary disease with acute exacerbation' },
  { code: 'I25.10', description: 'Atherosclerotic heart disease of native coronary artery without angina pectoris' },
  { code: 'E78.5', description: 'Hyperlipidemia, unspecified' },
  { code: 'M54.5', description: 'Low back pain' },
  { code: 'R10.9', description: 'Unspecified abdominal pain' },
  { code: 'Z51.11', description: 'Encounter for antineoplastic chemotherapy' }
];

/**
 * Search ICD-10 codes using NIH Clinical Tables API
 * @param {string} searchTerm - The search term
 * @param {number} maxResults - Maximum number of results (default: 20)
 * @returns {Promise<Array>} Array of ICD-10 codes with descriptions
 */
async function searchICD10(searchTerm, maxResults = 20) {
  try {
    // Input validation
    if (!searchTerm || typeof searchTerm !== 'string') {
      throw new Error('Search term is required and must be a string');
    }
    
    const trimmedTerm = searchTerm.trim();
    if (trimmedTerm.length < 2) {
      throw new Error('Search term must be at least 2 characters long');
    }
    
    // Check cache first
    const cacheKey = `${trimmedTerm.toLowerCase()}_${maxResults}`;
    const cached = getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Make API request
    const response = await axios.get(ICD10_API_BASE, {
      params: {
        sf: 'code,name',
        terms: trimmedTerm,
        maxList: Math.min(maxResults, 50) // API limit
      },
      timeout: 5000 // 5 second timeout
    });
    
    // Parse API response
    // NIH API returns: [total, codes, null, descriptions]
    const [total, codes, , descriptions] = response.data;
    
    if (!codes || !descriptions || codes.length === 0) {
      // Return fallback results if no matches
      return getFallbackResults(trimmedTerm, maxResults);
    }
    
    // Format results
    const results = codes.map((code, index) => ({
      code: code,
      description: descriptions[index] ? descriptions[index][1] : 'No description available'
    })).slice(0, maxResults);
    
    // Cache the results
    setCachedResult(cacheKey, results);
    
    return results;
    
  } catch (error) {
    console.error('ICD-10 search error:', error.message);
    
    // Return fallback results on error
    return getFallbackResults(searchTerm, maxResults);
  }
}

/**
 * Get specific ICD-10 code details
 * @param {string} code - The ICD-10 code
 * @returns {Promise<Object|null>} ICD-10 code details or null if not found
 */
async function getICD10Code(code) {
  try {
    if (!code || typeof code !== 'string') {
      throw new Error('ICD-10 code is required and must be a string');
    }
    
    const trimmedCode = code.trim().toUpperCase();
    
    // Check cache first
    const cacheKey = `code_${trimmedCode}`;
    const cached = getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Search for exact code match
    const results = await searchICD10(trimmedCode, 1);
    
    if (results.length > 0 && results[0].code.toUpperCase() === trimmedCode) {
      const result = results[0];
      setCachedResult(cacheKey, result);
      return result;
    }
    
    // Check common codes as fallback
    const commonCode = COMMON_ICD10_CODES.find(c => c.code.toUpperCase() === trimmedCode);
    if (commonCode) {
      setCachedResult(cacheKey, commonCode);
      return commonCode;
    }
    
    return null;
    
  } catch (error) {
    console.error('ICD-10 code lookup error:', error.message);
    return null;
  }
}

/**
 * Get fallback results from common codes when API is unavailable
 * @param {string} searchTerm - The search term
 * @param {number} maxResults - Maximum number of results
 * @returns {Array} Array of matching common ICD-10 codes
 */
function getFallbackResults(searchTerm, maxResults = 20) {
  if (!searchTerm) return [];
  
  const term = searchTerm.toLowerCase();
  
  // Search in common codes
  const matches = COMMON_ICD10_CODES.filter(item => 
    item.code.toLowerCase().includes(term) || 
    item.description.toLowerCase().includes(term)
  );
  
  return matches.slice(0, maxResults);
}

/**
 * Get cached search result
 * @param {string} key - Cache key
 * @returns {Array|null} Cached result or null
 */
function getCachedResult(key) {
  const cached = searchCache.get(key);
  
  if (!cached) return null;
  
  // Check if cache entry has expired
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    searchCache.delete(key);
    return null;
  }
  
  return cached.data;
}

/**
 * Set cached search result
 * @param {string} key - Cache key
 * @param {Array} data - Data to cache
 */
function setCachedResult(key, data) {
  // Implement LRU cache behavior
  if (searchCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry
    const firstKey = searchCache.keys().next().value;
    searchCache.delete(firstKey);
  }
  
  searchCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Clear the search cache
 */
function clearCache() {
  searchCache.clear();
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
function getCacheStats() {
  return {
    size: searchCache.size,
    maxSize: MAX_CACHE_SIZE,
    ttl: CACHE_TTL
  };
}

/**
 * Get popular/frequently searched codes
 * @returns {Array} Array of popular ICD-10 codes
 */
function getPopularCodes() {
  return COMMON_ICD10_CODES.slice(0, 10);
}

module.exports = {
  searchICD10,
  getICD10Code,
  getFallbackResults,
  clearCache,
  getCacheStats,
  getPopularCodes
};