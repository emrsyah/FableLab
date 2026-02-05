import { act, renderHook } from "@testing-library/react";
import type { Quiz, Scene } from "../types/scene.types";
import { useSceneState } from "./use-scene-state";

const mockScene: Scene = {
  id: "scene1",
  lessonId: "lesson1",
  sceneNumber: 1,
  title: "Test Scene",
  storyText: "A story",
  learningObjective: "To learn",
  visualType: "image",
  imageUrl: null,
  geogebraConfig: null,
  narrationUrl: null,
  narrationDuration: null,
  backgroundMusicUrl: null,
  hasQuiz: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  narrationAlignment: null,
};

const mockSceneWithQuiz: Scene = { ...mockScene, hasQuiz: true };
const mockQuiz: Quiz = {
  id: "quiz1",
  sceneId: "scene1",
  question: "What is 2+2?",
  options: ["3", "4", "5", "6"],
  correctIndex: 1,
  explanation: "It's 4",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("useSceneState", () => {
  it("should have initial status as loading", () => {
    const { result } = renderHook(() => useSceneState(mockScene, null));
    expect(result.current.status).toBe("loading");
  });

  it("should transition from loading to ready", () => {
    const { result } = renderHook(() => useSceneState(mockScene, null));
    act(() => {
      result.current.setReady();
    });
    expect(result.current.status).toBe("ready");
  });

  it("should transition from ready to playing", () => {
    const { result } = renderHook(() => useSceneState(mockScene, null));
    act(() => result.current.setReady());
    act(() => result.current.play());
    expect(result.current.status).toBe("playing");
  });

  it("should transition from playing to paused", () => {
    const { result } = renderHook(() => useSceneState(mockScene, null));
    act(() => result.current.setReady());
    act(() => result.current.play());
    act(() => result.current.pause());
    expect(result.current.status).toBe("paused");
  });

  it("should transition from playing to completed if no quiz", () => {
    const { result } = renderHook(() => useSceneState(mockScene, null));
    act(() => result.current.setReady());
    act(() => result.current.play());
    act(() => result.current.handleAudioEnd());
    expect(result.current.status).toBe("completed");
  });

  it("should transition from playing to quiz_gate if there is a quiz", () => {
    const { result } = renderHook(() =>
      useSceneState(mockSceneWithQuiz, mockQuiz),
    );
    act(() => result.current.setReady());
    act(() => result.current.play());
    act(() => result.current.handleAudioEnd());
    expect(result.current.status).toBe("quiz_gate");
  });

  it("should transition from quiz_gate to completed when quiz is correct", () => {
    const { result } = renderHook(() =>
      useSceneState(mockSceneWithQuiz, mockQuiz),
    );
    act(() => result.current.setReady());
    act(() => result.current.play());
    act(() => result.current.handleAudioEnd());
    act(() => result.current.handleQuizCorrect());
    expect(result.current.status).toBe("completed");
  });

  it("should reset to initial status", () => {
    const { result } = renderHook(() => useSceneState(mockScene, null));
    act(() => result.current.setReady());
    act(() => result.current.play());
    act(() => result.current.reset());
    expect(result.current.status).toBe("initial");
  });
});
