import { useState } from 'react';
import VoiceButton from './VoiceButton';
import VoiceWaveform from './VoiceWaveform';

interface SpeechRecognitionProps {
  onTranscript: (text: string) => void;
  language?: 'en-US' | 'am-ET';
}

export default function SpeechRecognitionComponent({ onTranscript, language = 'en-US' }: SpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = language;

    rec.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(finalTranscript);
        onTranscript(finalTranscript);
      }
    };

    rec.onend = () => setIsListening(false);
    rec.start();
    setRecognition(rec);
    setIsListening(true);
  };

  const stopListening = () => {
    recognition?.stop();
    setIsListening(false);
  };

  const toggle = () => {
    if (isListening) stopListening();
    else startListening();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <VoiceWaveform isActive={isListening} color="gold" />
      <VoiceButton isListening={isListening} isProcessing={false} onToggle={toggle} size="lg" />
      {transcript && (
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 max-w-sm text-center">
          <p className="text-xs text-white/40 mb-1">Recognized:</p>
          <p className="text-sm text-white">{transcript}</p>
        </div>
      )}
    </div>
  );
}
