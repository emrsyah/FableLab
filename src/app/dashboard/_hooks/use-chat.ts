import { useState } from "react";
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
  const router = useRouter();

  const generateLessonMutation = trpc.lessons.generate.useMutation({
    onSuccess: (data) => {
      // Redirect to the new lesson page
      router.push(`/lesson/${data.lessonId}`);
    },
    onError: (error) => {
      // Show an error message
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

  const handleSend = () => {
    if (!prompt.trim() && files.length === 0) return;

    const userMessage: Message = {
      role: "user",
      content: prompt,
      files: [...files], // Copy files
    };

    setMessages((prev) => [...prev, userMessage]);

    // For now, let's assume a default complexity.
    // In the future, this should come from a UI selector.
    const complexity = "Middle";

    generateLessonMutation.mutate({
      topic: prompt,
      complexity: complexity,
    });

    // Reset Input State
    setPrompt("");
    setFiles([]);
    
    // Call external clear callback (e.g. for clearing file input DOM ref)
    if (onClearInput) {
      onClearInput();
    }
  };

  return {
    prompt,
    setPrompt,
    files,
    messages,
    isLoading: generateLessonMutation.isLoading,
    handleFileSelect,
    removeFile,
    handleSend,
    hasMessages: messages.length > 0
  };
}
