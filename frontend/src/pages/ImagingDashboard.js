/**
 * Imaging Dashboard Page
 * Main entry point for DICOM viewer and imaging features
 * Works with state-based navigation (no React Router)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  DicomViewer,
  SeriesThumbnailNavigator,
  MeasurementTools,
  ImageExport,
  MultiPanelViewer,
  ImagingReport,
  DicomUploader,
  ProfessionalDicomViewer
} from '../components/imaging';
import './ImagingDashboard.css';

const ImagingDashboard = ({ user, onBack, patientId: propPatientId, studyId: propStudyId }) => {
  // Use props or derive from user
  const patientId = propPatientId || user?.id || user?._id;
  const [currentStudyId, setCurrentStudyId] = useState(propStudyId || null);
  
  // State
  const [activeView, setActiveView] = useState('viewer'); // viewer, comparison, report, upload
  const [currentStudy, setCurrentStudy] = useState(null);
  const [patientStudies, setPatientStudies] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [activeTool, setActiveTool] = useState('pan');
  const [measurements, setMeasurements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch patient studies
  useEffect(() => {
    const fetchStudies = async () => {
      if (!patientId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token') || user?.token;
        const response = await fetch(`/api/imaging/patients/${patientId}/studies`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (!response.ok) {
          // If no studies found, show empty state instead of error
          if (response.status === 404) {
            setPatientStudies([]);
            setIsLoading(false);
            return;
          }
          throw new Error('Failed to fetch studies');
        }
        
        const data = await response.json();
        // Backend returns studies in 'data' field, transform to expected format
        const studies = (data.data || data.studies || []).map(study => ({
          studyId: study._id || study.studyId,
          studyInstanceUID: study.studyInstanceUID,
          series: study.series || [],
          metadata: {
            studyDate: study.studyDate,
            modality: study.modality,
            studyDescription: study.studyDescription,
            bodyPartExamined: study.bodyPartExamined,
            totalImages: study.totalImages,
            totalSeries: study.totalSeries
          }
        }));
        setPatientStudies(studies);
        
        // If studyId provided, set current study
        if (currentStudyId) {
          const study = studies.find(s => s.studyId === currentStudyId);
          if (study) {
            setCurrentStudy(study);
            if (study.series?.length > 0) {
              setSelectedSeries(study.series[0]);
            }
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudies();
  }, [patientId, currentStudyId, user?.token]);

  // Handle study selection
  const handleStudySelect = useCallback((study) => {
    setCurrentStudy(study);
    setCurrentStudyId(study.studyId);
    // Set the first series as selected, or null if no series
    if (study.series?.length > 0) {
      setSelectedSeries(study.series[0]);
    } else {
      setSelectedSeries(null);
    }
  }, []);

  // Handle series selection
  const handleSeriesSelect = useCallback((seriesId) => {
    const series = currentStudy?.series?.find(s => s.seriesInstanceUID === seriesId);
    if (series) {
      setSelectedSeries(series);
    }
  }, [currentStudy]);

  // Handle measurement add
  const handleMeasurementAdd = useCallback((measurement) => {
    setMeasurements(prev => [...prev, {
      ...measurement,
      annotationId: `ann_${Date.now()}`,
      visible: true
    }]);
  }, []);

  // Handle measurement delete
  const handleMeasurementDelete = useCallback((annotationId) => {
    setMeasurements(prev => prev.filter(m => m.annotationId !== annotationId));
  }, []);

  // Handle report save
  const handleReportSave = useCallback(async (reportData) => {
    try {
      const token = localStorage.getItem('token') || user?.token;
      const response = await fetch('/api/imaging/reports', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(reportData)
      });
      
      if (!response.ok) throw new Error('Failed to save report');
      
      // Show success notification
      console.log('Report saved successfully');
    } catch (err) {
      console.error('Failed to save report:', err);
    }
  }, [user?.token]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    }
  }, [onBack]);

  if (isLoading) {
    return (
      <div className="imaging-dashboard loading">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin fa-3x"></i>
          <p>Loading imaging data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="imaging-dashboard error">
        <div className="error-message">
          <i className="fas fa-exclamation-triangle fa-3x"></i>
          <h3>Error Loading Imaging</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
          <button onClick={handleBack} style={{ marginLeft: '10px' }}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="imaging-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <button className="back-btn" onClick={handleBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1>Medical Imaging</h1>
          {currentStudy && (
            <span className="study-info">
              {currentStudy.metadata?.modality} - {currentStudy.metadata?.studyDescription || 'Study'}
            </span>
          )}
        </div>
        
        <div className="header-center">
          <div className="view-tabs">
            <button
              className={`view-tab ${activeView === 'viewer' ? 'active' : ''}`}
              onClick={() => setActiveView('viewer')}
            >
              <i className="fas fa-image"></i>
              Viewer
            </button>
            <button
              className={`view-tab ${activeView === 'comparison' ? 'active' : ''}`}
              onClick={() => setActiveView('comparison')}
            >
              <i className="fas fa-columns"></i>
              Compare
            </button>
            <button
              className={`view-tab ${activeView === 'report' ? 'active' : ''}`}
              onClick={() => setActiveView('report')}
            >
              <i className="fas fa-file-medical"></i>
              Report
            </button>
            <button
              className={`view-tab ${activeView === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveView('upload')}
            >
              <i className="fas fa-upload"></i>
              Upload
            </button>
          </div>
        </div>
        
        <div className="header-right">
          <ImageExport
            canvasRef={null}
            metadata={currentStudy?.metadata}
            annotations={measurements}
          />
        </div>
      </header>

      {/* Professional Viewer - Full screen when study is selected */}
      {activeView === 'viewer' && currentStudy && (
        <ProfessionalDicomViewer
          study={{
            ...currentStudy,
            ...currentStudy.metadata,
            series: currentStudy.series
          }}
          patientId={patientId}
          onBack={() => setCurrentStudy(null)}
        />
      )}

      {/* Main content - only show when no study selected or other views */}
      <main className="dashboard-main">
        {activeView === 'viewer' && !currentStudy && (
          <div className="viewer-layout">
            {/* Show study selection when no study is selected */}
            <div className="viewer-main">
              {patientStudies.length === 0 ? (
                <div className="no-study-selected">
                  <i className="fas fa-x-ray"></i>
                  <h3>No Imaging Studies</h3>
                  <p>No imaging studies found for this patient.</p>
                  <p className="hint">Upload DICOM files or request imaging from your healthcare provider.</p>
                  <button 
                    className="upload-btn-cta"
                    onClick={() => setActiveView('upload')}
                  >
                    <i className="fas fa-upload"></i> Upload DICOM Files
                  </button>
                </div>
              ) : (
                <div className="no-study-selected">
                  <i className="fas fa-x-ray"></i>
                  <h3>Select a Study</h3>
                  <p>Choose a study from the list to view</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'comparison' && (
          <MultiPanelViewer
            studies={patientStudies}
            patientId={patientId}
            onStudySelect={handleStudySelect}
          />
        )}

        {activeView === 'report' && currentStudy && (
          <div className="report-layout">
            <ImagingReport
              studyId={currentStudy.studyId}
              study={currentStudy}
              patient={{ patientId }}
              onSave={handleReportSave}
            />
          </div>
        )}

        {activeView === 'report' && !currentStudy && (
          <div className="report-layout">
            <div className="no-study-selected">
              <i className="fas fa-file-medical"></i>
              <h3>No Study Selected</h3>
              <p>Select a study first to create a report</p>
            </div>
          </div>
        )}

        {activeView === 'upload' && (
          <div className="upload-layout">
            <DicomUploader
              patientId={patientId}
              clinicId={user?.clinicId}
              onUploadComplete={async (data) => {
                // Refresh studies list after upload
                try {
                  const token = localStorage.getItem('token') || user?.token;
                  const response = await fetch(`/api/imaging/patients/${patientId}/studies`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                  });
                  if (response.ok) {
                    const result = await response.json();
                    const studies = (result.data || []).map(study => ({
                      studyId: study._id || study.studyId,
                      studyInstanceUID: study.studyInstanceUID,
                      series: study.series || [],
                      metadata: {
                        studyDate: study.studyDate,
                        modality: study.modality,
                        studyDescription: study.studyDescription,
                        bodyPartExamined: study.bodyPartExamined,
                        totalImages: study.totalImages,
                        totalSeries: study.totalSeries
                      }
                    }));
                    setPatientStudies(studies);
                    
                    // Select the newly uploaded study
                    if (data.studyId) {
                      const newStudy = studies.find(s => s.studyId === data.studyId);
                      if (newStudy) {
                        setCurrentStudy(newStudy);
                        if (newStudy.series?.length > 0) {
                          setSelectedSeries(newStudy.series[0]);
                        }
                      }
                    }
                  }
                } catch (err) {
                  console.error('Failed to refresh studies:', err);
                }
                setActiveView('viewer');
              }}
              onError={(error) => {
                console.error('Upload error:', error);
              }}
            />
          </div>
        )}
      </main>

      {/* Study list sidebar */}
      {patientStudies.length > 0 && activeView === 'viewer' && (
        <aside className="studies-sidebar">
          <h3>Patient Studies ({patientStudies.length})</h3>
          <div className="studies-list">
            {patientStudies.map(study => (
              <div
                key={study.studyId}
                className={`study-item ${currentStudy?.studyId === study.studyId ? 'active' : ''}`}
                onClick={() => handleStudySelect(study)}
              >
                <div className="study-icon">
                  <i className={`fas fa-${getModalityIcon(study.metadata?.modality)}`}></i>
                </div>
                <div className="study-details">
                  <span className="study-date">
                    {study.metadata?.studyDate 
                      ? new Date(study.metadata.studyDate).toLocaleDateString()
                      : 'Unknown date'
                    }
                  </span>
                  <span className="study-modality">{study.metadata?.modality || 'Unknown'}</span>
                  <span className="study-description">
                    {study.metadata?.studyDescription || 'No description'}
                  </span>
                  <span className="study-images">
                    {study.metadata?.totalImages || 0} images
                  </span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
};

// Helper function to get modality icon
const getModalityIcon = (modality) => {
  switch (modality?.toUpperCase()) {
    case 'CT': return 'circle-notch';
    case 'MR': return 'brain';
    case 'XR': case 'CR': case 'DX': return 'x-ray';
    case 'US': return 'wave-square';
    case 'MG': return 'ribbon';
    case 'NM': case 'PT': return 'atom';
    default: return 'image';
  }
};

export default ImagingDashboard;
