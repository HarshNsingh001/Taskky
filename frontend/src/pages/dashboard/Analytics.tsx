import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { analyticsApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { toast } from 'sonner';

const PIE_COLORS = ['hsl(var(--primary))', '#f59e0b', '#10b981', '#0ea5e9'];

export default function Analytics() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { lastRefreshEvent } = useWebSocket();

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (lastRefreshEvent?.type.startsWith('refresh_')) {
      loadAnalytics();
    }
  }, [lastRefreshEvent]);

  const loadAnalytics = async () => {
    try {
      const res = await analyticsApi.dashboard();
      if (res.success) setData(res.data);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Analytics is available to admins only.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1400px] mx-auto w-full">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-muted/50 rounded-md animate-pulse"></div>
          <div className="h-4 w-64 bg-muted/50 rounded-md animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-[90px] bg-muted/50 rounded-xl animate-pulse border border-border/50"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[400px] bg-muted/50 rounded-xl animate-pulse border border-border/50"></div>
          <div className="flex flex-col gap-6">
            <div className="h-[250px] bg-muted/50 rounded-xl animate-pulse border border-border/50"></div>
            <div className="h-[250px] bg-muted/50 rounded-xl animate-pulse border border-border/50"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const taskDistribution = [
    { name: 'To Do', value: data.task_stats.todo },
    { name: 'In Progress', value: data.task_stats.in_progress },
    { name: 'Review', value: data.task_stats.review },
    { name: 'Done', value: data.task_stats.completed },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Deep dive into your team's productivity and velocity.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: data.task_stats.total },
          { label: 'Completed', value: data.task_stats.completed },
          { label: 'Overdue', value: data.task_stats.overdue },
          { label: 'Completion Rate', value: `${data.overall_completion_rate}%` },
        ].map((s, i) => (
          <Card key={i} className="shadow-sm border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">{s.label}</p>
              <p className="text-2xl font-bold tracking-tight">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="lg:col-span-2 flex flex-col">
          <Card className="h-full shadow-sm border-border/50 flex flex-col bg-card">
            <CardHeader className="p-5 border-b border-border/40">
              <CardTitle className="text-base font-semibold">Productivity Trends</CardTitle>
              <CardDescription className="text-xs">Tasks completed vs added (last 7 days).</CardDescription>
            </CardHeader>
            <CardContent className="p-5 flex-1 min-h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.productivity_trends} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAdded" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)' }} />
                  <Area type="monotone" dataKey="completed" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" name="Completed" activeDot={{ r: 4 }} />
                  <Area type="monotone" dataKey="added" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorAdded)" name="Added" activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="flex flex-col gap-6">
          <Card className="flex-1 shadow-sm border-border/50 flex flex-col bg-card">
            <CardHeader className="p-5 pb-0">
              <CardTitle className="text-base font-semibold">Task Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2 flex-1 min-h-[200px] flex items-center justify-center relative">
              {taskDistribution.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={taskDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                        {taskDistribution.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col mt-2">
                    <span className="text-2xl font-bold text-foreground leading-tight">{data.task_stats.total}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No tasks yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50 bg-card">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-semibold">Team Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4">
              {data.team_performance.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No team data yet</p>
              ) : (
                data.team_performance.slice(0, 5).map((member: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold shrink-0">
                      {member.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-xs font-medium truncate">{member.full_name}</span>
                        <span className="text-[10px] font-semibold text-muted-foreground">{member.completion_rate}%</span>
                      </div>
                      <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${member.completion_rate}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
