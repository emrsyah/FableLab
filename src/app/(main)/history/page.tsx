"use client";

import { format } from "date-fns";
import { BookOpen, Calendar, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

function LoadingCard({ className }: { className?: string }) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden group hover:shadow-md transition-all duration-300 hover:-translate-y-1",
        className,
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-full bg-slate-100 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-100 rounded animate-pulse" />
          <div className="h-3 bg-slate-100 rounded animate-pulse w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyStateCard() {
  return (
    <Card className="col-span-full md:col-span-2 lg:col-span-3 border-dashed border-2 border-slate-200">
      <CardContent className="p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <BookOpen className="size-8 text-slate-400" />
        </div>
        <CardTitle className="text-slate-900 mb-2">No lessons yet</CardTitle>
        <CardDescription className="text-base max-w-md">
          Start your learning journey by generating your first STEM lesson!
        </CardDescription>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Create Your First Lesson
        </Link>
      </CardContent>
    </Card>
  );
}

function HistoryCard({ item, className }: { item: any; className?: string }) {
  const complexityColors = {
    elementary: "bg-emerald-100 text-emerald-700",
    middle: "bg-blue-100 text-blue-700",
    high: "bg-purple-100 text-purple-700",
  };

  const complexityColor =
    complexityColors[item.complexity as keyof typeof complexityColors] ||
    "bg-slate-100 text-slate-700";

  return (
    <Link href={`/lesson/${item.id}`} className="block">
      <Card
        className={cn(
          "h-full overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group",
          "border-slate-200 hover:border-blue-200",
          className,
        )}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-100 border-b border-slate-100">
          {item.scenes?.[0]?.imageUrl ? (
            <Image
              src={item.scenes[0].imageUrl}
              alt={item.topic || "Lesson thumbnail"}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <BookOpen className="size-8 opacity-20" />
            </div>
          )}

          {/* Badge Overlay */}
          <div className="absolute top-2 left-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm",
                complexityColor,
              )}
            >
              {item.complexity || "Standard"}
            </span>
          </div>
        </div>

        <CardHeader className="pb-3 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-1">
              <CardTitle className="text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
                {item.topic || "Untitled Lesson"}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {item.createdAt
                    ? format(new Date(item.createdAt), "MMM d, yyyy")
                    : "No date"}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-medium text-blue-600/70">
                  {item.scenes?.length || 0} Scenes
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {item.summary && (
            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed h-10">
              {item.summary}
            </p>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Trophy className="size-4 text-amber-500" />
              <span className="font-semibold text-slate-700">
                {item.quizScore !== null && item.quizScore !== undefined
                  ? `${item.quizScore}%`
                  : "N/A"}
              </span>
              <span className="text-xs text-slate-400">Score</span>
            </div>

            <div className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
              Review Lesson →
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "bg-linear-to-br from-blue-50 to-white border-blue-100",
        className,
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Icon className="size-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-600">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HistoryPage() {
  const { data: historyItems, isLoading } =
    trpc.lessons.getMyLessons.useQuery();

  const items = historyItems ?? [];
  const totalLessons = items.length;
  const completedLessons = items.filter(
    (item: any) => item.quizScore !== null && item.quizScore !== undefined,
  ).length;
  const avgScore =
    completedLessons > 0
      ? Math.round(
          items
            .filter(
              (item: any) =>
                item.quizScore !== null && item.quizScore !== undefined,
            )
            .reduce(
              (sum: number, item: any) => sum + (item.quizScore || 0),
              0,
            ) / completedLessons,
        )
      : 0;

  return (
    <div className="flex flex-col w-full h-full p-4 md:p-8 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 font-display mb-2">
          Learning History
        </h1>
        <p className="text-slate-600">
          Track your STEM learning journey and progress
        </p>
      </div>

      {/* Stats Cards - Bento Layout */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Total Lessons"
            value={totalLessons}
            icon={BookOpen}
          />
          <StatCard label="Completed" value={completedLessons} icon={Trophy} />
          <StatCard label="Avg Score" value={`${avgScore}%`} icon={Calendar} />
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && items.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <EmptyStateCard />
        </div>
      )}

      {/* History Items Grid - Bento Layout */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
          {items.map((item: any) => (
            <HistoryCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Footer Note */}
      <div className="mt-8 text-center text-slate-400 text-sm">
        {isLoading
          ? "Loading your learning history..."
          : `Showing ${totalLessons} lesson${totalLessons !== 1 ? "s" : ""}`}
      </div>
    </div>
  );
}
