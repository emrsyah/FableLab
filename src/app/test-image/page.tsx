"use client";

import { useState } from "react";
import { testGenerateImage } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TestImagePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; imageUrl?: string; error?: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setResult(null);
    try {
      const res = await testGenerateImage(formData);
      setResult(res);
    } catch (e) {
      setResult({ success: false, error: "Failed to invoke action" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Image Generation (Fal.ai)</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Scene Title</Label>
              <Input id="title" name="title" defaultValue="The Mystery of Gravity" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="complexity">Complexity</Label>
              <Select name="complexity" defaultValue="Middle">
                <SelectTrigger>
                  <SelectValue placeholder="Select complexity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Elementary">Elementary</SelectItem>
                  <SelectItem value="Middle">Middle</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storyText">Story Text</Label>
              <Textarea 
                id="storyText" 
                name="storyText" 
                rows={4} 
                defaultValue="Imagine you are holding a heavy bowling ball and a light feather. If you drop them both at the same time on the moon, which one lands first?" 
                required 
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Generating..." : "Generate Image"}
            </Button>
          </form>

          {result && (
            <div className="mt-8 space-y-4">
              {result.success ? (
                <div className="space-y-2">
                  <h3 className="font-semibold text-green-600">Success!</h3>
                  <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={result.imageUrl} alt="Generated" className="object-cover w-full h-full" />
                  </div>
                  <p className="text-xs text-muted-foreground break-all">{result.imageUrl}</p>
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
