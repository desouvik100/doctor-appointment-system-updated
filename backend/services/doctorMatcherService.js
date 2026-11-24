

const { SPECIALIZATION_RULES, BODY_SYSTEMS } = require('../config/systematicHistoryConfig');

class DoctorMatcherService {

  getRecommendations(systematicHistory) {
    try {
      const presentSymptoms = this.extractPresentSymptoms(systematicHistory);
      const affectedSystems = this.getAffectedSystems(systematicHistory);
      
      console.log('📊 Analyzing symptoms for recommendations...');
      console.log('   Present symptoms:', presentSymptoms.length);
      console.log('   Affected systems:', affectedSystems.length);
      if (presentSymptoms.length === 0) {
        return [{
          specialization: 'General Physician',
          confidence: 0.5,
          reason: 'General health consultation'
       }];
      }
      if (affectedSystems.length >= 3) {
        const multiSystemRule = SPECIALIZATION_RULES.find(r => r.multiSystem);
       if (multiSystemRule) {
          return multiSystemRule.recommendations.map(rec => ({
            ...rec,
            reason: multiSystemRule.reason
          }));
        }
      }
      const recommendations = this.matchSymptomRules(presentSymptoms, affectedSystems);
      const sortedRecommendations = this.deduplicateAndSort(recommendations);
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

  matchSymptomRules(presentSymptoms, affectedSystems) {
    const recommendations = [];
    const symptomNames = presentSymptoms.map(s => s.name);
    
   SPECIALIZATION_RULES.forEach(rule => {
      if (rule.multiSystem) return;
      const matchingSymptoms = rule.symptoms.filter(s => symptomNames.includes(s));
      const matchingSystemsCount = rule.systems.filter(s => affectedSystems.includes(s)).length;
      
     if (matchingSymptoms.length > 0 || matchingSystemsCount > 0) {
        const symptomMatchRatio = matchingSymptoms.length / rule.symptoms.length;
       const systemMatch = matchingSystemsCount > 0;
        rule.recommendations.forEach(rec => {
          let adjustedConfidence = rec.confidence;
          if (symptomMatchRatio > 0.5) {
            adjustedConfidence = Math.min(0.95, adjustedConfidence + 0.1);
          }
         if (systemMatch) {
            adjustedConfidence = Math.min(0.95, adjustedConfidence + 0.05);
          }
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

  calculateAverageSeverity(presentSymptoms, matchingSymptomNames) {
    const matchingWithSeverity = presentSymptoms.filter(
      s => matchingSymptomNames.includes(s.name) && s.severity
    );
    
    if (matchingWithSeverity.length === 0) return 3; 
    
    const totalSeverity = matchingWithSeverity.reduce((sum, s) => sum + s.severity, 0);
    return totalSeverity / matchingWithSeverity.length;
  }

  deduplicateAndSort(recommendations) {
    const specMap = new Map();
    
    recommendations.forEach(rec => {
      const existing = specMap.get(rec.specialization);
      if (!existing || rec.confidence > existing.confidence) {
        specMap.set(rec.specialization, rec);
      }
    });
    return Array.from(specMap.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); 
  }

  getDoctorMatchScore(doctor, systematicHistory) {
    const recommendations = this.getRecommendations(systematicHistory);
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
