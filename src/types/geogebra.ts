export type GeoGebraAppName =
  | "graphing"
  | "geometry"
  | "3d"
  | "classic"
  | "scientific"
  | "notes";

export interface GeoGebraParameter {
  name: string;
  type: "slider" | "checkbox" | "input";
  min?: number;
  max?: number;
  step?: number;
  default?: number | boolean;
  label: string;
  description?: string;
}

export interface GeoGebraConfig {
  appName: GeoGebraAppName;
  commands: string[];
  parameters?: GeoGebraParameter[];
  xml?: string;
  description: string;
  educationalNotes?: string[];
}

export interface GeoGebraGenerationRequest {
  prompt: string;
  targetAge?: "elementary" | "middle" | "high";
  complexity?: "basic" | "intermediate" | "advanced";
}

export interface GeoGebraGenerationResponse {
  success: boolean;
  config: GeoGebraConfig;
  error?: string;
}
