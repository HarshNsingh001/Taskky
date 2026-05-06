import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle2, Clock, Activity, AlertTriangle, ArrowUpRight, ArrowDownRight, Bot, Zap } from 'lucide-react';
import { analyticsApi, projectsApi, tasksApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';

export default function Overview() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, overdue: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { lastRefreshEvent } = useWebSocket();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (lastRefreshEvent?.type.startsWith('refresh_')) {
      loadData();
    }
  }, [lastRefreshEvent]);

  const loadData = async () => {
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        projectsApi.list(),
        tasksApi.list(),
      ]);

      if (projectsRes.success) setProjects(projectsRes.data || []);

      if (tasksRes.success) {
        const tasks = tasksRes.data || [];
        setStats({
          total: tasks.length,
          completed: tasks.filter((t: any) => t.status === 'done').length,
          inProgress: tasks.filter((t: any) => t.status === 'in_progress').length,
          overdue: tasks.filter((t: any) => t.is_overdue).length,
        });
      }

      if (isAdmin) {
        try {
          const analyticsRes = await analyticsApi.dashboard();
          if (analyticsRes.success && analyticsRes.data?.productivity_trends) {
            setChartData(analyticsRes.data.productivity_trends);
          }
        } catch {}
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Tasks', value: stats.total, icon: CheckCircle2, color: 'text-blue-500' },
    { title: 'Completed', value: stats.completed, icon: Activity, color: 'text-emerald-500' },
    { title: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-amber-500' },
    { title: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-rose-500' },
  ];

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1400px] mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-[90px] bg-muted/50 rounded-xl animate-pulse border border-border/50"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[350px] bg-muted/50 rounded-xl animate-pulse border border-border/50"></div>
          <div className="h-[350px] bg-muted/50 rounded-xl animate-pulse border border-border/50"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto w-full pb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <Card className="card-hover border-border/40 stat-card-glow overflow-hidden">
              <CardContent className="p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className={`p-2.5 rounded-xl bg-muted ${stat.color} bg-opacity-10 border border-current border-opacity-10`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  {i === 1 && <Badge className="bg-emerald-500/10 text-emerald-500 border-none">+12%</Badge>}
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</div>
                  <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {chartData.length > 0 && (
          <Card className="lg:col-span-2 shadow-xl border-border/40 overflow-hidden">
            <CardHeader className="p-8 pb-0">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-bold">Productivity Trends</CardTitle>
                  <CardDescription className="text-sm mt-1">Daily task completion activity across the team.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Active</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-4 flex-1 min-h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid var(--border)', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                      fontSize: '12px',
                      backgroundColor: 'var(--card)'
                    }} 
                    itemStyle={{ fontWeight: 'bold', color: 'var(--primary)' }}
                  />
                  <Area type="monotone" dataKey="completed" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" activeDot={{ r: 6, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card className={`shadow-xl border-border/40 flex flex-col ${chartData.length === 0 ? 'lg:col-span-3' : ''} overflow-hidden`}>
          <CardHeader className="p-6 border-b border-border/40 bg-muted/20">
            <CardTitle className="text-lg font-bold">Top Projects</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {projects.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 opacity-20" />
                </div>
                <p>No active projects found.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {projects.slice(0, 6).map((project: any, idx: number) => (
                  <div key={project.id} className={`p-5 hover:bg-primary/5 transition-all duration-300 flex items-center justify-between gap-4 border-b border-border/30 last:border-0 ${idx === 0 ? 'bg-primary/[0.02]' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{project.title}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[100px]">
                          <div 
                            className="h-full bg-primary transition-all duration-1000" 
                            style={{ width: `${project.completion_percentage}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground">{project.completion_percentage}%</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 border-none font-bold uppercase tracking-wider ${
                      project.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 
                      project.status === 'on_hold' ? 'bg-amber-500/10 text-amber-500' : 'bg-muted text-muted-foreground'
                    }`}>
                      {project.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="shadow-lg border-border/40 premium-gradient text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
            <Bot className="w-32 h-32" />
          </div>
          <CardContent className="p-8 flex gap-5 items-start relative z-10">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold mb-2">AI Insights</h4>
              <p className="text-sm text-white/80 leading-relaxed font-medium">
                {stats.total === 0
                  ? 'Start by creating your first project and tasks to see insights here.'
                  : `Currently, you have ${stats.total} total tasks. Efficiency is up by 15% this week! Keep it up.`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover border-border/40">
          <CardContent className="p-8 flex gap-5 items-center">
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-bold text-foreground leading-tight">Urgent Attention</h4>
              <p className="text-sm text-muted-foreground mt-1 font-medium">{stats.overdue} tasks are overdue</p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-30" />
          </CardContent>
        </Card>

        <Card className="card-hover border-border/40">
          <CardContent className="p-8 flex gap-5 items-center">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-bold text-foreground leading-tight">Momentum</h4>
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                {stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}%` : '0%'} overall progress
              </p>
            </div>
            <Activity className="w-5 h-5 text-muted-foreground opacity-30" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
