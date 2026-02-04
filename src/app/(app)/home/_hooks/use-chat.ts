import { useState, useRef } from "react";
import { GenerationPhase, SceneGenerationStatus } from "@/components/lesson/loading-overlay";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";

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
  
  // Generation State
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>("idle");
  const [generationProgress, setGenerationProgress] = useState<SceneGenerationStatus[]>([]);
  const [generatedLessonId, setGeneratedLessonId] = useState<string | null>(null);
  
  const dummyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const handleGenerationComplete = (lessonId: string) => {
    // Force completion of all items
    setGenerationProgress(prev => prev.map(item => ({ ...item, status: "complete" })));
    setGenerationPhase("complete");
    setGeneratedLessonId(lessonId);
    
    if (dummyTimeoutRef.current) clearTimeout(dummyTimeoutRef.current);
  };

  const generateLessonMutation = trpc.lessons.generate.useMutation({
    onSuccess: (data) => {
      handleGenerationComplete(data.lessonId);
    },
    onError: (error) => {
      setGenerationPhase("idle");
      setGenerationProgress([]);
      const aiMessage: Message = {
        role: "ai",
        content: `Sorry, I failed to generate the lesson. ${error.message}`,
      };
      setMessages((prev) => [...prev, aiMessage]);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const startGenerationSimulation = () => {
    setGenerationPhase("initializing");
    setGenerationProgress([]);
    setGeneratedLessonId(null);

    // Initial delay
    setTimeout(() => {
      // If mutation already finished (super fast), don't override
      if (generateLessonMutation.isSuccess) return;

      setGenerationPhase("outline");
      
      const genericScenes = [
        "Analyzing Topic & Context",
        "Structuring Lesson Flow",
        "Generating Key Concepts",
        "Drafting Interactive Elements",
        "Refining Content & Style",
        "Finalizing Lesson"
      ];

      const initialScenes: SceneGenerationStatus[] = genericScenes.map((name, i) => ({
        id: i,
        name: name,
        status: "pending"
      }));
      setGenerationProgress(initialScenes);

      let currentSceneIndex = 0;
      
      const processNextScene = () => {
        // If we have a result, stop simulation (handled by onSuccess)
        if (generatedLessonId) return; 
        
        if (currentSceneIndex >= genericScenes.length) {
          // If simulation ends but API still pending, just wait.
          return;
        }

        setGenerationProgress(prev => prev.map((scene, idx) => {
          if (idx === currentSceneIndex) return { ...scene, status: "loading" };
          return scene;
        }));

        dummyTimeoutRef.current = setTimeout(() => {
          setGenerationProgress(prev => prev.map((scene, idx) => {
            if (idx === currentSceneIndex) return { 
              ...scene, 
              status: "complete",
              title: "Completed" // Generic title since we don't have real ones
            };
            return scene;
          }));
          
          currentSceneIndex++;
          processNextScene();
        }, 2000); // Slower pace for real feel
      };

      processNextScene();
    }, 2500);
  };

  const handleSend = () => {
    if (!prompt.trim() && files.length === 0) return;

    // Trigger Simulation for UI
    startGenerationSimulation();

    const userMessage: Message = {
      role: "user",
      content: prompt,
      files: [...files],
    };

    setMessages((prev) => [...prev, userMessage]);

    // Send Real Request
    generateLessonMutation.mutate({
      topic: prompt,
      complexity: "Middle", // Default
    });

    setPrompt("");
    setFiles([]);
    if (onClearInput) onClearInput();
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
    isLoading: generateLessonMutation.isPending,
    handleFileSelect,
    removeFile,
    handleSend,
    hasMessages: messages.length > 0,
    generationPhase,
    generationProgress,
    resetGeneration: handleContinue // Rename for clarity in usage, or keep name
  };
}
