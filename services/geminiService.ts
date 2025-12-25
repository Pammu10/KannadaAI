import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { UserLevel, LessonContent, Word } from "../types";

// Support both standard process.env (Node/Webpack) and import.meta.env (Vite)
// In Vercel, set your environment variable as VITE_API_KEY
const apiKey = (import.meta as any).env?.VITE_API_KEY || process.env.API_KEY;

if (!apiKey) {
  console.warn("Missing API_KEY or VITE_API_KEY. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

// --- Audio State Management ---
let currentAudioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

export const stopAudio = () => {
  if (currentSource) {
    try {
      currentSource.stop();
    } catch (e) {
      // Ignore if already stopped
    }
    currentSource = null;
  }
  if (currentAudioContext) {
    try {
      currentAudioContext.close();
    } catch (e) {
      // Ignore
    }
    currentAudioContext = null;
  }
  // Also cancel browser TTS if active
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

// --- Schemas ---

const wordSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    kannada: { type: Type.STRING, description: "The word in Kannada script" },
    transliteration: { type: Type.STRING, description: "The word in English/Latin characters" },
    english: { type: Type.STRING, description: "English meaning" },
    category: { type: Type.STRING, description: "Category of the word (e.g., Greetings, Food, Verbs)" },
  },
  required: ["kannada", "transliteration", "english"],
};

const chatResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    reply: { type: Type.STRING, description: "The conversational response in Kannada (with English helper text if beginner)." },
    translation: { type: Type.STRING, description: "The full English translation of the Kannada response." },
    nextQuestion: { type: Type.STRING, description: "A follow-up question to keep the conversation going." },
    vocabulary: {
      type: Type.ARRAY,
      items: wordSchema,
      description: "List of 3-5 key words used in the reply or relevant to the context.",
    },
  },
  required: ["reply", "vocabulary", "translation", "nextQuestion"],
};

const lessonResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    concept: { type: Type.STRING, description: "Brief description of the grammatical concept or topic" },
    explanation: { type: Type.STRING, description: "Clear, simple explanation suitable for the user's level" },
    examples: {
      type: Type.ARRAY,
      items: wordSchema,
      description: "3 sentences or phrases demonstrating the concept",
    },
    quizQuestion: {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING },
        options: { type: Type.ARRAY, items: { type: Type.STRING } },
        correctAnswer: { type: Type.STRING, description: "The correct text answer" },
        explanation: { type: Type.STRING, description: "Why this is the correct answer" },
      },
      required: ["question", "options", "correctAnswer", "explanation"],
    },
  },
  required: ["title", "concept", "explanation", "examples", "quizQuestion"],
};

// --- Audio Helper ---

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Helper to remove markdown, symbols, and emojis that confuse the TTS model
function cleanTextForTTS(text: string): string {
  if (!text) return "";
  // Remove markdown bold/italic (*, _, `, ~)
  let cleaned = text.replace(/[\*_`~]/g, '');
  // Remove braces or brackets commonly used for metadata
  cleaned = cleaned.replace(/[\{\}\[\]\(\)]/g, '');
  // Remove common emoji ranges (roughly)
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '');
  
  return cleaned.trim();
}

// Robust browser fallback
function speakWithBrowser(text: string) {
  if (!('speechSynthesis' in window)) return;

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  
  // Attempt to find a Kannada or Indian voice
  const preferredVoice = 
    voices.find(v => v.lang === 'kn-IN') || 
    voices.find(v => v.lang.includes('kn')) ||
    voices.find(v => v.lang === 'hi-IN') || 
    voices.find(v => v.lang === 'en-IN');

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }
  
  // Adjust based on language detection (simple heuristic)
  const isKannada = /[\u0C80-\u0CFF]/.test(text);
  utterance.lang = isKannada ? 'kn-IN' : 'en-US';
  utterance.rate = 0.9; // Slightly slower is usually clearer

  window.speechSynthesis.speak(utterance);
}

// --- API Calls ---

export const playAudio = async (text: string) => {
  // Stop any previous audio
  stopAudio();

  const cleanText = cleanTextForTTS(text);
  if (!cleanText) return;

  try {
    // If text is very short or looks like a system message, skip AI generation to save latency/quota
    // and prevent model confusion errors.
    if (cleanText.length < 3 && !/[\u0C80-\u0CFF]/.test(cleanText)) {
        throw new Error("Text too short for AI TTS");
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, 
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data returned from Gemini");
    }

    currentAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const outputNode = currentAudioContext.createGain();
    outputNode.connect(currentAudioContext.destination);

    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      currentAudioContext,
      24000,
      1,
    );
    currentSource = currentAudioContext.createBufferSource();
    currentSource.buffer = audioBuffer;
    currentSource.connect(outputNode);
    currentSource.start();
    
    // Cleanup when done
    currentSource.onended = () => {
        currentSource = null;
    };

  } catch (error) {
    // Silently fall back to browser TTS
    console.debug("Gemini TTS failed or skipped, using browser fallback.", error);
    speakWithBrowser(cleanText);
  }
};

export const generateLesson = async (level: UserLevel, topic?: string): Promise<LessonContent> => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Create a short, engaging Kannada language lesson for a ${level} level learner.
    ${topic ? `Focus on the topic: ${topic}.` : "Choose a relevant topic based on their level."}
    
    The explanation should be in English.
    Provide examples in Kannada with Transliteration and English.
    Assign a category to each example word/phrase.
    Include a single quiz question that requires a spoken answer.
    
    Structure the response strictly according to the JSON schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: lessonResponseSchema,
        systemInstruction: "You are an expert Kannada tutor. Create content for a mobile voice-first app."
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as LessonContent;
  } catch (error) {
    console.error("Lesson generation failed", error);
    throw error;
  }
};

export const chatWithTutor = async (
  message: string, 
  history: { role: 'user' | 'model'; text: string }[], 
  level: UserLevel
): Promise<{ reply: string; translation: string; nextQuestion: string; vocabulary: Word[] }> => {
  const model = "gemini-3-flash-preview";

  const contents = history.map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));

  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: chatResponseSchema,
        systemInstruction: `
          You are a voice-based Kannada tutor named "Sneha".
          Level: ${level}.
          
          Guidelines:
          1. Reply conversationally. Short sentences (max 2).
          2. Use Kannada suitable for the level + English helper.
          3. ALWAYS ask a follow-up "nextQuestion" to keep the user talking.
          4. Extract useful vocabulary.
        `
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Chat generation failed", error);
    return {
      reply: "Kshamisi, connectivity problem.",
      translation: "Sorry, connectivity problem.",
      nextQuestion: "Can you repeat that?",
      vocabulary: []
    };
  }
};

// Helper to validate quiz answer loosely
export const validateAnswer = async (userAnswer: string, correctAnswer: string): Promise<boolean> => {
    // Simple check first
    if (userAnswer.toLowerCase().includes(correctAnswer.toLowerCase())) return true;
    
    // AI check for semantic similarity
    const model = "gemini-3-flash-preview";
    try {
        const response = await ai.models.generateContent({
            model,
            contents: `Is the answer "${userAnswer}" effectively correct or close enough for the question expecting "${correctAnswer}"? Reply TRUE or FALSE only.`,
        });
        return response.text?.trim().toUpperCase().includes("TRUE") || false;
    } catch {
        return false;
    }
}