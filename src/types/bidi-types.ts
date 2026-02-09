/**
 * BIDI Event Types for Playground WebSocket Communication
 * Matches the event format expected from ADK backend
 */

// Base event interface
export interface BIDIEvent {
  id?: string;
  author: string;
  type:
    | "content"
    | "audio"
    | "transcription"
    | "function_call"
    | "function_response"
    | "turn_complete"
    | "interrupted"
    | "error";
  timestamp?: string;
}

// Text content event
export interface ContentEvent extends BIDIEvent {
  type: "content";
  content: {
    parts: Array<{
      text?: string;
      inline_data?: {
        mime_type: string;
        data: string; // base64
      };
    }>;
  };
  partial: boolean;
  turn_complete: boolean;
  interrupted: boolean;
}

// Audio event (separate from content for easier handling)
export interface AudioEvent extends BIDIEvent {
  type: "audio";
  inline_data: {
    mime_type: string;
    data: string; // base64 encoded PCM audio
  };
}

// Transcription event (user or model speech)
export interface TranscriptionEvent extends BIDIEvent {
  type: "transcription";
  input_transcription?: {
    text: string;
    finished: boolean;
  };
  output_transcription?: {
    text: string;
    finished: boolean;
  };
}

// Function call event (agent wants to call a tool)
export interface FunctionCallEvent extends BIDIEvent {
  type: "function_call";
  function_call: {
    name: string;
    args: Record<string, unknown>;
  };
}

// Function response event (tool execution result)
export interface FunctionResponseEvent extends BIDIEvent {
  type: "function_response";
  function_response: {
    name: string;
    response: unknown;
  };
}

// Turn complete event (agent finished responding)
export interface TurnCompleteEvent extends BIDIEvent {
  type: "turn_complete";
  turn_complete: true;
}

// Interrupted event (user interrupted)
export interface InterruptedEvent extends BIDIEvent {
  type: "interrupted";
  interrupted: true;
}

// Error event
export interface ErrorEvent extends BIDIEvent {
  type: "error";
  error_code: string;
  error_message: string;
}

// Union type for all events
export type PlaygroundBIDIEvent =
  | ContentEvent
  | AudioEvent
  | TranscriptionEvent
  | FunctionCallEvent
  | FunctionResponseEvent
  | TurnCompleteEvent
  | InterruptedEvent
  | ErrorEvent;

// Function call types for playground tools
export interface GenerateExperimentCall {
  name: "generate_experiment";
  args: {
    prompt: string;
    target_age?: "elementary" | "middle" | "high";
    compare_to_node_id?: string;
  };
}

export interface ModifyExperimentCall {
  name: "modify_experiment";
  args: {
    node_id: string;
    parameter: string;
    value: number;
  };
}

export interface CompareExperimentsCall {
  name: "compare_experiments";
  args: {
    node_ids: string[];
  };
}

export interface ExplainConceptCall {
  name: "explain_concept";
  args: {
    concept: string;
    context?: string;
  };
}

export interface ResetCanvasCall {
  name: "reset_canvas";
  args: Record<string, never>;
}

export type PlaygroundToolCall =
  | GenerateExperimentCall
  | ModifyExperimentCall
  | CompareExperimentsCall
  | ExplainConceptCall
  | ResetCanvasCall;

// Response types from function calls
export interface GenerateExperimentResponse {
  experiment: {
    p5_code: string;
    setup_instructions: string;
    interaction_guide: string;
    learning_objectives: string[];
    variables: string[];
  };
  node_id: string;
  message: string;
}

export interface ModifyExperimentResponse {
  node_id: string;
  updates: {
    parameter: string;
    value: number;
  };
  message: string;
}

export interface CompareExperimentsResponse {
  comparison_id: string;
  node_ids: string[];
  message: string;
}

export interface ExplainConceptResponse {
  explanation: string;
  related_experiments?: string[];
  message: string;
}

export interface ResetCanvasResponse {
  cleared: boolean;
  message: string;
}
