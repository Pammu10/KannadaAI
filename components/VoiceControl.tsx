import React, { useState, useEffect, useRef } from 'react';
import { stopAudio } from '../services/geminiService';

interface VoiceControlProps {
  onResult: (text: string) => void;
  isProcessing?: boolean;
  placeholder?: string;
  lang?: string;
}

const VoiceControl: React.FC<VoiceControlProps> = ({ onResult, isProcessing, placeholder = "Hold to Speak", lang = 'kn-IN' }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // Keep latest callback in ref to avoid re-initializing recognition on prop change
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResultRef.current(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.onerror = (event: any) => {
         // Filter out 'no-speech' and 'aborted' without logging to avoid console clutter
         if (event.error === 'no-speech' || event.error === 'aborted') {
             setIsListening(false);
             return;
         }

         console.error("Speech recognition error", event.error);
         setIsListening(false);
         
         if (event.error === 'not-allowed') {
             alert("Microphone permission denied. Please enable it in browser settings.");
         }
      };

      recognitionRef.current = recognition;

      // Cleanup
      return () => {
        if (recognitionRef.current) {
            recognitionRef.current.abort();
            recognitionRef.current = null;
        }
      };
    } else {
        alert("Speech recognition not supported in this browser. Try Chrome or Safari.");
    }
  }, [lang]);

  const startListening = () => {
    stopAudio(); // Interrupt TTS
    
    if (recognitionRef.current) {
        // Double check state to avoid "already started" error
        if (isListening) return; 

        try {
            recognitionRef.current.start();
            setIsListening(true);
            if (navigator.vibrate) navigator.vibrate(50);
        } catch (e: any) {
            // Handle specific DOMException: InvalidStateError
            if (e.name === 'InvalidStateError' || e.message?.includes('already started')) {
                // Silently ignore already started
                setIsListening(true); 
            } else {
                console.error("Failed to start recognition:", e);
            }
        }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
          // Ignore errors on stop
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center pb-6 pt-2 select-none">
      <div className="relative group touch-none">
        {/* Ripple Effects */}
        {isListening && (
          <>
            <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-20"></div>
            <div className="absolute -inset-4 bg-yellow-200 rounded-full animate-pulse opacity-30"></div>
          </>
        )}
        
        {/* Main Button */}
        <button
          className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 ${
            isListening 
              ? 'bg-red-500 scale-110 shadow-red-200' 
              : isProcessing 
                 ? 'bg-gray-100 cursor-wait' 
                 : 'bg-yellow-500 hover:bg-yellow-400 active:scale-95 shadow-yellow-200'
          }`}
          onMouseDown={startListening}
          onMouseUp={stopListening}
          onMouseLeave={stopListening}
          onTouchStart={(e) => { 
              // Prevent default to stop mouse emulation, scrolling, zooming while holding
              e.preventDefault(); 
              startListening(); 
          }}
          onTouchEnd={(e) => { 
              e.preventDefault(); 
              stopListening(); 
          }}
          disabled={isProcessing}
        >
          {isProcessing ? (
             <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-white transition-transform ${isListening ? 'scale-110' : ''}`}>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
             </svg>
          )}
        </button>
      </div>
      
      <p className={`mt-4 font-medium text-sm transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
        {isListening ? "Listening..." : isProcessing ? "Thinking..." : placeholder}
      </p>
    </div>
  );
};

export default VoiceControl;