import React from 'react';
import { UserProgress, UserLevel, AppMode } from '../types';
import { TrophyIcon, FlameIcon, StarIcon, BookIcon, ChatIcon } from './Icons';

interface DashboardProps {
  progress: UserProgress;
  level: UserLevel;
  setMode: (mode: AppMode) => void;
  onChangeLevel: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ progress, level, setMode, onChangeLevel }) => {
  // Calculate level progress (mock calculation)
  const nextLevelPoints = 500;
  const progressPercent = Math.min((progress.points / nextLevelPoints) * 100, 100);

  return (
    <div className="flex flex-col h-full bg-gray-50 p-6 overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pt-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Namaskara! 🙏</h2>
          <p className="text-gray-500 text-sm">Let's learn Kannada.</p>
        </div>
        <div 
             className="px-3 py-1 bg-white border border-gray-200 rounded-full flex items-center gap-2 cursor-pointer shadow-sm"
             onClick={onChangeLevel}
        >
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-xs font-bold text-gray-600">{level}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            <div className="text-orange-500 mb-2">
                <FlameIcon className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{progress.streak}</span>
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Day Streak</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            <div className="text-yellow-500 mb-2">
                <StarIcon className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{progress.points}</span>
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Points</span>
        </div>
      </div>

      {/* Level Progress */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-gray-800">Level Progress</span>
            <span className="text-sm text-yellow-600 font-bold">{progress.points} / {nextLevelPoints} XP</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
                className="h-full bg-yellow-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
            ></div>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
            Earn {nextLevelPoints - progress.points} more XP to reach the next milestone!
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-4 mb-8">
        <button 
          onClick={() => setMode('lesson')}
          className="w-full bg-white p-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 hover:border-yellow-300 transition-all text-left group flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
            <BookIcon className="w-6 h-6" />
          </div>
          <div>
              <h3 className="text-lg font-bold text-gray-800">Start Lesson</h3>
              <p className="text-gray-500 text-xs mt-0.5">Grammar, Vocabulary & Quiz</p>
          </div>
        </button>

        <button 
          onClick={() => setMode('conversation')}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 p-4 rounded-2xl shadow-lg text-left text-white group flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-white/20 text-white rounded-full flex items-center justify-center text-xl shrink-0 backdrop-blur-sm group-hover:scale-110 transition-transform">
            <ChatIcon className="w-6 h-6" />
          </div>
          <div>
              <h3 className="text-lg font-bold">Practice Conversation</h3>
              <p className="text-yellow-50 text-xs mt-0.5">Chat with AI Tutor Sneha</p>
          </div>
        </button>
      </div>

      {/* Badges Section */}
      <div>
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-yellow-500" />
            Achievements
        </h3>
        <div className="grid grid-cols-3 gap-3">
            {progress.badges.map((badge) => (
                <div 
                    key={badge.id} 
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 text-center border ${
                        badge.unlocked 
                        ? 'bg-yellow-50 border-yellow-200' 
                        : 'bg-gray-50 border-gray-100 opacity-60 grayscale'
                    }`}
                >
                    <span className="text-2xl mb-1">{badge.icon}</span>
                    <span className={`text-[10px] font-bold leading-tight ${badge.unlocked ? 'text-yellow-800' : 'text-gray-400'}`}>
                        {badge.name}
                    </span>
                </div>
            ))}
        </div>
      </div>

      <div className="mt-auto pt-8 text-center">
         <p className="text-xs text-gray-400">Powered by Gemini 2.5</p>
      </div>
    </div>
  );
};

export default Dashboard;