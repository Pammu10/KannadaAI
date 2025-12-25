import React, { useState, useEffect } from 'react';
import { UserLevel, AppMode, Word, UserProgress, Badge } from './types';
import ChatInterface from './components/ChatInterface';
import LessonView from './components/LessonView';
import WordBank from './components/WordBank';
import Dashboard from './components/Dashboard';
import { BackIcon } from './components/Icons';

const INITIAL_BADGES: Badge[] = [
  { id: '1', name: 'Rookie', icon: '🌱', description: 'Learned first 10 words', unlocked: false, threshold: 10, type: 'words' },
  { id: '2', name: 'Chatter', icon: '🗣️', description: 'Sent 10 messages', unlocked: false, threshold: 10, type: 'streak' }, // Using streak type loosely for chat count for simplicity
  { id: '3', name: 'Scholar', icon: '🎓', description: 'Completed 5 lessons', unlocked: false, threshold: 5, type: 'lessons' },
];

function App() {
  const [mode, setMode] = useState<AppMode>('onboarding');
  const [level, setLevel] = useState<UserLevel>(UserLevel.BEGINNER);
  const [wordBank, setWordBank] = useState<Word[]>([]);
  const [isWordBankOpen, setIsWordBankOpen] = useState(false);

  // User Progress State
  const [userProgress, setUserProgress] = useState<UserProgress>({
    points: 0,
    streak: 1,
    lessonsCompleted: 0,
    wordsLearned: 0,
    badges: INITIAL_BADGES,
  });

  const checkBadges = (currentProgress: UserProgress) => {
    const updatedBadges = currentProgress.badges.map(badge => {
      if (badge.unlocked) return badge;
      let unlocked = false;
      if (badge.type === 'words' && currentProgress.wordsLearned >= badge.threshold) unlocked = true;
      if (badge.type === 'lessons' && currentProgress.lessonsCompleted >= badge.threshold) unlocked = true;
      // Simple mock for chat badge
      return unlocked ? { ...badge, unlocked: true } : badge;
    });
    return updatedBadges;
  };

  const handleUpdateWordBank = (newWords: Word[]) => {
    setWordBank(prev => {
      const existing = new Set(prev.map(w => w.kannada));
      const filtered = newWords.filter(w => !existing.has(w.kannada));
      const updated = [...filtered, ...prev]; // Don't limit size for word bank to be useful
      
      if (filtered.length > 0) {
        // Update stats
        setUserProgress(curr => {
            const nextWords = curr.wordsLearned + filtered.length;
            const newProgress = { ...curr, wordsLearned: nextWords };
            newProgress.badges = checkBadges(newProgress);
            return newProgress;
        });
      }
      
      return updated;
    });
  };

  const handleLessonComplete = () => {
    setUserProgress(curr => {
        const nextLessons = curr.lessonsCompleted + 1;
        const newProgress = { 
            ...curr, 
            points: curr.points + 50, 
            lessonsCompleted: nextLessons 
        };
        newProgress.badges = checkBadges(newProgress);
        return newProgress;
    });
    setMode('dashboard');
  };

  const handleLevelSelect = (selectedLevel: UserLevel) => {
    setLevel(selectedLevel);
    setMode('dashboard');
  };

  const renderOnboarding = () => (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-br from-yellow-50 to-orange-100">
      <div className="w-20 h-20 bg-yellow-400 rounded-2xl rotate-3 shadow-xl mb-8 flex items-center justify-center">
        <span className="text-4xl font-bold text-white font-kannada">ಕ</span>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Kannada.ai</h1>
      <p className="text-center text-gray-600 mb-10 leading-relaxed">
        Master Kannada through adaptive AI lessons and natural conversations.
      </p>

      <div className="w-full space-y-3 max-w-sm">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest text-center mb-4">Select your level</p>
        
        {Object.values(UserLevel).map((lvl) => (
          <button
            key={lvl}
            onClick={() => handleLevelSelect(lvl)}
            className="w-full py-4 px-6 bg-white rounded-xl shadow-sm border border-gray-100 font-semibold text-gray-700 hover:border-yellow-400 hover:text-yellow-600 transition-all active:scale-95 text-left flex justify-between items-center group"
          >
            <span>{lvl}</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-yellow-500">→</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto h-full bg-white relative shadow-2xl overflow-hidden flex flex-col">
      {mode === 'onboarding' && renderOnboarding()}
      
      {mode === 'dashboard' && (
          <Dashboard 
            progress={userProgress} 
            level={level} 
            setMode={setMode}
            onChangeLevel={() => setMode('onboarding')}
          />
      )}
      
      {(mode === 'conversation' || mode === 'lesson') && (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="h-16 flex items-center px-4 border-b border-gray-100 bg-white z-10 shrink-0">
                <button 
                    onClick={() => {
                        setMode('dashboard');
                        setIsWordBankOpen(false);
                    }}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-full"
                >
                    <BackIcon className="w-6 h-6" />
                </button>
                <span className="font-bold text-lg ml-2 capitalize">{mode}</span>
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-yellow-600 font-bold text-sm">+{userProgress.points} XP</span>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative bg-gray-50">
                {mode === 'conversation' && (
                    <ChatInterface level={level} onUpdateWordBank={handleUpdateWordBank} />
                )}
                {mode === 'lesson' && (
                    <LessonView 
                        level={level} 
                        onUpdateWordBank={handleUpdateWordBank}
                        onComplete={handleLessonComplete}
                    />
                )}
            </div>

            {/* Word Bank Drawer */}
            <WordBank 
                words={wordBank} 
                isOpen={isWordBankOpen} 
                setIsOpen={setIsWordBankOpen} 
            />
        </div>
      )}
    </div>
  );
}

export default App;