import React, { useState, useRef, useEffect } from 'react';
import { Message, UserLevel, Word } from '../types';
import { chatWithTutor, playAudio } from '../services/geminiService';
import { SendIcon, SparklesIcon } from './Icons';
import VoiceControl from './VoiceControl';

interface ChatInterfaceProps {
  level: UserLevel;
  onUpdateWordBank: (words: Word[]) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ level, onUpdateWordBank }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'model',
      text: `Namaskara! I am Sneha. Press the mic to talk.`,
      vocabulary: [],
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial greeting audio
  useEffect(() => {
    playAudio("Namaskara! Heggiddira?"); // Simple greeting audio on load
  }, []);

  const handleVoiceResult = async (transcript: string) => {
    if (!transcript.trim()) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: transcript,
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsProcessing(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const response = await chatWithTutor(transcript, history, level);

      const newModelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.reply,
        translation: response.translation,
        vocabulary: response.vocabulary,
      };

      setMessages(prev => [...prev, newModelMsg]);
      
      if (response.vocabulary && response.vocabulary.length > 0) {
        onUpdateWordBank(response.vocabulary);
      }

      // Voice Response
      // Combine reply and next question for audio
      const fullAudioText = `${response.reply} ${response.nextQuestion || ''}`;
      playAudio(fullAudioText);

    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-48 no-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm text-base ${
                msg.role === 'user'
                  ? 'bg-yellow-500 text-white rounded-br-none'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
            </div>
            
            {msg.translation && (
              <div className="mt-1 ml-2 max-w-[80%]">
                <p className="text-xs text-gray-400 italic">
                  "{msg.translation}"
                </p>
              </div>
            )}
          </div>
        ))}
        {isProcessing && (
          <div className="flex items-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-yellow-500 animate-pulse" />
              <span className="text-sm text-gray-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/90 to-transparent pb-6 pt-12">
        <VoiceControl 
            onResult={handleVoiceResult} 
            isProcessing={isProcessing} 
            lang={level === UserLevel.BEGINNER ? 'en-US' : 'kn-IN'} // Easier for beginners to use English mix
            placeholder={level === UserLevel.BEGINNER ? "Hold to speak (English/Kannada)" : "ಮಾತನಾಡಿ (Hold to Speak)"}
        />
      </div>
    </div>
  );
};

export default ChatInterface;