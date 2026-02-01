"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function TestAudioPage() {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("Welcome to the Fable Lab! Let's explore the wonders of science together.");
  const [result, setResult] = useState<{ success: boolean; audioUrl?: string; error?: string } | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch audio");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResult({ success: true, audioUrl: url });
    } catch (e: any) {
      setResult({ success: false, error: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Audio Generation (ElevenLabs TTS)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="text">Text to Speak</Label>
            <Textarea 
              id="text" 
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4} 
              placeholder="Enter text here..."
            />
          </div>

          <Button onClick={handleGenerate} disabled={loading || !text} className="w-full">
            {loading ? "Generating Audio..." : "Generate Audio"}
          </Button>

          {result && (
            <div className="mt-6 space-y-4">
              {result.success && result.audioUrl ? (
                <div className="p-4 rounded-md border bg-muted space-y-3">
                  <h3 className="font-semibold text-green-600">Audio Generated!</h3>
                  <audio controls src={result.audioUrl} className="w-full" autoPlay />
                  <p className="text-xs text-muted-foreground break-all">{result.audioUrl}</p>
                </div>
              ) : (
                <div className="p-4 rounded-md bg-red-50 text-red-900 border border-red-200">
                  <h3 className="font-semibold">Error</h3>
                  <p>{result.error}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
