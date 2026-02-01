export type Scene = {
  id: string;
  lessonId: string | null;
  sceneNumber: number;
  title: string;
  storyText: string;
  learningObjective: string;
  visualType: "image" | "geogebra" | "video";
  imageUrl: string | null;
  geogebraConfig: string | null;
  narrationUrl: string | null;
  narrationDuration: number | null;
  backgroundMusicUrl: string | null;
  hasQuiz: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  narrationAlignment: {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
  } | null;
};

export type Quiz = {
  id: string;
  sceneId: string | null;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export interface ScenePlayerProps {
  scene: Scene;
  quiz?: Quiz | null;

  // Navigation
  currentSceneIndex: number;
  totalScenes: number;
  onNext: () => void;
  onPrev: () => void;

  // Settings
  autoAdvance: boolean;
  onAutoAdvanceChange: (value: boolean) => void;

  // Callbacks
  onQuizComplete: (correct: boolean) => void;
  onSceneComplete: () => void;
}
