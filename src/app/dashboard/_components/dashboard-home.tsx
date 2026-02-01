"use client";

import { motion, AnimatePresence } from "motion/react";
import { authClient } from "@/lib/auth/client";
import { Send, Paperclip, Sparkles, User, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

// Animation Variants
import {
  containerVariants,
  itemVariants,
  messageVariants,
} from "./dashboard-home.animations";
import { ChatInput } from "./chat-input";
import { useChat } from "../_hooks/use-chat";

export function DashboardHome() {
  const { data: session } = authClient.useSession();
  const userName = session?.user?.name || "Explorer";
  const fileInputRefReal = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    prompt,
    setPrompt,
    files,
    messages,
    isLoading,
    handleFileSelect,
    removeFile,
    handleSend,
    hasMessages
  } = useChat({
    onClearInput: () => {
      if (fileInputRefReal.current) {
        fileInputRefReal.current.value = "";
      }
    }
  });

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);


  return (
    // changed h-screen to h-full as parent layout handles screen height
    <div className="relative w-full h-full flex flex-col bg-slate-50/50 overflow-hidden">
      
      {/* Scrollable Content Area */}
      {/* ADDED pt-24 here to account for header, and px-6 for horizontal spacing */}
      <div 
        ref={scrollRef}
        className={cn(
          "flex-1 overflow-y-auto w-full transition-all duration-500 custom-scrollbar pt-24 px-6 md:px-10",
          hasMessages ? "pb-32" : "flex items-center justify-center pb-0"
        )}
      >
        <div className={cn("w-full max-w-4xl mx-auto", !hasMessages && "flex flex-col items-center gap-8")}>
          
          {/* Landing View: Logo & Greeting */}
          <AnimatePresence mode="wait">
            {!hasMessages && (
              <motion.div 
                className="flex flex-col items-center gap-8 w-full"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.div variants={itemVariants} className="relative">
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-300 via-blue-500 to-indigo-600 shadow-[0_0_40px_rgba(59,130,246,0.3)] flex items-center justify-center relative z-10"
                  >
                    <Sparkles className="text-white w-10 h-10 opacity-90" />
                  </motion.div>
                  <div className="absolute inset-0 bg-blue-400 rounded-full blur-2xl opacity-40 animate-pulse" />
                </motion.div>

                <motion.div variants={itemVariants} className="text-center space-y-2">
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                    Hi, {userName}! Ready to Turn Your <br />
                    Curiosity Into a <span className="text-blue-600">Fun STEM Adventure?</span>
                  </h1>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Messages */}
          {hasMessages && (
            <div className="w-full space-y-6 pt-4">
              <AnimatePresence mode="popLayout">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    layout
                    className={cn(
                      "flex gap-4 w-full max-w-3xl mx-auto",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "ai" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shrink-0 mt-1">
                        <Sparkles size={14} className="text-white" />
                      </div>
                    )}
                    
                    <div className={cn(
                      "p-4 rounded-2xl max-w-[80%] shadow-sm",
                       msg.role === "user" 
                         ? "bg-blue-600 text-white rounded-br-sm"
                         : "bg-white border border-slate-100 rounded-bl-sm text-slate-700"
                    )}>
                      {msg.files && msg.files.length > 0 && (
                        <div className="mb-2 space-y-1">
                           {msg.files.map((f, i) => (
                             <div key={i} className="flex items-center gap-2 text-xs bg-black/10 px-2 py-1 rounded-md w-fit">
                               <Paperclip size={10} /> {f.name}
                             </div>
                           ))}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{msg.content}</p>
                    </div>

                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-1 overflow-hidden">
                        {session?.user?.image ? (
                          <img src={session.user.image} alt={userName} className="w-full h-full object-cover" />
                        ) : (
                          <User size={14} className="text-slate-500" />
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="flex gap-4 w-full max-w-3xl mx-auto justify-start"
                >
                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shrink-0">
                      <Sparkles size={14} className="text-white animate-spin" />
                   </div>
                   <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-bl-sm p-4 flex items-center gap-2">
                     <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-2 h-2 bg-blue-400 rounded-full" />
                     <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 bg-blue-400 rounded-full" />
                     <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 bg-blue-400 rounded-full" />
                   </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Hero Input (Rendered only when not chatting) */}
          {!hasMessages && (
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
                 isChatMode={false}
                 fileInputRef={fileInputRefReal}
               />
             </motion.div>
          )}

        </div>
      </div>

      {/* Absolute Chat Input (Rendered only when chatting) */}
      <AnimatePresence>
        {hasMessages && (
           <motion.div
             layoutId="input-container"
             initial={{ opacity: 0, y: 50 }}
             animate={{ opacity: 1, y: 0 }}
             // Using absolute positioning relative to this container (which is relative to main content)
             // Centered using left-0 right-0 mx-auto
             className="absolute bottom-8 left-0 right-0 mx-auto w-[90%] max-w-3xl bg-white rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-slate-200 p-2 z-50"
             transition={{ type: "spring", stiffness: 300, damping: 30 }}
           >
             <ChatInput 
                 prompt={prompt}
                 setPrompt={setPrompt}
                 files={files}
                 handleFileSelect={handleFileSelect}
                 removeFile={removeFile}
                 handleSend={handleSend}
                 isChatMode={true}
                 fileInputRef={fileInputRefReal}
             />
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
