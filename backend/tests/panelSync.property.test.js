/**
 * Property-Based Tests for Multi-Panel Viewer
 * Feature: advanced-imaging
 * Properties 14, 15: Panel Synchronization and Imaging History
 */

const fc = require('fast-check');

// Mock panel state management
class PanelSyncManager {
  constructor(panelCount = 4) {
    this.panels = Array(panelCount).fill(null).map(() => ({
      zoom: 1.0,
      pan: { x: 0, y: 0 },
      windowLevel: { ww: 400, wc: 40 },
      sliceIndex: 0,
      totalSlices: 1
    }));
    this.syncEnabled = false;
  }

  enableSync() {
    this.syncEnabled = true;
  }

  disableSync() {
    this.syncEnabled = false;
  }

  setZoom(panelIndex, zoom) {
    const clampedZoom = Math.max(0.25, Math.min(4.0, zoom));
    
    if (this.syncEnabled) {
      this.panels.forEach(p => p.zoom = clampedZoom);
    } else {
      this.panels[panelIndex].zoom = clampedZoom;
    }
    
    return clampedZoom;
  }

  setPan(panelIndex, pan) {
    if (this.syncEnabled) {
      this.panels.forEach(p => p.pan = { ...pan });
    } else {
      this.panels[panelIndex].pan = { ...pan };
    }
  }

  setWindowLevel(panelIndex, wl) {
    const clampedWL = {
      ww: Math.max(1, wl.ww),
      wc: wl.wc
    };
    
    if (this.syncEnabled) {
      this.panels.forEach(p => p.windowLevel = { ...clampedWL });
    } else {
      this.panels[panelIndex].windowLevel = { ...clampedWL };
    }
  }

  setSlice(panelIndex, sliceIndex, totalSlices) {
    const panel = this.panels[panelIndex];
    panel.totalSlices = totalSlices;
    const clampedSlice = Math.max(0, Math.min(sliceIndex, totalSlices - 1));
    
    if (this.syncEnabled) {
      // Sync slice as percentage of total
      const percentage = totalSlices > 1 ? clampedSlice / (totalSlices - 1) : 0;
      this.panels.forEach(p => {
        if (p.totalSlices > 1) {
          p.sliceIndex = Math.round(percentage * (p.totalSlices - 1));
        }
      });
    } else {
      panel.sliceIndex = clampedSlice;
    }
  }

  getPanel(index) {
    return this.panels[index];
  }

  getAllPanels() {
    return this.panels;
  }
}

// Mock imaging history service
class ImagingHistoryService {
  constructor() {
    this.studies = [];
  }

  addStudy(study) {
    this.studies.push({
      ...study,
      studyId: study.studyId || `study_${this.studies.length + 1}`,
      uploadedAt: study.uploadedAt || new Date()
    });
  }

  getStudiesForPatient(patientId) {
    return this.studies
      .filter(s => s.patientId === patientId)
      .sort((a, b) => new Date(b.studyDate) - new Date(a.studyDate));
  }

  getStudiesByModality(patientId, modality) {
    return this.getStudiesForPatient(patientId)
      .filter(s => s.modality === modality);
  }

  getStudiesInDateRange(patientId, startDate, endDate) {
    return this.getStudiesForPatient(patientId)
      .filter(s => {
        const date = new Date(s.studyDate);
        return date >= startDate && date <= endDate;
      });
  }
}

describe('Multi-Panel Viewer - Property Tests', () => {

  // Property 14: Panel Synchronization
  describe('Property 14: Panel Synchronization', () => {
    
    test('zoom synchronization applies to all panels when enabled', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.1), max: 5, noNaN: true }),
          fc.integer({ min: 0, max: 3 }),
          (zoom, panelIndex) => {
            const manager = new PanelSyncManager(4);
            manager.enableSync();
            
            manager.setZoom(panelIndex, zoom);
            
            const panels = manager.getAllPanels();
            const expectedZoom = Math.max(0.25, Math.min(4.0, zoom));
            
            panels.forEach(p => {
              expect(Math.abs(p.zoom - expectedZoom)).toBeLessThan(0.001);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    test('zoom changes only affect single panel when sync disabled', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0.5, max: 3.0, noNaN: true }),
          fc.integer({ min: 0, max: 3 }),
          (zoom, panelIndex) => {
            const manager = new PanelSyncManager(4);
            manager.disableSync();
            
            // Set different initial zooms
            manager.panels.forEach((p, i) => p.zoom = 1.0 + i * 0.1);
            
            manager.setZoom(panelIndex, zoom);
            
            const panels = manager.getAllPanels();
            const expectedZoom = Math.max(0.25, Math.min(4.0, zoom));
            
            panels.forEach((p, i) => {
              if (i === panelIndex) {
                expect(Math.abs(p.zoom - expectedZoom)).toBeLessThan(0.001);
              } else {
                expect(Math.abs(p.zoom - (1.0 + i * 0.1))).toBeLessThan(0.001);
              }
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    test('pan synchronization applies to all panels when enabled', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -500, max: 500, noNaN: true }),
          fc.float({ min: -500, max: 500, noNaN: true }),
          fc.integer({ min: 0, max: 3 }),
          (x, y, panelIndex) => {
            const manager = new PanelSyncManager(4);
            manager.enableSync();
            
            manager.setPan(panelIndex, { x, y });
            
            const panels = manager.getAllPanels();
            panels.forEach(p => {
              expect(p.pan.x).toBe(x);
              expect(p.pan.y).toBe(y);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    test('window/level synchronization applies to all panels when enabled', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 4000 }),
          fc.integer({ min: -1000, max: 3000 }),
          fc.integer({ min: 0, max: 3 }),
          (ww, wc, panelIndex) => {
            const manager = new PanelSyncManager(4);
            manager.enableSync();
            
            manager.setWindowLevel(panelIndex, { ww, wc });
            
            const panels = manager.getAllPanels();
            panels.forEach(p => {
              expect(p.windowLevel.ww).toBe(Math.max(1, ww));
              expect(p.windowLevel.wc).toBe(wc);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    test('slice navigation syncs proportionally across different series', () => {
      const manager = new PanelSyncManager(2);
      manager.enableSync();
      
      // Panel 0 has 100 slices, Panel 1 has 50 slices
      manager.panels[0].totalSlices = 100;
      manager.panels[1].totalSlices = 50;
      
      // Navigate to slice 50 (50% through) on panel 0
      manager.setSlice(0, 50, 100);
      
      // Panel 1 should be at slice 25 (50% of 50)
      expect(manager.panels[0].sliceIndex).toBe(50);
      expect(manager.panels[1].sliceIndex).toBe(25);
    });
  });

  // Property 15: Imaging History Retrieval
  describe('Property 15: Imaging History Retrieval', () => {
    
    test('studies are returned sorted by date (newest first)', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              patientId: fc.constant('patient_1'),
              studyDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
              modality: fc.constantFrom('CT', 'MR', 'XR', 'US')
            }),
            { minLength: 2, maxLength: 10 }
          ),
          (studyData) => {
            const service = new ImagingHistoryService();
            studyData.forEach(s => service.addStudy(s));
            
            const retrieved = service.getStudiesForPatient('patient_1');
            
            for (let i = 1; i < retrieved.length; i++) {
              const prevDate = new Date(retrieved[i - 1].studyDate);
              const currDate = new Date(retrieved[i].studyDate);
              expect(prevDate >= currDate).toBe(true);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    test('studies are filtered correctly by patient ID', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1, max: 5 }),
          (patient1Count, patient2Count) => {
            const service = new ImagingHistoryService();
            
            for (let i = 0; i < patient1Count; i++) {
              service.addStudy({
                patientId: 'patient_1',
                studyDate: new Date(),
                modality: 'CT'
              });
            }
            
            for (let i = 0; i < patient2Count; i++) {
              service.addStudy({
                patientId: 'patient_2',
                studyDate: new Date(),
                modality: 'MR'
              });
            }
            
            const patient1Studies = service.getStudiesForPatient('patient_1');
            const patient2Studies = service.getStudiesForPatient('patient_2');
            
            expect(patient1Studies.length).toBe(patient1Count);
            expect(patient2Studies.length).toBe(patient2Count);
            
            patient1Studies.forEach(s => expect(s.patientId).toBe('patient_1'));
            patient2Studies.forEach(s => expect(s.patientId).toBe('patient_2'));
          }
        ),
        { numRuns: 30 }
      );
    });

    test('studies are filtered correctly by modality', () => {
      const service = new ImagingHistoryService();
      
      service.addStudy({ patientId: 'p1', studyDate: new Date(), modality: 'CT' });
      service.addStudy({ patientId: 'p1', studyDate: new Date(), modality: 'CT' });
      service.addStudy({ patientId: 'p1', studyDate: new Date(), modality: 'MR' });
      service.addStudy({ patientId: 'p1', studyDate: new Date(), modality: 'XR' });
      
      const ctStudies = service.getStudiesByModality('p1', 'CT');
      const mrStudies = service.getStudiesByModality('p1', 'MR');
      
      expect(ctStudies.length).toBe(2);
      expect(mrStudies.length).toBe(1);
      
      ctStudies.forEach(s => expect(s.modality).toBe('CT'));
    });

    test('studies are filtered correctly by date range', () => {
      const service = new ImagingHistoryService();
      
      service.addStudy({ patientId: 'p1', studyDate: new Date('2023-01-15'), modality: 'CT' });
      service.addStudy({ patientId: 'p1', studyDate: new Date('2023-06-15'), modality: 'CT' });
      service.addStudy({ patientId: 'p1', studyDate: new Date('2024-01-15'), modality: 'CT' });
      
      const studies2023 = service.getStudiesInDateRange(
        'p1',
        new Date('2023-01-01'),
        new Date('2023-12-31')
      );
      
      expect(studies2023.length).toBe(2);
      studies2023.forEach(s => {
        const year = new Date(s.studyDate).getFullYear();
        expect(year).toBe(2023);
      });
    });

    test('empty result for non-existent patient', () => {
      const service = new ImagingHistoryService();
      
      service.addStudy({ patientId: 'p1', studyDate: new Date(), modality: 'CT' });
      
      const studies = service.getStudiesForPatient('non_existent');
      expect(studies.length).toBe(0);
    });
  });

  // Layout management
  describe('Layout Management', () => {
    
    test('panel count matches layout configuration', () => {
      const layouts = [
        { id: '1x1', expected: 1 },
        { id: '2x1', expected: 2 },
        { id: '1x2', expected: 2 },
        { id: '2x2', expected: 4 }
      ];
      
      layouts.forEach(layout => {
        const manager = new PanelSyncManager(layout.expected);
        expect(manager.getAllPanels().length).toBe(layout.expected);
      });
    });

    test('zoom values are clamped to valid range', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -10, max: 10, noNaN: true }),
          (zoom) => {
            const manager = new PanelSyncManager(1);
            const result = manager.setZoom(0, zoom);
            
            expect(result).toBeGreaterThanOrEqual(0.25);
            expect(result).toBeLessThanOrEqual(4.0);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('slice index is clamped to valid bounds', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -50, max: 200 }),
          fc.integer({ min: 1, max: 100 }),
          (sliceIndex, totalSlices) => {
            const manager = new PanelSyncManager(1);
            manager.setSlice(0, sliceIndex, totalSlices);
            
            const panel = manager.getPanel(0);
            expect(panel.sliceIndex).toBeGreaterThanOrEqual(0);
            expect(panel.sliceIndex).toBeLessThanOrEqual(totalSlices - 1);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
