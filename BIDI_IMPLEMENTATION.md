# ADK BIDI Integration Implementation Summary

## Overview
Successfully migrated the Playground from direct Gemini Live API integration to ADK BIDI-based interaction with full voice and function calling support.

## Files Created/Modified

### New Files Created

1. **`src/types/bidi-types.ts`**
   - TypeScript types for BIDI events (content, audio, transcription, function calls)
   - Function call request/response type definitions
   - Playground-specific tool call types

2. **`src/app/api/playground/bidi/route.ts`**
   - SSE (Server-Sent Events) API route for frontend-backend communication
   - Acts as bridge between frontend EventSource and backend WebSocket
   - Supports automatic reconnection
   - Environment variable: `ADK_BACKEND_WS_URL` (default: `ws://localhost:8000/playground/bidi`)

3. **`src/hooks/use-adk-bidi.ts`**
   - React hook for BIDI streaming management
   - Handles audio capture, playback, and event processing
   - Supports function call callbacks
   - Manages connection state (idle, connecting, connected, speaking, error)

### Modified Files

4. **`src/app/(main)/playground/_components/command-center.tsx`**
   - Replaced `useGeminiLive` with `useADKBIDI`
   - Added new props for BIDI function call callbacks
   - Maintains backward compatibility with legacy `onGenerate` prop
   - Voice button now connects to ADK BIDI stream

5. **`src/app/(main)/playground/_components/playground-canvas.tsx`**
   - Added BIDI callback handlers:
     - `handleExperimentGenerated`
     - `handleExperimentModified`
     - `handleComparisonCreated`
     - `handleConceptExplained`
     - `handleCanvasReset`
   - Passes callbacks to CommandCenter

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Browser)                       │
│  ┌──────────────────┐        ┌─────────────────────────────┐   │
│  │  CommandCenter   │        │  useADKBIDI Hook            │   │
│  │  (Voice + Text)  │◄──────▶│  - EventSource (SSE)        │   │
│  └──────────────────┘        │  - Audio Capture (16kHz)    │   │
│           │                  │  - Audio Playback (24kHz)   │   │
│           │                  └─────────────────────────────┘   │
│           │                           │                        │
│           │    Function Call Results  │ SSE / POST             │
│           │◄──────────────────────────┘                        │
│           │                                                    │
│  ┌────────▼────────────────┐                                   │
│  │   PlaygroundCanvas      │                                   │
│  │   (Experiment Nodes)    │                                   │
│  └─────────────────────────┘                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │ EventSource / POST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Next.js API Route (Bridge)                         │
│         /api/playground/bidi?userId=xxx&sessionId=yyy          │
│                                                                 │
│   EventSource (SSE) ──────▶  WebSocket ──────▶ Your Backend    │
│   (Downstream)              Connection        (ADK Agent)      │
│                                                                 │
│   POST /api/playground/bidi ◀──── WebSocket ◀──── Agent        │
│   (Upstream)                Connection        Responses        │
└─────────────────────────────────────────────────────────────────┘
```

## Backend Requirements

Your ADK backend must implement:

### 1. WebSocket Endpoint
```
ws://localhost:8000/playground/bidi/{user_id}/{session_id}
```

### 2. Function Tools
The agent must expose these 5 tools:

```python
# 1. Generate Experiment
def generate_experiment(
    prompt: str,
    target_age: str = "middle",
    compare_to_node_id: str = None
) -> dict:
    return {
        "experiment": {
            "p5_code": "...",
            "setup_instructions": "...",
            "interaction_guide": "...",
            "learning_objectives": [...],
            "variables": [...]
        },
        "node_id": "node_abc123",
        "message": "Created a ball falling experiment!"
    }

# 2. Modify Experiment
def modify_experiment(
    node_id: str,
    parameter: str,
    value: float
) -> dict:
    return {
        "node_id": "node_abc123",
        "updates": {"parameter": "gravity", "value": 9.8},
        "message": "Updated gravity to 9.8 m/s²"
    }

# 3. Compare Experiments
def compare_experiments(node_ids: list[str]) -> dict:
    return {
        "comparison_id": "comp_xyz789",
        "node_ids": ["node_1", "node_2"],
        "message": "Comparing experiments side by side"
    }

# 4. Explain Concept
def explain_concept(concept: str, context: str = None) -> dict:
    return {
        "explanation": "Gravity is the force that attracts...",
        "related_experiments": ["node_abc123"],
        "message": "Here's an explanation of gravity"
    }

# 5. Reset Canvas
def reset_canvas() -> dict:
    return {
        "cleared": True,
        "message": "Canvas cleared"
    }
```

### 3. Event Format
Your backend must send events in this JSON format:

```json
// Text response
{
  "type": "content",
  "author": "playground_agent",
  "content": {
    "parts": [{"text": "I'll create that experiment for you!"}]
  },
  "partial": false,
  "turn_complete": false,
  "interrupted": false
}

// Function call (when agent wants to use a tool)
{
  "type": "function_call",
  "author": "playground_agent",
  "function_call": {
    "name": "generate_experiment",
    "args": {
      "prompt": "ball falling on Earth",
      "target_age": "middle"
    }
  }
}

// Function response (tool execution result)
{
  "type": "function_response",
  "author": "playground_agent",
  "function_response": {
    "name": "generate_experiment",
    "response": {
      "experiment": { ... },
      "node_id": "node_abc123",
      "message": "Created!"
    }
  }
}

// Audio data (base64 PCM)
{
  "type": "audio",
  "inline_data": {
    "mime_type": "audio/pcm;rate=24000",
    "data": "base64_encoded_audio..."
  }
}

// Transcription
{
  "type": "transcription",
  "input_transcription": {
    "text": "User's speech",
    "finished": true
  },
  "output_transcription": {
    "text": "Model's speech",
    "finished": true
  }
}

// Turn complete
{
  "type": "turn_complete",
  "turn_complete": true
}

// Interrupted
{
  "type": "interrupted",
  "interrupted": true
}
```

### 4. RunConfig (Backend)
```python
RunConfig(
    streaming_mode=StreamingMode.BIDI,
    response_modalities=["AUDIO"],  # or ["TEXT"] for text-only
    input_audio_transcription=AudioTranscriptionConfig(),
    output_audio_transcription=AudioTranscriptionConfig(),
    session_resumption=SessionResumptionConfig(),
    speech_config=SpeechConfig(
        voice_config=VoiceConfig(
            prebuilt_voice_config=PrebuiltVoiceConfig(voice_name="Kore")
        )
    )
)
```

## Configuration

### Environment Variables
Add to `.env.local`:
```bash
# Backend WebSocket URL (optional, defaults to localhost)
ADK_BACKEND_WS_URL=ws://localhost:8000/playground/bidi
```

### Audio Specifications
- **Input (Microphone)**: PCM 16-bit, 16kHz, mono
- **Output (Agent)**: PCM 16-bit, 24kHz, mono (native audio models)

## Usage

### For Users
1. Click the microphone button to connect to voice mode
2. Speak naturally: "Create a ball falling experiment"
3. The agent will:
   - Respond with voice
   - Generate the experiment
   - Display it on the canvas

### Voice Commands Examples
- "Create a pendulum simulation"
- "Compare this with a different gravity"
- "Modify the mass to 10kg"
- "Explain how gravity works"
- "Clear the canvas"

## Backward Compatibility

The implementation maintains backward compatibility:
- If BIDI is not connected, text input uses legacy `onGenerate` callback
- If BIDI is connected, text input is sent via the BIDI stream
- Voice mode requires BIDI connection

## Next Steps for Backend Implementation

1. Create ADK agent with the 5 required tools
2. Implement WebSocket server at `ws://localhost:8000/playground/bidi`
3. Handle BIDI streaming with `run_live()`
4. Test connection from frontend
5. Verify function calls trigger canvas updates

## Troubleshooting

### Connection Issues
- Check that backend WebSocket is running
- Verify `ADK_BACKEND_WS_URL` environment variable
- Check browser console for SSE connection status

### Audio Issues
- Ensure microphone permissions are granted
- Check that audio format matches specifications
- Verify audio playback manager is initialized

### Function Call Issues
- Verify backend returns correct JSON format
- Check that function names match exactly
- Ensure responses include all required fields
