import { asc, eq } from "drizzle-orm";
import Image from "next/image";
import { P5Widget } from "@/components/playground/P5Widget";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { lessons } from "@/lib/db/schema/lessons";
import { scenes } from "@/lib/db/schema/scenes";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const lessonId = "HGB5AilvMpglaI5A9CK_w";

  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    with: {
      scenes: {
        orderBy: [asc(scenes.sceneNumber)],
      },
    },
  });

  if (!lesson) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold">Community Lesson</h1>
        <p className="mt-4 text-muted-foreground">Lesson not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      {/* Lesson Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h1 className="text-4xl font-bold tracking-tight">{lesson.title}</h1>
          <Badge variant="outline">{lesson.complexity}</Badge>
          <Badge>{lesson.topic}</Badge>
        </div>
        <div className="text-muted-foreground">
          <p>Created by user: {lesson.userId}</p>
          <p>Status: {lesson.status}</p>
        </div>
      </div>

      {/* Scenes List */}
      <div className="grid gap-8">
        {lesson.scenes.map((scene) => (
          <Card key={scene.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  Scene {scene.sceneNumber}: {scene.title}
                </CardTitle>
                <Badge variant="secondary">{scene.visualType}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              {/* Text Content */}
              <div className="space-y-4">
                <div className="prose dark:prose-invert">
                  <p className="whitespace-pre-wrap">{scene.storyText}</p>
                </div>
                {scene.learningObjective && (
                  <div className="bg-muted p-4 rounded-lg text-sm">
                    <strong>Objective:</strong> {scene.learningObjective}
                  </div>
                )}
              </div>

              {/* Visual Content */}
              <div className="rounded-lg overflow-hidden border bg-muted/50 min-h-[300px] flex items-center justify-center">
                {scene.visualType === "image" && scene.imageUrl ? (
                  <div className="relative w-full h-full min-h-[300px]">
                    <Image
                      src={scene.imageUrl}
                      alt={scene.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : scene.visualType === "p5" && scene.p5Config ? (
                  <div className="w-full h-[400px]">
                    <P5Widget
                      code={JSON.parse(scene.p5Config as string).p5_code}
                    />
                  </div>
                ) : (
                  <div className="text-muted-foreground p-8 text-center">
                    Visual content ({scene.visualType})
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
