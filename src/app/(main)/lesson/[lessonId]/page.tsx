import React from "react";
import LessonClientPage from "./lesson-client-page";

type LessonPageProps = {
  params: Promise<{
    lessonId: string;
  }>;
};

export default function LessonPage({ params }: LessonPageProps) {
  const resolvedParams = React.use(params);
  const { lessonId } = resolvedParams;
  return <LessonClientPage lessonId={lessonId} />;
}
