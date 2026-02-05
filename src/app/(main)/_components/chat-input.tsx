"use client";

import { Loader2, Paperclip, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { buttonHoverVariants } from "./home-view.animations";

interface ChatInputProps {
  prompt: string;
  setPrompt: (value: string) => void;
  files: File[];
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;
  handleSend: () => void;
  isLoading?: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
}

export function ChatInput({
  prompt,
  setPrompt,
  files,
  handleFileSelect,
  removeFile,
  handleSend,
  isLoading = false,
  fileInputRef,
}: ChatInputProps) {
  return (
    <>
      <div className="relative flex items-end gap-2">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !isLoading) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Explain how gravity affects falling objects..."
          disabled={isLoading}
          className={cn(
            "resize-none border-none shadow-none focus-visible:ring-0 text-lg placeholder:text-slate-400 text-slate-700 bg-transparent py-3 min-h-[60px] p-3 pt-2",
            isLoading && "opacity-50",
          )}
        />
      </div>

      {/* Selected Files Display */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-wrap gap-2 px-3 pb-2"
          >
            {files.map((file, i) => (
              <motion.div
                key={file.name + i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium"
              >
                <span className="max-w-[150px] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="hover:text-blue-900 ml-1"
                >
                  ×
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-50 mt-2 pl-3 pt-2 pr-2 pb-2"
      >
        <div className="flex items-center gap-2">
          <input
            type="file"
            multiple
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileSelect}
          />

          <motion.div
            variants={buttonHoverVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip size={20} />
            </Button>
          </motion.div>

          <Select>
            <SelectTrigger className="w-[180px] h-9 rounded-full border-slate-200 text-slate-600 text-xs font-medium bg-slate-50/50 hover:bg-white transition-colors">
              <SelectValue placeholder="Choose Learning Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner (Ages 5-8)</SelectItem>
              <SelectItem value="intermediate">
                Intermediate (Ages 9-12)
              </SelectItem>
              <SelectItem value="advanced">Advanced (Ages 13+)</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-[180px] h-9 rounded-full border-slate-200 text-slate-600 text-xs font-medium bg-slate-50/50 hover:bg-white transition-colors">
              <SelectValue placeholder="Number of Scenes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 Scenes</SelectItem>
              <SelectItem value="5">5 Scenes</SelectItem>
              <SelectItem value="7">7 Scenes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <motion.div
          variants={buttonHoverVariants}
          whileHover={isLoading ? undefined : "hover"}
          whileTap={isLoading ? undefined : "tap"}
        >
          <Button
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 px-6 h-10 gap-2 font-medium transition-all disabled:opacity-70"
            disabled={isLoading || (!prompt.trim() && files.length === 0)}
            onClick={handleSend}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {isLoading ? "Generating..." : "Generate Lesson"}
          </Button>
        </motion.div>
      </motion.div>
    </>
  );
}
