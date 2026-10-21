import { useEffect, useState } from 'react';
import { Dumbbell, Calendar, Star, FileText, Sparkles, Activity } from 'lucide-react';
import { recordApi } from '@/api/record.api';
import type { SessionRecord } from '@/types/record';
import { Card } from '@/components/ui/Card';

const ITEMS_PER_PAGE = 6;

export default function HistoryPage() {
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    recordApi
      .getMine()
      .then((data) => setRecords(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center py-12 text-sm text-slate-500">
        Loading workout history...
      </div>
    );
  }

  const totalPages = Math.ceil(records.length / ITEMS_PER_PAGE) || 1;
  const paginatedRecords = records.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div>
      {/* Header Section */}
      <div className="mb-6 space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
          Progress
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Workout history
        </h1>
        <p className="text-sm text-slate-500">
          Your trainer notes, exercises and feedback in one place.
        </p>
      </div>

      {records.length === 0 ? (
        <Card className="py-12 text-center shadow-xs">
          <Activity className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-800">No History Yet</h3>
          <p className="mt-1 text-xs text-slate-500">
            Completed workout sessions and trainer logs will appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1 text-xs text-slate-500">
            <span>
              Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(page * ITEMS_PER_PAGE, records.length)} of {records.length} records
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {paginatedRecords.map((record) => (
              <Card
                key={record._id}
                className="flex flex-col justify-between p-5 shadow-xs transition-all hover:border-slate-300"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <Dumbbell className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-slate-900 text-sm">
                        Session Record
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {record.customerRating && (
                        <div className="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-200/60">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{record.customerRating}/5</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs font-medium text-slate-400">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {new Date(
                            record.createdAt ?? Date.now()
                          ).toLocaleDateString(undefined, {
                            dateStyle: 'medium',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Exercises List */}
                  {record.exercises && record.exercises.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Exercises Performed
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {record.exercises.map((e, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1 text-xs text-slate-700"
                          >
                            <span className="font-bold text-slate-900">{e.name}</span>
                            <span className="text-slate-400">·</span>
                            <span className="font-medium text-emerald-700">
                              {e.sets}×{e.reps ?? '-'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trainer Notes */}
                  {record.trainerNotes && (
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                        <FileText className="h-3.5 w-3.5 text-slate-500" />
                        <span>Trainer Notes</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pl-5">
                        {record.trainerNotes}
                      </p>
                    </div>
                  )}

                  {/* Suggested Next Workout */}
                  {record.suggestedNextWorkout && (
                    <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Suggested Next Focus</span>
                      </div>
                      <p className="text-xs font-semibold text-emerald-900 pl-5">
                        {record.suggestedNextWorkout}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-4 mt-6">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}