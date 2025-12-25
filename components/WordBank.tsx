import React, { useState, useMemo } from 'react';
import { Word } from '../types';
import { ChevronUpIcon, ChevronDownIcon, BookIcon, VolumeIcon, SparklesIcon } from './Icons';
import { playAudio } from '../services/geminiService';

interface WordBankProps {
  words: Word[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const WordBank: React.FC<WordBankProps> = ({ words, isOpen, setIsOpen }) => {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  const handlePlay = async (text: string, index: number) => {
    setPlayingIndex(index);
    await playAudio(text);
    setPlayingIndex(null);
  };

  const categorizedWords = useMemo(() => {
    const grouped: { [key: string]: Word[] } = {};
    words.forEach(word => {
      const cat = word.category || 'General';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(word);
    });
    return grouped;
  }, [words]);

  if (words.length === 0) return null;

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out z-30 border-t border-yellow-100 ${
        isOpen ? 'h-[60vh]' : 'h-16'
      } rounded-t-3xl flex flex-col`}
    >
      {/* Header / Toggle Handle */}
      <div 
        className="h-16 flex items-center justify-between px-6 cursor-pointer bg-yellow-50 rounded-t-3xl shrink-0"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-full text-yellow-700">
            <BookIcon className="w-5 h-5" />
          </div>
          <span className="font-bold text-gray-800">Word Bank</span>
          <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium">
            {words.length} words
          </span>
        </div>
        <div className="text-gray-400">
          {isOpen ? <ChevronDownIcon /> : <ChevronUpIcon />}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        {Object.entries(categorizedWords).map(([category, categoryWords]) => (
          <div key={category} className="mb-6">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">{category}</h3>
             <div className="space-y-3">
                {(categoryWords as Word[]).map((word, idx) => {
                  // Create a unique key using category and index
                  const globalIdx = idx + category.length; 
                  return (
                    <div key={`${category}-${idx}`} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-yellow-200 transition-colors">
                      <div className="flex-1">
                        <p className="font-bold text-lg text-gray-900 leading-tight font-kannada">
                          {word.kannada}
                        </p>
                        <p className="text-sm text-yellow-700 font-medium">
                          {word.transliteration}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {word.english}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlay(word.kannada, globalIdx);
                        }}
                        className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
                        disabled={playingIndex === globalIdx}
                      >
                        {playingIndex === globalIdx ? (
                          <SparklesIcon className="w-5 h-5 animate-spin text-yellow-500" />
                        ) : (
                          <VolumeIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  );
                })}
             </div>
          </div>
        ))}
        <div className="h-4"></div>
      </div>
    </div>
  );
};

export default WordBank;