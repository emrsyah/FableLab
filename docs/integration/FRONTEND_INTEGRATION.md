# Fable Lab Frontend Integration Guide

## Overview

This guide explains how to integrate your frontend with the Fable Lab ADK backend. The backend provides a multi-agent system that generates interactive learning experiences with stories and GeoGebra experiments.

## Architecture

```
Frontend (React/Vue/etc.)
    ↓ HTTP/SSE
ADK API Server (Port 8080)
    ↓
FableLabWorkflow
├── Orchestrator Agent
│   └── Consults Librarian → Creates Outline
└── ParallelContentCreators
    ├── Plotter → Generates Story Content
    └── GraphMaster → Creates GeoGebra Experiment
```

## Quick Start

### 1. Start the API Server

```bash
cd fable-lab-adk
adk api_server --port 8080
```

Verify it's running:
```bash
curl http://localhost:8080/list-apps
# Should return: ["fable_agent"]
```

### 2. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/list-apps` | GET | List available agents |
| `/apps/{app}/users/{user}/sessions/{session}` | POST | Create a session |
| `/apps/{app}/users/{user}/sessions/{session}` | GET | Get session state |
| `/run` | POST | Run agent (blocking, returns all events) |
| `/run_sse` | POST | **Run agent with streaming (RECOMMENDED)** |

## Integration Steps

### Step 1: Create a Session

Before running the agent, create a session to store state:

```javascript
const APP_NAME = 'fable_agent';
const USER_ID = 'user_123';
const SESSION_ID = 'session_' + Date.now();

async function createSession() {
  const response = await fetch(
    `http://localhost:8080/apps/${APP_NAME}/users/${USER_ID}/sessions/${SESSION_ID}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }
  );
  return await response.json();
}
```

### Step 2: Run Agent with Streaming (SSE)

**Recommended approach** - Provides real-time updates as each agent works:

```javascript
async function* streamAgentExecution(prompt) {
  const response = await fetch('http://localhost:8080/run_sse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appName: APP_NAME,
      userId: USER_ID,
      sessionId: SESSION_ID,
      newMessage: {
        role: 'user',
        parts: [{ text: prompt }]
      }
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.trim()) {
        yield line;
      }
    }
  }
}
```

### Step 3: Parse and Handle Events

```javascript
async function runFableLab(prompt, onEvent) {
  // Create session first
  await createSession();

  const eventStream = streamAgentExecution(prompt);

  for await (const line of eventStream) {
    // SSE format: "data: {...json...}"
    if (line.startsWith('data: ')) {
      const jsonStr = line.slice(6);
      const event = JSON.parse(jsonStr);

      // Extract event information
      const eventInfo = {
        id: event.id,
        author: event.author, // 'Orchestrator', 'Librarian', 'Plotter', 'GraphMaster', 'ParallelContentCreators'
        timestamp: event.timestamp,
        content: event.content?.parts?.[0]?.text,
        isPartial: event.partial,
        actions: event.actions,
        isFinalResponse: event.isFinalResponse
      };

      // Check for state updates
      if (event.actions?.stateDelta) {
        eventInfo.stateDelta = event.actions.stateDelta;
      }

      onEvent(eventInfo);
    }
  }
}
```

## Event Flow (What You'll Receive)

When you run the agent, you'll receive events in this order:

### Phase 1: Orchestrator Consults Librarian

```javascript
// Event 1: Workflow starts
{
  author: 'Orchestrator',
  content: null,
  actions: { stateDelta: { /* empty */ } }
}

// Event 2: Librarian tool call
{
  author: 'Orchestrator',
  content: {
    parts: [{
      functionCall: {
        name: 'Librarian',
        args: { user_prompt: 'Teach fractions...' }
      }
    }]
  }
}

// Event 3: Librarian response
{
  author: 'Orchestrator',
  content: {
    parts: [{
      functionResponse: {
        name: 'Librarian',
        response: { /* librarian_output with suggestions */ }
      }
    }]
  },
  actions: { stateDelta: { librarian_output: '...' } }
}
```

### Phase 2: Orchestrator Creates Outline

```javascript
// Event 4: Outline creation in progress (streaming chunks)
{
  author: 'Orchestrator',
  content: { parts: [{ text: 'Creating story outline...' }] },
  partial: true
}

// Event 5: Outline saved to state
{
  author: 'Orchestrator',
  content: { parts: [{ text: 'Outline complete' }] },
  actions: {
    stateDelta: {
      story_outline: {
        grandTheme: '...',
        scenes: [...],
        experimentBrief: {...}
      },
      geogebra_features: {...}
    }
  },
  isFinalResponse: true
}
```

### Phase 3: Parallel Execution

```javascript
// Event 6: Parallel agents start
{
  author: 'ParallelContentCreators',
  content: null
}

// Event 7: Plotter working
{
  author: 'Plotter',
  content: { parts: [{ text: 'Generating scene 1...' }] },
  partial: true
}

// Event 8: GraphMaster working
{
  author: 'GraphMaster',
  content: { parts: [{ text: 'Creating GeoGebra graph...' }] },
  partial: true
}

// Event 9: Plotter completes
{
  author: 'Plotter',
  content: null,
  actions: {
    stateDelta: {
      plotter_output: {
        scenes: [...], // Full story content
        questions: [...]
      }
    }
  }
}

// Event 10: GraphMaster completes
{
  author: 'GraphMaster',
  content: null,
  actions: {
    stateDelta: {
      geogebra_experiment: {
        commands: [...],
        setupInstructions: '...',
        interactionGuide: '...'
      }
    }
  }
}
```

### Phase 4: Workflow Complete

```javascript
// Event 11: Workflow complete (final response)
{
  author: 'FableLabWorkflow', // or root agent name
  content: { parts: [{ text: 'Learning experience generated successfully!' }] },
  isFinalResponse: true
}
```

## Complete Frontend Example

### React Component

```jsx
import React, { useState, useCallback } from 'react';

const APP_NAME = 'fable_agent';
const USER_ID = 'user_123';
const API_URL = 'http://localhost:8080';

function FableLabGenerator() {
  const [prompt, setPrompt] = useState('');
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | running | completed | error
  const [results, setResults] = useState(null);

  const createSession = async (sessionId) => {
    const response = await fetch(
      `${API_URL}/apps/${APP_NAME}/users/${USER_ID}/sessions/${sessionId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      }
    );
    return response.json();
  };

  const runAgent = useCallback(async () => {
    setStatus('running');
    setEvents([]);
    setResults(null);

    const sessionId = `session_${Date.now()}`;

    try {
      // 1. Create session
      await createSession(sessionId);

      // 2. Start streaming
      const response = await fetch(`${API_URL}/run_sse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName: APP_NAME,
          userId: USER_ID,
          sessionId: sessionId,
          newMessage: {
            role: 'user',
            parts: [{ text: prompt }]
          }
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const event = JSON.parse(line.slice(6));
            setEvents(prev => [...prev, event]);

            // Check for final results in state
            if (event.actions?.stateDelta) {
              const { story_content, geogebra_experiment } = event.actions.stateDelta;
              if (story_content || geogebra_experiment) {
                setResults(prev => ({
                  ...prev,
                  ...(story_content && { storyContent: story_content }),
                  ...(geogebra_experiment && { geogebraExperiment: geogebra_experiment })
                }));
              }
            }

            // Check for completion
            if (event.isFinalResponse) {
              setStatus('completed');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus('error');
    }
  }, [prompt]);

  // Helper to get current step from events
  const getCurrentStep = () => {
    if (events.length === 0) return 'Initializing...';

    const lastEvent = events[events.length - 1];
    const author = lastEvent.author;

    if (author === 'Orchestrator') {
      if (lastEvent.actions?.stateDelta?.librarian_output) {
        return 'Creating story outline...';
      }
      return 'Consulting Librarian...';
    }

    if (author === 'ParallelContentCreators') {
      return 'Starting content generation...';
    }

    if (author === 'Plotter') {
      return 'Generating story content...';
    }

    if (author === 'GraphMaster') {
      return 'Creating GeoGebra experiment...';
    }

    return 'Processing...';
  };

  return (
    <div className="fable-lab-generator">
      <h1>Fable Lab Generator</h1>

      {/* Input */}
      <div className="input-section">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter learning topic (e.g., 'Teach fractions to 5th graders')"
          rows={3}
        />
        <button
          onClick={runAgent}
          disabled={status === 'running' || !prompt.trim()}
        >
          {status === 'running' ? 'Generating...' : 'Generate Learning Experience'}
        </button>
      </div>

      {/* Progress */}
      {status === 'running' && (
        <div className="progress-section">
          <div className="status-badge">{getCurrentStep()}</div>
          <div className="event-log">
            {events.slice(-5).map((event, i) => (
              <div key={i} className="event-item">
                <span className="author">{event.author}</span>
                <span className="action">
                  {event.actions?.stateDelta ? '⚡ State Update' : '💬 Message'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="results-section">
          {results.storyContent && (
            <div className="result-card">
              <h3>📖 Story Content</h3>
              <pre>{JSON.stringify(results.storyContent, null, 2)}</pre>
            </div>
          )}

          {results.geogebraExperiment && (
            <div className="result-card">
              <h3>📊 GeoGebra Experiment</h3>
              <pre>{JSON.stringify(results.geogebraExperiment, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FableLabGenerator;
```

## Alternative: Non-Streaming (Blocking) Approach

If you don't need real-time updates, use the `/run` endpoint:

```javascript
async function runAgentBlocking(prompt) {
  const sessionId = `session_${Date.now()}`;

  // Create session
  await fetch(
    `http://localhost:8080/apps/${APP_NAME}/users/${USER_ID}/sessions/${sessionId}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) }
  );

  // Run agent (blocking)
  const response = await fetch('http://localhost:8080/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appName: APP_NAME,
      userId: USER_ID,
      sessionId: sessionId,
      newMessage: {
        role: 'user',
        parts: [{ text: prompt }]
      }
    })
  });

  const result = await response.json();

  // Get final state
  const sessionResponse = await fetch(
    `http://localhost:8080/apps/${APP_NAME}/users/${USER_ID}/sessions/${sessionId}`
  );
  const session = await sessionResponse.json();

  return {
    events: result, // Array of all events
    finalState: session.state // Contains story_outline, story_content, geogebra_experiment
  };
}
```

## State Keys Reference

After completion, the session state contains these keys:

| Key | Type | Description |
|-----|------|-------------|
| `story_outline` | Object | Complete story structure with scenes and goals |
| `geogebra_features` | Object | Technical suggestions for GeoGebra |
| `story_content` | Object | Generated story with image prompts, scripts, questions |
| `geogebra_experiment` | Object | GeoGebra commands and experiment setup |
| `librarian_output` | String | Raw output from Librarian consultation |
| `plotter_output` | Object | Raw output from Plotter |

## Error Handling

```javascript
async function runWithErrorHandling(prompt) {
  try {
    // ... setup code ...

    for await (const line of eventStream) {
      if (line.startsWith('data: ')) {
        const event = JSON.parse(line.slice(6));

        // Check for error
        if (event.errorCode || event.errorMessage) {
          throw new Error(`Agent Error: ${event.errorMessage}`);
        }

        // Process normal event
        // ...
      }
    }
  } catch (error) {
    console.error('Integration Error:', error);
    // Show error UI
  }
}
```

## Testing

### Test with curl

```bash
# 1. Create session
curl -X POST http://localhost:8080/apps/fable_agent/users/user1/sessions/test1

# 2. Run with streaming
curl -X POST http://localhost:8080/run_sse \
  -H "Content-Type: application/json" \
  -d '{
    "appName": "fable_agent",
    "userId": "user1",
    "sessionId": "test1",
    "newMessage": {
      "role": "user",
      "parts": [{"text": "Teach fractions to 5th graders"}]
    }
  }'

# 3. Get final state
curl http://localhost:8080/apps/fable_agent/users/user1/sessions/test1
```

### Interactive API Docs

Visit `http://localhost:8080/docs` for Swagger UI with all endpoints.

## CORS Configuration

If your frontend runs on a different port, you may need to configure CORS. ADK API server should handle this automatically, but if you encounter issues:

```bash
# Use a proxy in development
# next.config.js (Next.js)
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/adk/:path*',
        destination: 'http://localhost:8080/:path*',
      },
    ];
  },
};
```

## Summary

1. **Start server**: `adk api_server --port 8080`
2. **Create session**: `POST /apps/{app}/users/{user}/sessions/{session}`
3. **Run with streaming**: `POST /run_sse` with appName, userId, sessionId, newMessage
4. **Parse events**: Each line is `data: {json}` - contains author, content, actions.stateDelta
5. **Get results**: Extract `story_content` and `geogebra_experiment` from stateDelta events
6. **Show progress**: Use `author` field to display which agent is currently working

## Support

- ADK Docs: https://google.github.io/adk-docs/
- API Docs: http://localhost:8080/docs (when server is running)
- Session state inspection: http://localhost:8080/apps/fable_agent/users/{user}/sessions/{session}