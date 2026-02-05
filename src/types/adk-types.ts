/**
 * TypeScript types matching ADK backend Pydantic schemas
 * Sync with: fable-lab-adk/fable_agent/agent.py
 */

// =============================================================================
// Visual Style Guide Types (for consistent image generation)
// =============================================================================

export interface CharacterSpec {
  name: string;
  role: "main" | "supporting" | "background";
  appearance: string;
  key_features: string[];
  age_group: string;
  personality_traits: string[];
}

export interface EnvironmentSpec {
  setting_type: string;
  time_of_day: string;
  weather: string;
  color_palette: Record<string, string>;
  lighting_style: string;
}

export interface ArtStyleSpec {
  medium: string;
  technique: string;
  inspiration: string;
  detail_level: string;
  aspect_ratio: string;
  technical_keywords: string[];
}

export interface VisualStyleGuide {
  story_theme: string;
  target_audience_visual: string;
  art_direction: ArtStyleSpec;
  characters: CharacterSpec[];
  environment: EnvironmentSpec;
  style_rules: string[];
  technical_tokens: string;
}

// =============================================================================
// Story Content Types
// =============================================================================

export interface SceneContent {
  scene_id: string;
  scene_number: number;
  title: string;
  image_prompt: string;
  style_references: string[];
  narration: string;
}

export interface Question {
  question: string;
  type: "multiple_choice" | "input";
  options?: string[];
  answer: string;
  hint: string;
}

export interface StoryContentOutput {
  visual_style_guide: VisualStyleGuide;
  scenes: SceneContent[];
  questions: Question[];
  summary: string;
}

// =============================================================================
// GeoGebra Experiment Types
// =============================================================================

export interface GeoGebraExperimentOutput {
  geogebra_commands: string[];
  setup_instructions: string;
  interaction_guide: string;
  learning_objectives: string[];
}

// =============================================================================
// Completion Status Types
// =============================================================================

export interface CompletionStatus {
  status: "success" | "error";
  message: string;
  story_scenes_count: number;
  has_experiment: boolean;
  completion_timestamp: string;
}

// =============================================================================
// Librarian Tool Output Types
// =============================================================================

export interface SceneBreakdown {
  scene_number: number;
  concept: string;
  story_element: string;
  complexity: "basic" | "intermediate" | "advanced";
  has_question: boolean;
  question_type?: "multiple_choice" | "input";
}

export interface StorySuggestion {
  detected_education_level: string;
  detected_scene_count: string;
  suggested_total_scenes: number;
  scene_breakdown: SceneBreakdown[];
  story_theme: string;
  learning_progression: string;
  question_placement: string;
}

export interface GeoGebraFeatures {
  recommended_commands: string[];
  experiment_type: string;
  complexity_tier: "simple" | "moderate" | "complex";
  key_features: string[];
  setup_requirements: string;
}

export interface LibrarianOutput {
  story_suggestion: StorySuggestion;
  geogebra_features: GeoGebraFeatures;
}

// =============================================================================
// Orchestrator Output Types
// =============================================================================

export interface GrandTheme {
  overall_story_concept: string;
  main_learning_objectives: string[];
  target_audience: string;
  education_level: string;
  scene_count_tier: "short" | "medium" | "long";
  total_scenes: number;
}

export interface SceneOutlineItem {
  scene_number: number;
  title: string;
  brief: string;
  learning_goal: string;
  has_question: boolean;
  question_type?: "multiple_choice" | "input";
  difficulty_tier: "basic" | "intermediate" | "advanced";
}

export interface InteractiveExperiment {
  experiment_concept: string;
  complexity_level: "simple" | "moderate" | "complex";
  learning_objectives: string[];
  story_connection: string;
}

export interface OrchestratorOutput {
  grand_theme: GrandTheme;
  scene_breakdown: SceneOutlineItem[];
  interactive_experiment: InteractiveExperiment;
}

// =============================================================================
// Agent Event Types (SSE from ADK)
// =============================================================================

export interface AgentEvent {
  id?: string;
  author: string;
  content?: {
    parts?: Array<{
      text?: string;
      functionCall?: { name: string; args: Record<string, unknown> };
      functionResponse?: { name: string; response: unknown };
    }>;
  };
  partial?: boolean;
  actions?: {
    stateDelta?: Record<string, unknown>;
  };
  isFinalResponse?: boolean;
  timestamp?: string;
}

// =============================================================================
// Agent Names (for UI handling)
// =============================================================================

export type AgentName =
  | "Orchestrator"
  | "Librarian"
  | "Plotter"
  | "GraphMasterResearcher"
  | "GraphMasterFormatter"
  | "GraphMasterValidator"
  | "GraphMasterPipeline"
  | "ParallelContentCreators"
  | "Finisher";
