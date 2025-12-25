export enum UserLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
}

export interface Word {
  kannada: string;
  transliteration: string; // Kanglish/Latin script
  english: string;
  category?: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string; // Emoji or icon name
  description: string;
  unlocked: boolean;
  threshold: number; // e.g. 10 words
  type: 'words' | 'lessons' | 'streak';
}

export interface UserProgress {
  points: number;
  streak: number;
  lessonsCompleted: number;
  wordsLearned: number;
  badges: Badge[];
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  vocabulary?: Word[]; // Vocabulary extracted from this specific message
  translation?: string; // Optional English translation of the whole sentence
}

export interface LessonContent {
  title: string;
  concept: string;
  explanation: string;
  examples: Array<Word>;
  quizQuestion: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  };
}

export type AppMode = 'onboarding' | 'dashboard' | 'conversation' | 'lesson';