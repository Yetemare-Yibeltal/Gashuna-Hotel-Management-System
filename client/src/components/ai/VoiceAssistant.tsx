import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2, Square } from 'lucide-react';
import { useVoiceStore } from '../../store/ai/voiceStore';
import { classNames } from '../../lib/utils';

interface VoiceAssistantProps {
  guestId?: string;
  className?: string;
}

export default function VoiceAssistant({ guestId, className }: VoiceAssistantProps) {
  const {
    isListening, isProcessing, isPlaying, transcribedText, responseText,
    language, error, startSession, sessionId, processAudio, setListening,
    setLanguage, endSession, reset,
  } = useVoiceStore();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (!sessionId) startSession(guestId);
    return () => { endSession(); };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        await processAudio(audioBlob, guestId);
      };

      mediaRecorder.start(100);
      setListening(true);
    } catch {
      setHasPermission(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setListening(false);
  };

  const toggleRecording = () => {
    if (isListening) stopRecording();
    else startRecording();
  };

  return (
    <div className={classNames('flex flex-col items-center gap-6 p-8', className)}>
      {/* Language Toggle */}
      <div className="flex gap-2">
        {(['en', 'am', 'auto'] as const).map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={classNames(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              language === lang
                ? 'bg-amber-600 text-white'
                : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
            )}
          >
            {lang === 'en' ? 'English' : lang === 'am' ? 'አማርኛ' : 'Auto'}
          </button>
        ))}
      </div>

      {/* Microphone Button */}
      <div className="relative">
        {isListening && (
          <>
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
            <div className="absolute -inset-3 rounded-full bg-red-500/10 animate-pulse" />
          </>
        )}
        <button
          onClick={toggleRecording}
          disabled={isProcessing}
          className={classNames(
            'relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl',
            isListening
              ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
              : isProcessing
              ? 'bg-amber-600/50 cursor-not-allowed'
              : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30 hover:scale-105'
          )}
        >
          {isProcessing ? (
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          ) : isListening ? (
            <Square className="w-10 h-10 text-white" />
          ) : (
            <Mic className="w-10 h-10 text-white" />
          )}
        </button>
      </div>

      {/* Status */}
      <div className="text-center">
        {isListening && (
          <p className="text-sm text-red-400 font-medium animate-pulse">
            🎙️ Recording... Tap to stop
          </p>
        )}
        {isProcessing && (
          <p className="text-sm text-amber-400 font-medium">
            ⚙️ Processing your request...
          </p>
        )}
        {isPlaying && (
          <p className="text-sm text-emerald-400 font-medium flex items-center justify-center gap-2">
            <Volume2 className="w-4 h-4" />
            Playing response...
          </p>
        )}
        {!isListening && !isProcessing && !isPlaying && (
          <p className="text-sm text-white/40">
            Tap the microphone to speak
          </p>
        )}
      </div>

      {/* Transcription & Response */}
      {(transcribedText || responseText) && (
        <div className="w-full max-w-sm space-y-3">
          {transcribedText && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1 font-medium">You said:</p>
              <p className="text-sm text-white">{transcribedText}</p>
            </div>
          )}
          {responseText && (
            <div className="bg-amber-600/10 border border-amber-600/20 rounded-xl p-4">
              <p className="text-xs text-amber-500/70 mb-1 font-medium">AI Response:</p>
              <p className="text-sm text-white/80">{responseText}</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}

      {hasPermission === false && (
        <div className="text-center">
          <MicOff className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-400">Microphone permission denied.</p>
          <p className="text-xs text-white/40 mt-1">Please allow microphone access in your browser settings.</p>
        </div>
      )}
    </div>
  );
}
