import { useState, useEffect } from "react";

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
  const [isLoading, setIsLoading] = useState(false);

  // Auto-scroll logic could be here, but usually needs a ref to the DOM element in the view.
  // We'll leave the scrollRef in the component for now, or expose a ref from here.
  // For separation of concerns, the hook manages DATA, the component manages VIEW (scrolling).

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
    setIsLoading(true);

    // Reset Input State
    setPrompt("");
    setFiles([]);
    
    // Call external clear callback (e.g. for clearing file input DOM ref)
    if (onClearInput) {
      onClearInput();
    }

    // Simulate AI Response
    setTimeout(() => {
      const aiMessage: Message = {
        role: "ai",
        content: "That's a fascinating topic! Gravity is the force that pulls objects towards the center of the Earth. In our lesson, I've prepared 3 scenes demonstrating how mass and distance affect this force. Shall we start exploring?",
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
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
    hasMessages: messages.length > 0
  };
}
