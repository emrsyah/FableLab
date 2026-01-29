import LessonClientPage from "./lesson-client-page";
import React from "react";

type LessonPageProps = {
  params: {
    lessonId: string;
  };
};

export default function LessonPage({ params }: LessonPageProps) {
  const resolvedParams = React.use(params);
  const { lessonId } = resolvedParams;
  return <LessonClientPage lessonId={lessonId} />;
}