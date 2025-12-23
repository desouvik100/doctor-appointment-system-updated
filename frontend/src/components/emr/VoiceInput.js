/**
 * VoiceInput Component
 * Speech recognition for doctor notes and prescriptions
 * Uses Web Speech API for voice-to-text conversion
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import './VoiceInput.css';

// Check for browser support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSpeechSupported = !!SpeechRecognition;

/**
 * Voice commands for medical shortcuts
 */
const MEDICAL_COMMANDS = {
  // Prescription shortcuts
  'tablet': 'Tab.',
  'capsule': 'Cap.',
  'syrup': 'Syr.',
  'injection': 'Inj.',
  'once daily': 'OD',
  'twice daily': 'BD',
  'thrice daily': 'TDS',
  'four times daily': 'QID',
  'before food': 'AC',
  'after food': 'PC',
  'at bedtime': 'HS',
  'as needed': 'SOS',
  'milligrams': 'mg',
  'milliliters': 'ml',
  'micrograms': 'mcg',
  
  // Common phrases
  'new line': '\n',
  'new paragraph': '\n\n',
  'full stop': '.',
  'comma': ',',
  'colon': ':',
  'semicolon': ';',
  
  // Medical terms normalization
  'blood pressure': 'BP',
  'heart rate': 'HR',
  'respiratory rate': 'RR',
  'temperature': 'Temp',
  'oxygen saturation': 'SpO2',
  'blood sugar': 'BS',
  'fasting blood sugar': 'FBS',
  'random blood sugar': 'RBS',
  'hemoglobin': 'Hb',
  'white blood cells': 'WBC',
  'red blood cells': 'RBC',
  'electrocardiogram': 'ECG',
  'chest x-ray': 'CXR',
  'ultrasound': 'USG',
  'computed tomography': 'CT',
  'magnetic resonance imaging': 'MRI'
};

/**
 * Process transcript with medical commands
 */
const processTranscript = (text, enableCommands = true) => {
  if (!enableCommands) return text;
  
  let processed = text;
  
  // Apply medical command replacements (case-insensitive)
  Object.entries(MEDICAL_COMMANDS).forEach(([phrase, replacement]) => {
    const regex = new RegExp(phrase, 'gi');
    processed = processed.replace(regex, replacement);
  });
  
  return processed;
};

/**
 * VoiceInput Component
 */
const VoiceInput = ({
  onTranscript,
  onFinalTranscript,
  placeholder = 'Click microphone to start speaking...',
  language = 'en-IN',
  continuous = true,
  interimResults = true,
  enableCommands = true,
  maxAlternatives = 1,
  className = '',
  disabled = false,
  showTranscript = true,
  autoStop = false,
  autoStopTimeout = 3000
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [volume, setVolume] = useState(0);
  
  const recognitionRef = useRef(null);
  const autoStopTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSpeechSupported) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;
    recognition.maxAlternatives = maxAlternatives;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
      stopVolumeMonitoring();
      
      // Clear auto-stop timer
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      stopVolumeMonitoring();
      
      switch (event.error) {
        case 'no-speech':
          setError('No speech detected. Please try again.');
          break;
        case 'audio-capture':
          setError('No microphone found. Please check your microphone.');
          break;
        case 'not-allowed':
          setError('Microphone access denied. Please allow microphone access.');
          break;
        case 'network':
          setError('Network error. Please check your connection.');
          break;
        default:
          setError(`Error: ${event.error}`);
      }
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;

        if (result.isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }

      if (final) {
        const processed = processTranscript(final, enableCommands);
        setTranscript(prev => prev + processed);
        setInterimTranscript('');
        
        if (onFinalTranscript) {
          onFinalTranscript(processed);
        }
        
        // Reset auto-stop timer on new speech
        if (autoStop && autoStopTimerRef.current) {
          clearTimeout(autoStopTimerRef.current);
          autoStopTimerRef.current = setTimeout(() => {
            stopListening();
          }, autoStopTimeout);
        }
      }

      if (interim) {
        const processed = processTranscript(interim, enableCommands);
        setInterimTranscript(processed);
        
        if (onTranscript) {
          onTranscript(processed, false);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopVolumeMonitoring();
    };
  }, [language, continuous, interimResults, maxAlternatives, enableCommands, onTranscript, onFinalTranscript, autoStop, autoStopTimeout]);

  // Volume monitoring for visual feedback
  const startVolumeMonitoring = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const AudioContextClass = window.AudioContext || window['webkitAudioContext'];
      audioContextRef.current = new AudioContextClass();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateVolume = () => {
        if (!analyserRef.current || !isListening) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setVolume(Math.min(100, average * 2));
        
        requestAnimationFrame(updateVolume);
      };
      
      updateVolume();
    } catch (err) {
      console.error('Error accessing microphone for volume:', err);
    }
  }, [isListening]);

  const stopVolumeMonitoring = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setVolume(0);
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || disabled) return;
    
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    
    try {
      recognitionRef.current.start();
      startVolumeMonitoring();
      
      // Set auto-stop timer if enabled
      if (autoStop) {
        autoStopTimerRef.current = setTimeout(() => {
          stopListening();
        }, autoStopTimeout);
      }
    } catch (err) {
      console.error('Error starting recognition:', err);
      setError('Failed to start voice recognition. Please try again.');
    }
  }, [disabled, startVolumeMonitoring, autoStop, autoStopTimeout]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.error('Error stopping recognition:', err);
    }
    
    // Clear auto-stop timer
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  const fullTranscript = transcript + interimTranscript;

  if (!isSpeechSupported) {
    return (
      <div className={`voice-input voice-input--unsupported ${className}`}>
        <div className="voice-input__error">
          <span className="voice-input__error-icon">🎤</span>
          <span>Speech recognition not supported in this browser</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`voice-input ${isListening ? 'voice-input--listening' : ''} ${className}`}>
      <div className="voice-input__controls">
        <button
          type="button"
          className={`voice-input__button ${isListening ? 'voice-input__button--active' : ''}`}
          onClick={toggleListening}
          disabled={disabled}
          title={isListening ? 'Stop recording' : 'Start recording'}
        >
          <span className="voice-input__icon">
            {isListening ? '⏹️' : '🎤'}
          </span>
          {isListening && (
            <span 
              className="voice-input__volume-indicator"
              style={{ transform: `scale(${1 + volume / 100})` }}
            />
          )}
        </button>
        
        {fullTranscript && (
          <button
            type="button"
            className="voice-input__clear"
            onClick={clearTranscript}
            title="Clear transcript"
          >
            ✕
          </button>
        )}
      </div>

      {isListening && (
        <div className="voice-input__status">
          <span className="voice-input__pulse" />
          <span>Listening...</span>
        </div>
      )}

      {error && (
        <div className="voice-input__error">
          <span className="voice-input__error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {showTranscript && (
        <div className="voice-input__transcript">
          {fullTranscript || (
            <span className="voice-input__placeholder">{placeholder}</span>
          )}
          {interimTranscript && (
            <span className="voice-input__interim">{interimTranscript}</span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * VoiceTextArea - Textarea with integrated voice input
 */
export const VoiceTextArea = ({
  value,
  onChange,
  placeholder = 'Type or use voice input...',
  rows = 4,
  language = 'en-IN',
  enableCommands = true,
  disabled = false,
  className = '',
  label,
  required = false,
  ...props
}) => {
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!isSpeechSupported) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onerror = (event) => {
      console.error('Speech error:', event.error);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let final = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        }
      }

      if (final) {
        const processed = processTranscript(final, enableCommands);
        const newValue = value + (value ? ' ' : '') + processed;
        onChange({ target: { value: newValue } });
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, [language, enableCommands, value, onChange]);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start:', e);
      }
    }
  };

  return (
    <div className={`voice-textarea ${className}`}>
      {label && (
        <label className="voice-textarea__label">
          {label}
          {required && <span className="voice-textarea__required">*</span>}
        </label>
      )}
      <div className="voice-textarea__wrapper">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className="voice-textarea__input"
          {...props}
        />
        {isSpeechSupported && (
          <button
            type="button"
            className={`voice-textarea__mic ${isListening ? 'voice-textarea__mic--active' : ''}`}
            onClick={toggleVoice}
            disabled={disabled}
            title={isListening ? 'Stop voice input' : 'Start voice input'}
          >
            {isListening ? '⏹️' : '🎤'}
            {isListening && <span className="voice-textarea__pulse" />}
          </button>
        )}
      </div>
      {isListening && (
        <div className="voice-textarea__status">
          <span className="voice-textarea__listening-dot" />
          Listening... Speak now
        </div>
      )}
    </div>
  );
};

/**
 * useVoiceInput Hook - For custom implementations
 */
export const useVoiceInput = (options = {}) => {
  const {
    language = 'en-IN',
    continuous = false,
    enableCommands = true,
    onResult,
    onError
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported] = useState(isSpeechSupported);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!isSpeechSupported) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = false;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => setIsListening(false);

    recognition.onerror = (event) => {
      setIsListening(false);
      setError(event.error);
      if (onError) onError(event.error);
    };

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      if (result.isFinal) {
        const text = processTranscript(result[0].transcript, enableCommands);
        setTranscript(text);
        if (onResult) onResult(text);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, [language, continuous, enableCommands, onResult, onError]);

  const start = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript('');
        recognitionRef.current.start();
      } catch (e) {
        setError('Failed to start');
      }
    }
  }, [isListening]);

  const stop = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    start,
    stop,
    toggle
  };
};

export default VoiceInput;
