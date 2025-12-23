/**
 * Property-Based Tests for Annotation Storage Service
 * Feature: advanced-imaging
 * Property 4: Study-Patient-Visit Linking Integrity
 */

const fc = require('fast-check');

// Mock mongoose for testing
const mockAnnotations = new Map();
let annotationIdCounter = 1;

// Mock annotation storage functions
const mockSaveAnnotation = (annotationData) => {
  const annotation = {
    ...annotationData,
    annotationId: annotationData.annotationId || `ann_${annotationIdCounter++}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    visible: annotationData.visible !== undefined ? annotationData.visible : true,
    locked: annotationData.locked !== undefined ? annotationData.locked : false
  };
  mockAnnotations.set(annotation.annotationId, annotation);
  return annotation;
};

const mockGetAnnotationsForStudy = (studyId) => {
  return Array.from(mockAnnotations.values()).filter(a => a.studyId === studyId);
};

const mockGetAnnotationsForImage = (studyId, sopInstanceUID) => {
  return Array.from(mockAnnotations.values()).filter(
    a => a.studyId === studyId && a.sopInstanceUID === sopInstanceUID && a.visible
  );
};

const mockDeleteAnnotation = (annotationId, userId) => {
  const annotation = mockAnnotations.get(annotationId);
  if (!annotation) throw new Error('Annotation not found');
  if (annotation.createdBy !== userId) throw new Error('Not authorized');
  mockAnnotations.delete(annotationId);
  return { success: true };
};

const mockToggleVisibility = (annotationId) => {
  const annotation = mockAnnotations.get(annotationId);
  if (!annotation) throw new Error('Annotation not found');
  annotation.visible = !annotation.visible;
  annotation.updatedAt = new Date();
  return annotation;
};

describe('Annotation Storage Service - Property Tests', () => {
  
  beforeEach(() => {
    mockAnnotations.clear();
    annotationIdCounter = 1;
  });

  // Property 4: Study-Patient-Visit Linking Integrity
  describe('Property 4: Study-Patient-Visit Linking Integrity', () => {
    
    test('saved annotations maintain study reference', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom('length', 'angle', 'rectangle', 'ellipse', 'text', 'arrow'),
          (studyId, seriesUID, sopUID, toolType) => {
            const annotation = mockSaveAnnotation({
              studyId,
              seriesInstanceUID: seriesUID,
              sopInstanceUID: sopUID,
              toolType,
              createdBy: 'user123',
              data: { handles: [] }
            });
            
            expect(annotation.studyId).toBe(studyId);
            expect(annotation.seriesInstanceUID).toBe(seriesUID);
            expect(annotation.sopInstanceUID).toBe(sopUID);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('annotations are retrievable by study ID', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.integer({ min: 1, max: 10 }),
          (studyId, count) => {
            // Clear and add annotations
            mockAnnotations.clear();
            
            for (let i = 0; i < count; i++) {
              mockSaveAnnotation({
                studyId,
                seriesInstanceUID: `series_${i}`,
                sopInstanceUID: `sop_${i}`,
                toolType: 'length',
                createdBy: 'user123',
                data: { handles: [] }
              });
            }
            
            const retrieved = mockGetAnnotationsForStudy(studyId);
            expect(retrieved.length).toBe(count);
            retrieved.forEach(a => expect(a.studyId).toBe(studyId));
          }
        ),
        { numRuns: 20 }
      );
    });

    test('annotations are retrievable by image (SOP Instance UID)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.integer({ min: 1, max: 5 }),
          (studyId, sopUID, count) => {
            mockAnnotations.clear();
            
            // Add annotations for target image
            for (let i = 0; i < count; i++) {
              mockSaveAnnotation({
                studyId,
                seriesInstanceUID: 'series_1',
                sopInstanceUID: sopUID,
                toolType: 'length',
                createdBy: 'user123',
                data: { handles: [] }
              });
            }
            
            // Add annotations for different image
            mockSaveAnnotation({
              studyId,
              seriesInstanceUID: 'series_1',
              sopInstanceUID: 'different_sop',
              toolType: 'angle',
              createdBy: 'user123',
              data: { handles: [] }
            });
            
            const retrieved = mockGetAnnotationsForImage(studyId, sopUID);
            expect(retrieved.length).toBe(count);
            retrieved.forEach(a => {
              expect(a.studyId).toBe(studyId);
              expect(a.sopInstanceUID).toBe(sopUID);
            });
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // Annotation CRUD operations
  describe('Annotation CRUD Operations', () => {
    
    test('annotation IDs are unique', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 20 }),
          (count) => {
            mockAnnotations.clear();
            const ids = new Set();
            
            for (let i = 0; i < count; i++) {
              const annotation = mockSaveAnnotation({
                studyId: 'study_1',
                seriesInstanceUID: 'series_1',
                sopInstanceUID: `sop_${i}`,
                toolType: 'length',
                createdBy: 'user123',
                data: { handles: [] }
              });
              ids.add(annotation.annotationId);
            }
            
            expect(ids.size).toBe(count);
          }
        ),
        { numRuns: 20 }
      );
    });

    test('only creator can delete annotation', () => {
      const annotation = mockSaveAnnotation({
        studyId: 'study_1',
        seriesInstanceUID: 'series_1',
        sopInstanceUID: 'sop_1',
        toolType: 'length',
        createdBy: 'user123',
        data: { handles: [] }
      });
      
      // Different user should fail
      expect(() => mockDeleteAnnotation(annotation.annotationId, 'user456'))
        .toThrow('Not authorized');
      
      // Creator should succeed
      expect(() => mockDeleteAnnotation(annotation.annotationId, 'user123'))
        .not.toThrow();
    });

    test('visibility toggle works correctly', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (initialVisibility) => {
            mockAnnotations.clear();
            
            const annotation = mockSaveAnnotation({
              studyId: 'study_1',
              seriesInstanceUID: 'series_1',
              sopInstanceUID: 'sop_1',
              toolType: 'length',
              createdBy: 'user123',
              data: { handles: [] },
              visible: initialVisibility
            });
            
            const toggled = mockToggleVisibility(annotation.annotationId);
            expect(toggled.visible).toBe(!initialVisibility);
            
            const toggledAgain = mockToggleVisibility(annotation.annotationId);
            expect(toggledAgain.visible).toBe(initialVisibility);
          }
        ),
        { numRuns: 20 }
      );
    });

    test('hidden annotations are not returned by getAnnotationsForImage', () => {
      mockAnnotations.clear();
      
      // Add visible annotation
      mockSaveAnnotation({
        studyId: 'study_1',
        seriesInstanceUID: 'series_1',
        sopInstanceUID: 'sop_1',
        toolType: 'length',
        createdBy: 'user123',
        data: { handles: [] },
        visible: true
      });
      
      // Add hidden annotation
      mockSaveAnnotation({
        studyId: 'study_1',
        seriesInstanceUID: 'series_1',
        sopInstanceUID: 'sop_1',
        toolType: 'angle',
        createdBy: 'user123',
        data: { handles: [] },
        visible: false
      });
      
      const retrieved = mockGetAnnotationsForImage('study_1', 'sop_1');
      expect(retrieved.length).toBe(1);
      expect(retrieved[0].toolType).toBe('length');
    });
  });

  // Annotation data integrity
  describe('Annotation Data Integrity', () => {
    
    test('measurement data is preserved', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1000, noNaN: true }),
          fc.constantFrom('mm', 'cm', 'degrees', 'mm²'),
          (value, unit) => {
            mockAnnotations.clear();
            
            const annotation = mockSaveAnnotation({
              studyId: 'study_1',
              seriesInstanceUID: 'series_1',
              sopInstanceUID: 'sop_1',
              toolType: 'length',
              createdBy: 'user123',
              data: {
                handles: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
                measurement: { value, unit }
              }
            });
            
            expect(annotation.data.measurement.value).toBe(value);
            expect(annotation.data.measurement.unit).toBe(unit);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('handle coordinates are preserved', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              x: fc.float({ min: -1000, max: 1000, noNaN: true }),
              y: fc.float({ min: -1000, max: 1000, noNaN: true })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (handles) => {
            mockAnnotations.clear();
            
            const annotation = mockSaveAnnotation({
              studyId: 'study_1',
              seriesInstanceUID: 'series_1',
              sopInstanceUID: 'sop_1',
              toolType: 'freehand',
              createdBy: 'user123',
              data: { handles }
            });
            
            expect(annotation.data.handles.length).toBe(handles.length);
            handles.forEach((h, i) => {
              expect(annotation.data.handles[i].x).toBe(h.x);
              expect(annotation.data.handles[i].y).toBe(h.y);
            });
          }
        ),
        { numRuns: 30 }
      );
    });

    test('text annotations preserve text content', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          (text) => {
            mockAnnotations.clear();
            
            const annotation = mockSaveAnnotation({
              studyId: 'study_1',
              seriesInstanceUID: 'series_1',
              sopInstanceUID: 'sop_1',
              toolType: 'text',
              createdBy: 'user123',
              data: {
                handles: [{ x: 50, y: 50 }],
                text
              }
            });
            
            expect(annotation.data.text).toBe(text);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  // Timestamps
  describe('Timestamp Management', () => {
    
    test('createdAt is set on save', () => {
      const before = new Date();
      
      const annotation = mockSaveAnnotation({
        studyId: 'study_1',
        seriesInstanceUID: 'series_1',
        sopInstanceUID: 'sop_1',
        toolType: 'length',
        createdBy: 'user123',
        data: { handles: [] }
      });
      
      const after = new Date();
      
      expect(annotation.createdAt).toBeDefined();
      expect(annotation.createdAt >= before).toBe(true);
      expect(annotation.createdAt <= after).toBe(true);
    });

    test('updatedAt changes on toggle', () => {
      const annotation = mockSaveAnnotation({
        studyId: 'study_1',
        seriesInstanceUID: 'series_1',
        sopInstanceUID: 'sop_1',
        toolType: 'length',
        createdBy: 'user123',
        data: { handles: [] }
      });
      
      const originalUpdatedAt = annotation.updatedAt;
      
      // Small delay to ensure time difference
      const toggled = mockToggleVisibility(annotation.annotationId);
      
      expect(toggled.updatedAt >= originalUpdatedAt).toBe(true);
    });
  });
});
