import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  GenerationPhase,
  SceneGenerationStatus,
} from "@/components/lesson/loading-overlay";
import { authClient } from "@/lib/auth/client";
import type { LearningLevel, SceneCount } from "../_components/chat-input";

export type Message = {
  role: "user" | "ai";
  content: string;
  files?: File[];
};

interface UseChatProps {
  onClearInput?: () => void;
}

export function useChat({ onClearInput }: UseChatProps = {}) {
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Settings State
  const [learningLevel, setLearningLevel] = useState<LearningLevel>("middle");
  const [sceneCount, setSceneCount] = useState<SceneCount>("medium");

  // Generation State
  const [generationPhase, setGenerationPhase] =
    useState<GenerationPhase>("idle");
  const [generationProgress, setGenerationProgress] = useState<
    SceneGenerationStatus[]
  >([]);
  const [generatedLessonId, setGeneratedLessonId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { data: session } = authClient.useSession();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (
    selectedLevel: LearningLevel,
    selectedSceneCount: SceneCount,
  ) => {
    if (!prompt.trim() && files.length === 0) return;

    // Redirect to login if not authenticated
    if (!session?.user) {
      // Store prompt in sessionStorage for after login
      if (typeof window !== "undefined") {
        sessionStorage.setItem("pendingPrompt", prompt);
      }
      router.push("/login");
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: prompt,
      files: [...files],
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setGenerationPhase("initializing");

    const currentPrompt = prompt;
    setPrompt("");
    setFiles([]);
    if (onClearInput) onClearInput();

    try {
      // Create lesson with ADK and get immediate lessonId
      const response = await fetch("/api/adk/create-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session?.user?.id || `anon_${Date.now()}`,
          prompt: currentPrompt,
          targetAge: selectedLevel,
          sceneCount: selectedSceneCount,
        }),
      });

      const data = await response.json();

      if (data.success && data.lessonId) {
        // Redirect with the actual selected settings
        router.push(
          `/lesson/${data.lessonId}?targetAge=${selectedLevel}&sceneCount=${selectedSceneCount}`,
        );
      } else {
        throw new Error(data.error || "Failed to create lesson");
      }
    } catch (error) {
      setGenerationPhase("idle");
      setGenerationProgress([]);
      const aiMessage: Message = {
        role: "ai",
        content: `Sorry, I failed to start lesson generation. ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (generatedLessonId) {
      router.push(`/lesson/${generatedLessonId}`);
    }
    setGenerationPhase("idle");
    setGenerationProgress([]);
    setGeneratedLessonId(null);
  };

  return {
    prompt,
    setPrompt,
    files,
    messages,
    isLoading,
    handleFileSelect,
    removeFile,
    handleSend,
    hasMessages: messages.length > 0,
    generationPhase,
    generationProgress,
    resetGeneration: handleContinue,
    // Settings
    learningLevel,
    setLearningLevel,
    sceneCount,
    setSceneCount,
  };
}
