export default async function Scene({
  params,
}: {
  params: Promise<{ lessonId: string; sceneNumber: string }>;
}) {
  const { lessonId, sceneNumber } = await params;
  return (
    <div>
      <h1>
        Scene - {sceneNumber} - {lessonId}
      </h1>
    </div>
  );
}
