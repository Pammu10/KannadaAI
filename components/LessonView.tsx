import React, { useState, useEffect } from 'react';
import { LessonContent, UserLevel, Word } from '../types';
import { generateLesson, playAudio, validateAnswer } from '../services/geminiService';
import { SparklesIcon, VolumeIcon, TrophyIcon } from './Icons';
import VoiceControl from './VoiceControl';

interface LessonViewProps {
  level: UserLevel;
  onUpdateWordBank: (words: Word[]) => void;
  onComplete: () => void;
}

const LessonView: React.FC<LessonViewProps> = ({ level, onUpdateWordBank, onComplete }) => {
  const [lesson, setLesson] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizState, setQuizState] = useState<'idle' | 'listening' | 'verifying' | 'success' | 'failure'>('idle');
  const [userAnswer, setUserAnswer] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchLesson = async () => {
      setLoading(true);
      try {
        const data = await generateLesson(level);
        if (mounted) {
            setLesson(data);
            if (data.examples) {
                onUpdateWordBank(data.examples);
            }
            // Auto-play the explanation concept audio slightly delayed
            setTimeout(() => playAudio(`Let's learn about ${data.title}. ${data.concept}`), 1000);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchLesson();
    return () => { mounted = false; };
  }, [level]);

  const handleVoiceAnswer = async (transcript: string) => {
    if (!lesson) return;
    setUserAnswer(transcript);
    setQuizState('verifying');

    const isCorrect = await validateAnswer(transcript, lesson.quizQuestion.correctAnswer);
    
    if (isCorrect) {
        setQuizState('success');
        playAudio("Sari! That is correct. Very good!");
    } else {
        setQuizState('failure');
        playAudio(`Not quite. The answer is ${lesson.quizQuestion.correctAnswer}. Try saying it.`);
    }
  };

  const handleRetry = () => {
    setQuizState('idle');
    setUserAnswer('');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
        <div className="relative">
            <div className="absolute inset-0 bg-yellow-200 blur-xl opacity-50 rounded-full animate-pulse"></div>
            <SparklesIcon className="w-12 h-12 text-yellow-600 relative z-10 animate-bounce" />
        </div>
        <p className="text-gray-500 font-medium">Generating your lesson...</p>
      </div>
    );
  }

  if (!lesson) return <div className="p-8 text-center">Error loading lesson. <button onClick={onComplete}>Back</button></div>;

  return (
    <div className="h-full overflow-y-auto p-5 pb-48 no-scrollbar bg-white">
      {/* Lesson Content */}
      <div className="space-y-6">
        <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-100">
          <h2 className="text-2xl font-bold text-gray-900">{lesson.title}</h2>
          <p className="text-gray-600 mt-2 leading-relaxed">{lesson.explanation}</p>
        </div>

        <div className="space-y-3">
             {lesson.examples.map((ex, i) => (
                 <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                     <div>
                        <p className="font-bold text-lg text-gray-900 font-kannada">{ex.kannada}</p>
                        <p className="text-sm text-gray-500">{ex.english}</p>
                     </div>
                     <button onClick={() => playAudio(ex.kannada)} className="p-2 rounded-full hover:bg-white text-yellow-600">
                        <VolumeIcon className="w-5 h-5" />
                     </button>
                 </div>
             ))}
        </div>
      </div>

      {/* Voice Quiz Section */}
      <div className="mt-10 border-t border-gray-100 pt-6">
        <div className="text-center mb-4">
            <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Voice Challenge</span>
            <h3 className="text-xl font-bold text-gray-900 mt-2">{lesson.quizQuestion.question}</h3>
            {quizState === 'failure' && (
                <p className="text-red-500 text-sm mt-2">Correct Answer: {lesson.quizQuestion.correctAnswer}</p>
            )}
        </div>

        {/* Feedback Area */}
        {quizState === 'success' && (
            <div className="bg-green-50 p-4 rounded-xl text-center mb-4 border border-green-100 animate-bounce-short">
                <TrophyIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-bold text-green-700">Correct! +50 XP</p>
                <p className="text-sm text-green-600">"{userAnswer}"</p>
            </div>
        )}
        
        {quizState === 'failure' && (
             <div className="bg-red-50 p-4 rounded-xl text-center mb-4 border border-red-100">
                <p className="font-bold text-red-700">Try Again!</p>
                <p className="text-sm text-red-600 line-through">"{userAnswer}"</p>
            </div>
        )}

        {/* Controls */}
        <div className="flex flex-col items-center">
            {quizState === 'success' ? (
                 <button 
                    onClick={onComplete}
                    className="bg-green-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform w-full"
                >
                    Complete Lesson
                </button>
            ) : (
                <div className="w-full relative">
                    <VoiceControl 
                        onResult={handleVoiceAnswer} 
                        isProcessing={quizState === 'verifying'} 
                        placeholder="Hold to Answer"
                    />
                    {quizState === 'failure' && (
                        <button 
                            onClick={handleRetry}
                            className="absolute right-0 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-gray-600 px-4"
                        >
                            Reset
                        </button>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LessonView;