"use client";

import { trpc } from "@/lib/trpc/client";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
  const { data: historyItems, isLoading } = trpc.lessons.getMyLessons.useQuery();

  return (
    <div className="flex flex-col w-full h-full p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8 font-display">
        Learning History
      </h1>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[300px] flex flex-col">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-6">Lesson Title</div>
          <div className="col-span-3">Date Completed</div>
          <div className="col-span-3 text-right">Quiz Score</div>
        </div>

        {/* Loading State */}
        {isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 className="animate-spin text-blue-500" size={32} />
                <p>Loading history...</p>
            </div>
        )}

        {/* Empty State */}
        {!isLoading && (!historyItems || historyItems.length === 0) && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <p>No lessons found yet.</p>
                <p className="text-sm">Start a new chat to generate your first lesson!</p>
            </div>
        )}

        {/* History Items */}
        <div className="divide-y divide-slate-100">
          {historyItems?.map((item: any) => (
            <Link 
              key={item.id} 
              href={`/lesson/${item.id}`}
              className="block hover:bg-blue-50/30 transition-colors"
            >
              <div
                className="grid grid-cols-12 gap-4 px-6 py-5 items-center"
              >
                <div className="col-span-6">
                  <p className="font-semibold text-slate-900">{item.topic}</p> {/* Using topic as title for now */}
                  <p className="text-sm text-slate-400 mt-0.5 capitalize">{item.complexity || "Standard"} Lesson</p>
                </div>
                
                <div className="col-span-3 text-slate-600 font-medium">
                  {item.createdAt ? format(new Date(item.createdAt), "MMM d, yyyy") : "N/A"}
                </div>

                <div className="col-span-3 text-right">
                  {/* Placeholder for Score since it's not in the DB schema yet */}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-slate-100 text-slate-600`}>
                    - / -
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Footer Note */}
      <div className="mt-8 text-center text-slate-400 text-sm">
        Showing recent learning activity.
      </div>
    </div>
  );
}
