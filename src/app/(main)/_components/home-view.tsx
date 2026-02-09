"use client";

import { FlaskConical } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { Persona } from "@/components/ai-elements/persona";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { useChat } from "../_hooks/use-chat";
import { ChatInput } from "./chat-input";
// Animation Variants
import { containerVariants, itemVariants } from "./home-view.animations";

export function HomeView() {
  const { data: session } = authClient.useSession();
  const userName = session?.user?.name || "Explorer";
  const fileInputRefReal = useRef<HTMLInputElement>(null);

  const {
    prompt,
    setPrompt,
    files,
    isLoading,
    handleFileSelect,
    removeFile,
    handleSend,
    learningLevel,
    setLearningLevel,
    sceneCount,
    setSceneCount,
  } = useChat({
    onClearInput: () => {
      if (fileInputRefReal.current) {
        fileInputRefReal.current.value = "";
      }
    },
  });

  const router = useRouter();

  const handlePlaygroundClick = () => {
    if (!session?.user) {
      router.push("/login");
    } else {
      router.push("/playground");
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-50/50 overflow-hidden">
      {/* Content Area */}
      <div className="absolute top-2 right-2">
        <Button
          className="bg-blue-500 hover:bg-blue-600 cursor-pointer"
          onClick={handlePlaygroundClick}
        >
          <FlaskConical />
          Playground Mode
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto w-full transition-all duration-500 custom-scrollbar pt-24 px-6 md:px-10 flex items-center justify-center pb-0">
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8">
          {/* Landing View: Logo & Greeting */}
          <motion.div
            className="flex flex-col items-center gap-8 w-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Persona
              state={isLoading ? "thinking" : "idle"}
              variant="mana"
              className="size-20"
            />

            <motion.div
              variants={itemVariants}
              className="text-center space-y-2"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                Hi, {userName}! Ready to Turn Your <br />
                Curiosity Into a{" "}
                <span className="text-blue-600">Fun STEM Adventure?</span>
              </h1>
            </motion.div>
          </motion.div>

          {/* Hero Input */}
          <motion.div
            layoutId="input-container"
            className="w-full max-w-2xl bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 p-2 transition-all hover:shadow-[0_8px_40px_rgba(59,130,246,0.08)]"
          >
            <ChatInput
              prompt={prompt}
              setPrompt={setPrompt}
              files={files}
              handleFileSelect={handleFileSelect}
              removeFile={removeFile}
              handleSend={handleSend}
              isLoading={isLoading}
              fileInputRef={fileInputRefReal}
              learningLevel={learningLevel}
              setLearningLevel={setLearningLevel}
              sceneCount={sceneCount}
              setSceneCount={setSceneCount}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
