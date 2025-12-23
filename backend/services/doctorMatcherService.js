/**
 * Doctor Matcher Service
 * AI-powered doctor recommendations based on systematic history symptoms
 */

const { SPECIALIZATION_RULES, BODY_SYSTEMS } = require('../config/systematicHistoryConfig');

class DoctorMatcherService {
  
  /**
   * Get doctor recommendations based on symptoms
   * @param {Object} systematicHistory - The systematic history data
   * @returns {Array} Array of recommendations with specialization, confidence, and reason
   */
  getRecommendations(systematicHistory) {
    try {
      const presentSymptoms = this.extractPresentSymptoms(systematicHistory);
      const affectedSystems = this.getAffectedSystems(systematicHistory);
      
      console.log('📊 Analyzing symptoms for recommendations...');
      console.log('   Present symptoms:', presentSymptoms.length);
      console.log('   Affected systems:', affectedSystems.length);
      
      // If no symptoms, return general recommendation
      if (presentSymptoms.length === 0) {
        return [{
          specialization: 'General Physician',
          confidence: 0.5,
          reason: 'General health consultation'
        }];
      }
      
      // Check for multi-system involvement first
      if (affectedSystems.length >= 3) {
        const multiSystemRule = SPECIALIZATION_RULES.find(r => r.multiSystem);
        if (multiSystemRule) {
          return multiSystemRule.recommendations.map(rec => ({
            ...rec,
            reason: multiSystemRule.reason
          }));
        }
      }
      
      // Match symptoms against rules
      const recommendations = this.matchSymptomRules(presentSymptoms, affectedSystems);
      
      // Sort by confidence and deduplicate
      const sortedRecommendations = this.deduplicateAndSort(recommendations);
      
      // If no specific matches, recommend GP
      if (sortedRecommendations.length === 0) {
        return [{
          specialization: 'General Physician',
          confidence: 0.6,
          reason: 'General health evaluation recommended'
        }];
      }
      
      return sortedRecommendations;
    } catch (error) {
      console.error('❌ Error generating recommendations:', error);
      return [{
        specialization: 'General Physician',
        confidence: 0.5,
        reason: 'Unable to analyze symptoms - general consultation recommended'
      }];
    }
  }
  
  /**
   * Extract all present symptoms from systematic history
   */
  extractPresentSymptoms(history) {
    const symptoms = [];
    const systemKeys = Object.keys(BODY_SYSTEMS);
    
    systemKeys.forEach(system => {
      const systemData = history[system];
      if (systemData && systemData.symptoms) {
        systemData.symptoms.forEach(symptom => {
          if (symptom.present) {
            symptoms.push({
              name: symptom.name,
              system: system,
              duration: symptom.duration,
              severity: symptom.severity
            });
          }
        });
      }
    });
    
    return symptoms;
  }
  
  /**
   * Get list of affected body systems
   */
  getAffectedSystems(history) {
    const affected = [];
    const systemKeys = Object.keys(BODY_SYSTEMS);
    
    systemKeys.forEach(system => {
      const systemData = history[system];
      if (systemData && systemData.symptoms) {
        const hasPresent = systemData.symptoms.some(s => s.present);
        if (hasPresent) {
          affected.push(system);
        }
      }
    });
    
    return affected;
  }

  /**
   * Match symptoms against specialization rules
   */
  matchSymptomRules(presentSymptoms, affectedSystems) {
    const recommendations = [];
    const symptomNames = presentSymptoms.map(s => s.name);
    
    SPECIALIZATION_RULES.forEach(rule => {
      // Skip multi-system rule (handled separately)
      if (rule.multiSystem) return;
      
      // Check if any symptoms match this rule
      const matchingSymptoms = rule.symptoms.filter(s => symptomNames.includes(s));
      const matchingSystemsCount = rule.systems.filter(s => affectedSystems.includes(s)).length;
      
      if (matchingSymptoms.length > 0 || matchingSystemsCount > 0) {
        // Calculate match score based on symptom overlap
        const symptomMatchRatio = matchingSymptoms.length / rule.symptoms.length;
        const systemMatch = matchingSystemsCount > 0;
        
        // Adjust confidence based on match quality
        rule.recommendations.forEach(rec => {
          let adjustedConfidence = rec.confidence;
          
          // Boost confidence if multiple symptoms match
          if (symptomMatchRatio > 0.5) {
            adjustedConfidence = Math.min(0.95, adjustedConfidence + 0.1);
          }
          
          // Boost if system matches
          if (systemMatch) {
            adjustedConfidence = Math.min(0.95, adjustedConfidence + 0.05);
          }
          
          // Consider severity - higher severity = higher confidence
          const avgSeverity = this.calculateAverageSeverity(presentSymptoms, matchingSymptoms);
          if (avgSeverity >= 4) {
            adjustedConfidence = Math.min(0.95, adjustedConfidence + 0.05);
          }
          
          recommendations.push({
            specialization: rec.specialization,
            confidence: adjustedConfidence,
            reason: rule.reason,
            matchedSymptoms: matchingSymptoms
          });
        });
      }
    });
    
    return recommendations;
  }
  
  /**
   * Calculate average severity of matching symptoms
   */
  calculateAverageSeverity(presentSymptoms, matchingSymptomNames) {
    const matchingWithSeverity = presentSymptoms.filter(
      s => matchingSymptomNames.includes(s.name) && s.severity
    );
    
    if (matchingWithSeverity.length === 0) return 3; // Default moderate
    
    const totalSeverity = matchingWithSeverity.reduce((sum, s) => sum + s.severity, 0);
    return totalSeverity / matchingWithSeverity.length;
  }
  
  /**
   * Deduplicate recommendations and sort by confidence
   */
  deduplicateAndSort(recommendations) {
    // Group by specialization and keep highest confidence
    const specMap = new Map();
    
    recommendations.forEach(rec => {
      const existing = specMap.get(rec.specialization);
      if (!existing || rec.confidence > existing.confidence) {
        specMap.set(rec.specialization, rec);
      }
    });
    
    // Convert to array and sort by confidence
    return Array.from(specMap.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); // Return top 5 recommendations
  }
  
  /**
   * Get match score for a specific doctor based on symptoms
   */
  getDoctorMatchScore(doctor, systematicHistory) {
    const recommendations = this.getRecommendations(systematicHistory);
    
    // Find if doctor's specialization matches any recommendation
    const match = recommendations.find(
      r => r.specialization.toLowerCase() === doctor.specialization?.toLowerCase()
    );
    
    if (match) {
      return {
        score: match.confidence,
        reason: match.reason,
        isRecommended: true
      };
    }
    
    // Check for partial matches (e.g., "General Medicine" vs "General Physician")
    const partialMatch = recommendations.find(r => {
      const recSpec = r.specialization.toLowerCase();
      const docSpec = (doctor.specialization || '').toLowerCase();
      return recSpec.includes(docSpec) || docSpec.includes(recSpec);
    });
    
    if (partialMatch) {
      return {
        score: partialMatch.confidence * 0.8,
        reason: partialMatch.reason,
        isRecommended: true
      };
    }
    
    return {
      score: 0.3,
      reason: 'Not a primary match for reported symptoms',
      isRecommended: false
    };
  }
  
  /**
   * Get all specialization rules (for frontend display)
   */
  getSpecializationRules() {
    return SPECIALIZATION_RULES.map(rule => ({
      id: rule.id,
      symptoms: rule.symptoms || [],
      systems: rule.systems || [],
      recommendations: rule.recommendations,
      reason: rule.reason,
      multiSystem: rule.multiSystem || false
    }));
  }
}

module.exports = new DoctorMatcherService();
