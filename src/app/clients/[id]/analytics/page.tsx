'use client';
import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useClientAnalytics, useClient } from '@/lib/hooks';
import { ArrowLeft, Flame, Dumbbell, TrendingUp, Trophy, Scale } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

/* ─── Human body silhouette ─────────────────────────────────────────────── */
function BodySilhouette() {
  return (
    <svg viewBox="0 0 100 265" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-full h-full">
      <g fill="#e2e8f0" className="dark:fill-white/[0.1]">
        <circle cx="50" cy="17" r="14" />
        <rect x="44" y="29" width="12" height="10" />
        <path d="M 22,38 Q 50,34 78,38 L 74,106 Q 50,112 26,106 Z" />
        <path d="M 22,40 L 8,48 L 5,116 L 15,116 L 17,56 L 24,44 Z" />
        <path d="M 78,40 L 92,48 L 95,116 L 85,116 L 83,56 L 76,44 Z" />
        <path d="M 26,106 L 46,106 L 44,256 L 24,256 Z" />
        <path d="M 54,106 L 74,106 L 76,256 L 56,256 Z" />
      </g>
      <line x1="10" y1="58" x2="90" y2="58" stroke="#3b82f6" strokeWidth="1.2" strokeDasharray="3 2" strokeOpacity="0.7" />
      <line x1="16" y1="84" x2="84" y2="84" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3 2" strokeOpacity="0.7" />
      <line x1="20" y1="106" x2="80" y2="106" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3 2" strokeOpacity="0.7" />
    </svg>
  );
}

/* ─── Measurement badge ─────────────────────────────────────────────────── */
function MeasureBadge({
  label, value, prev, unit, dotColor,
}: {
  label: string; value: number | null | undefined; prev?: number | null; unit: string; dotColor: string;
}) {
  const diff = value != null && prev != null ? +(value - prev).toFixed(1) : null;
  return (
    <div className="p-3 rounded-lg border border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-[17px] font-bold text-gray-900 dark:text-white">
        {value != null ? `${value} ${unit}` : <span className="text-gray-300">—</span>}
      </p>
      {diff != null && (
        <p className={`text-[10px] font-medium mt-0.5 ${diff < 0 ? 'text-emerald-500' : diff > 0 ? 'text-rose-400' : 'text-gray-400'}`}>
          {diff > 0 ? '+' : ''}{diff} {unit} vs prev
        </p>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { data: client }    = useClient(id);
  const { data: analytics, isLoading } = useClientAnalytics(id);

  const exerciseKeys = Object.keys(analytics?.exercise_progress ?? {}).slice(0, 5);
  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Merge exercise data into a unified chart format
  const mergedExerciseData = useMemo(() => {
    const dateMap: Record<string, Record<string, number>> = {};
    exerciseKeys.forEach((ex) => {
      (analytics?.exercise_progress[ex] ?? []).forEach(({ date, max_kg }: { date: string; max_kg: number }) => {
        if (!dateMap[date]) dateMap[date] = {};
        dateMap[date][ex] = max_kg;
      });
    });
    return Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({ date, ...vals }));
  }, [analytics?.exercise_progress, exerciseKeys]);

  // Computed stats
  const completionRates = analytics?.completion_rate ?? [];
  const latestWeekRate  = completionRates.at(-1)?.rate ?? 0;
  const avgCompletion   = useMemo(() => {
    if (!completionRates.length) return 0;
    return Math.round(completionRates.reduce((s: number, w: { rate: number }) => s + w.rate, 0) / completionRates.length);
  }, [completionRates]);

  const totalVolumeKg  = analytics?.total_volume ?? 0;
  const volumeDisplay  = totalVolumeKg >= 1000
    ? `${(totalVolumeKg / 1000).toFixed(1)} t`
    : `${totalVolumeKg} kg`;

  const measurements = analytics?.measurements ?? [];
  const latestM = measurements.at(-1) ?? null;
  const prevM   = measurements.at(-2) ?? null;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-lg text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-sm text-gray-500">{client?.name}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white dark:bg-white/[0.04] rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* ── Quick stats ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardBody className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Flame className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics?.current_streak ?? 0}</p>
                    <p className="text-xs text-gray-500">Day streak</p>
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics?.total_workouts ?? 0}</p>
                    <p className="text-xs text-gray-500">Total workouts</p>
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-violet-50 dark:bg-violet-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgCompletion}%</p>
                    <p className="text-xs text-gray-500">Avg completion</p>
                    <p className="text-[10px] text-gray-400">Last week: {latestWeekRate}%</p>
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{volumeDisplay}</p>
                    <p className="text-xs text-gray-500">Volume lifted</p>
                    <p className="text-[10px] text-gray-400">{analytics?.total_sets ?? 0} sets · {analytics?.total_reps ?? 0} reps</p>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* ── Body Composition ─────────────────────────────────────── */}
            {latestM && (
              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-indigo-500" />
                    Body Composition
                  </h3>
                  {latestM.date && <p className="text-xs text-gray-400 mt-0.5">Latest: {latestM.date}</p>}
                </CardHeader>
                <CardBody>
                  <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                    {/* Silhouette */}
                    <div className="w-20 sm:w-24 flex-shrink-0">
                      <BodySilhouette />
                    </div>
                    {/* Measurement grid */}
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                      <MeasureBadge label="Weight"   value={latestM.weight_kg}    prev={prevM?.weight_kg}    unit="kg" dotColor="#6366f1" />
                      <MeasureBadge label="Chest"    value={latestM.chest_cm}     prev={prevM?.chest_cm}     unit="cm" dotColor="#3b82f6" />
                      <MeasureBadge label="Waist"    value={latestM.waist_cm}     prev={prevM?.waist_cm}     unit="cm" dotColor="#10b981" />
                      <MeasureBadge label="Hips"     value={latestM.hips_cm}      prev={prevM?.hips_cm}      unit="cm" dotColor="#f59e0b" />
                      <MeasureBadge label="Body Fat" value={latestM.body_fat_pct} prev={prevM?.body_fat_pct} unit="%" dotColor="#8b5cf6" />
                    </div>
                  </div>
                  {/* Weight over time chart */}
                  {measurements.length > 1 && (
                    <div className="mt-6">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Weight over time</p>
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={measurements}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="weight_kg" name="Weight (kg)" stroke="#6366f1" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardBody>
              </Card>
            )}

            {/* ── Completion rate chart ─────────────────────────────────── */}
            <Card>
              <CardHeader><h3 className="font-semibold text-gray-900 dark:text-white">Weekly Completion Rate</h3></CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics?.completion_rate ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Bar dataKey="rate" name="Completion %" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            {/* ── Exercise weight progress ──────────────────────────────── */}
            {mergedExerciseData.length > 0 && (
              <Card>
                <CardHeader><h3 className="font-semibold text-gray-900 dark:text-white">Weight Progress per Exercise (kg)</h3></CardHeader>
                <CardBody>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mergedExerciseData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      {exerciseKeys.map((ex, i) => (
                        <Line key={ex} type="monotone" dataKey={ex} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardBody>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
