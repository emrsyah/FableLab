"use client";

import { useCallback, useReducer } from "react";
import type { Quiz, Scene } from "../types/scene.types";

type SceneStatus =
  | "initial"
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "quiz_gate"
  | "completed";

type State = {
  status: SceneStatus;
};

type Action =
  | { type: "SET_READY" }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "AUDIO_END" }
  | { type: "QUIZ_CORRECT" }
  | { type: "RESET" };

function sceneStateReducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_READY":
      if (state.status === "loading" || state.status === "initial") {
        return { ...state, status: "ready" };
      }
      return state;
    case "PLAY":
      if (state.status === "ready" || state.status === "paused") {
        return { ...state, status: "playing" };
      }
      return state;
    case "PAUSE":
      if (state.status === "playing") {
        return { ...state, status: "paused" };
      }
      return state;
    case "AUDIO_END":
      // This will be handled by the component, which will then decide
      // whether to move to quiz_gate or completed.
      // For now, let's assume if it has a quiz, it goes to quiz_gate
      // This logic is actually in the component, so we just set to paused here.
      return { ...state, status: "paused" };
    case "QUIZ_CORRECT":
      if (state.status === "quiz_gate") {
        return { ...state, status: "completed" };
      }
      return state;
    case "RESET":
      return { ...state, status: "initial" };
    default:
      return state;
  }
}

export function useSceneState(scene: Scene, quiz: Quiz | null | undefined) {
  const initialState: State = {
    status: "initial",
  };

  const [_state, _dispatch] = useReducer(sceneStateReducer, initialState);

  // A more complex reducer logic to handle quiz gate
  const complexReducer = (state: State, action: Action): State => {
    switch (action.type) {
      case "AUDIO_END":
        if (scene.hasQuiz && quiz) {
          return { ...state, status: "quiz_gate" };
        }
        return { ...state, status: "completed" };
      // All other actions are the same
      default:
        return sceneStateReducer(state, action);
    }
  };

  const [_stateWithQuiz, dispatchWithQuiz] = useReducer(
    complexReducer,
    initialState,
  );

  const _setReady = useCallback(
    () => dispatchWithQuiz({ type: "SET_READY" }),
    [],
  );
  const _play = useCallback(() => dispatchWithQuiz({ type: "PLAY" }), []);
  const _pause = useCallback(() => dispatchWithQuiz({ type: "PAUSE" }), []);
  const _handleAudioEnd = useCallback(
    () => dispatchWithQuiz({ type: "AUDIO_END" }),
    [],
  );
  const _handleQuizCorrect = useCallback(
    () => dispatchWithQuiz({ type: "QUIZ_CORRECT" }),
    [],
  );
  const _reset = useCallback(() => dispatchWithQuiz({ type: "RESET" }), []);

  // The component seems to handle the quiz gate logic, so a simpler state is fine.
  // The component calls handleAudioEnd, and based on the status and hasQuiz prop, it does something.
  // When the audio ends, the status becomes 'paused'. If auto-advance is on and there is no quiz, it moves to the next scene.
  // If there is a quiz, the UI should show the quiz. The `scene-player` shows the quiz when `status === 'quiz_gate'`.
  // The `useSceneState` from the component has `status` and `handleAudioEnd`.
  // The component's `handleAudioEnded` calls `handleAudioEnd`.
  // Let's re-implement a reducer that matches the component's logic.

  const finalReducer = (state: State, action: Action): State => {
    switch (state.status) {
      case "initial":
        if (action.type === "SET_READY") return { status: "ready" };
        break;
      case "loading":
        if (action.type === "SET_READY") return { status: "ready" };
        break;
      case "ready":
        if (action.type === "PLAY") return { status: "playing" };
        break;
      case "playing":
        if (action.type === "PAUSE") return { status: "paused" };
        if (action.type === "AUDIO_END") {
          return scene.hasQuiz && quiz
            ? { status: "quiz_gate" }
            : { status: "completed" };
        }
        break;
      case "paused":
        if (action.type === "PLAY") return { status: "playing" };
        break;
      case "quiz_gate":
        if (action.type === "QUIZ_CORRECT") return { status: "completed" };
        break;
      case "completed":
        break;
    }
    if (action.type === "RESET") return { status: "initial" };
    return state;
  };

  const [finalState, finalDispatch] = useReducer(finalReducer, {
    status: "loading",
  });

  return {
    status: finalState.status,
    setReady: useCallback(() => finalDispatch({ type: "SET_READY" }), []),
    play: useCallback(() => finalDispatch({ type: "PLAY" }), []),
    pause: useCallback(() => finalDispatch({ type: "PAUSE" }), []),
    handleAudioEnd: useCallback(() => finalDispatch({ type: "AUDIO_END" }), []),
    handleQuizCorrect: useCallback(
      () => finalDispatch({ type: "QUIZ_CORRECT" }),
      [],
    ),
    reset: useCallback(() => finalDispatch({ type: "RESET" }), []),
  };
}
