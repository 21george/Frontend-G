'use client';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useClientAnalytics, useClient } from '@/lib/hooks';
import type { AnalyticsData } from '@/types';
import { ArrowLeft, Flame, Dumbbell, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { data: client }    = useClient(id);
  const { data: analytics, isLoading } = useClientAnalytics(id);

  const exerciseKeys = Object.keys(analytics?.exercise_progress ?? {}).slice(0, 5);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Merge exercise data into a unified chart format
  const mergedExerciseData = (() => {
    const dateMap: Record<string, Record<string, number>> = {};
    exerciseKeys.forEach((ex) => {
      (analytics?.exercise_progress[ex] ?? []).forEach(({ date, max_kg }: AnalyticsData['exercise_progress'][string][number]) => {
        if (!dateMap[date]) dateMap[date] = {};
        dateMap[date][ex] = max_kg;
      });
    });
    return Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({ date, ...vals }));
  })();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500">{client?.name}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-white animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Quick stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardBody className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 flex items-center justify-center">
                    <Flame className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">{analytics?.current_streak ?? 0}</p>
                    <p className="text-sm text-gray-500">Day streak</p>
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-50 flex items-center justify-center">
                    <Dumbbell className="w-6 h-6 text-brand-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">{analytics?.total_workouts ?? 0}</p>
                    <p className="text-sm text-gray-500">Total workouts</p>
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">
                      {analytics?.completion_rate?.[0]?.rate ?? 0}%
                    </p>
                    <p className="text-sm text-gray-500">Last week completion</p>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Completion rate chart */}
            <Card>
              <CardHeader><h3 className="font-semibold text-gray-900">Weekly Completion Rate</h3></CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics?.completion_rate ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => `${v}%`} />
                    <Bar dataKey="rate" name="Completion %" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            {/* Exercise weight progress */}
            {mergedExerciseData.length > 0 && (
              <Card>
                <CardHeader><h3 className="font-semibold text-gray-900">Weight Progress per Exercise (kg)</h3></CardHeader>
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

            {/* Body measurements */}
            {(analytics?.measurements?.length ?? 0) > 0 && (
              <Card>
                <CardHeader><h3 className="font-semibold text-gray-900">Body Weight (kg)</h3></CardHeader>
                <CardBody>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={analytics?.measurements ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="weight_kg" name="Weight (kg)" stroke="#10b981" strokeWidth={2} />
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
