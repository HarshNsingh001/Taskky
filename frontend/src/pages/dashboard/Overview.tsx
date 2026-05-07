import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  CheckCircle2, Clock, Activity, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Bot, Zap, Target, Plus, Flame, Sparkles, TrendingUp, Users, 
  Briefcase, MessageSquare, CalendarDays, MoreHorizontal
} from 'lucide-react';
import { analyticsApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { Link } from 'react-router-dom';

const DONUT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Overview() {
  const { isAdmin, user } = useAuth();
  const [data, setData] = useState<any>(null);
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
      if (isAdmin) {
        const res = await analyticsApi.dashboard();
        if (res.success) {
          setData(res.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading || !data) {
    return (
      <div className="space-y-6 max-w-[1400px] mx-auto w-full p-4 lg:p-8 animate-in fade-in duration-700">
        <div className="flex justify-between items-center">
          <div className="h-8 w-64 bg-muted/50 rounded-lg animate-pulse"></div>
          <div className="h-10 w-32 bg-muted/50 rounded-lg animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-muted/30 rounded-2xl animate-pulse border border-border/40"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[400px] bg-muted/30 rounded-2xl animate-pulse border border-border/40"></div>
          <div className="h-[400px] bg-muted/30 rounded-2xl animate-pulse border border-border/40"></div>
        </div>
      </div>
    );
  }

  const { task_stats, project_stats, productivity_trends, team_performance, overall_completion_rate, productivity_score, today_focus, task_distribution, upcoming_deadlines, top_projects, recent_activity, insights } = data;

  const statCards = [
    { title: 'Total Tasks', value: task_stats.total, icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Completed', value: task_stats.completed, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: '+12%' },
    { title: 'In Progress', value: task_stats.in_progress, icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'Overdue', value: task_stats.overdue, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10', trend: '-2%' },
  ];

  const distributionData = [
    { name: 'Completed', value: task_distribution.completed },
    { name: 'Pending', value: task_distribution.pending },
    { name: 'Review', value: task_distribution.review },
    { name: 'Overdue', value: task_distribution.overdue },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto w-full pb-16 px-2 lg:px-4">
      
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Overview <span className="text-muted-foreground font-normal text-xl hidden sm:inline">| Welcome back, {user?.full_name?.split(' ')[0] || 'Admin'}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening across your workspace today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="hidden sm:flex" asChild>
            <Link to="/dashboard/team"><Users className="w-4 h-4 mr-2" /> Invite</Link>
          </Button>
          <Button className="shadow-lg shadow-primary/20 transition-transform hover:scale-105" asChild>
            <Link to="/dashboard/tasks"><Plus className="w-4 h-4 mr-2" /> New Task</Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }}>
            <Card className="card-hover border-border/40 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-current opacity-5 rounded-bl-full -z-10 transition-transform group-hover:scale-110" style={{ color: stat.color.replace('text-', '') }}></div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} border border-current border-opacity-10`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  {stat.trend && (
                    <Badge variant="outline" className={`${stat.trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'} border-none font-bold`}>
                      {stat.trend.startsWith('+') ? <TrendingUp className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                      {stat.trend}
                    </Badge>
                  )}
                </div>
                <div className="mt-6">
                  <div className="text-4xl font-bold tracking-tight">{stat.value}</div>
                  <div className="text-sm font-medium text-muted-foreground mt-1">{stat.title}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Middle Section: Main Analytics & Today's Focus */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Productivity Analytics (Spans 2 columns on XL) */}
        <Card className="xl:col-span-2 shadow-xl border-border/40 overflow-hidden flex flex-col">
          <CardHeader className="p-6 md:p-8 pb-0">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" /> Productivity Flow
                </CardTitle>
                <CardDescription className="text-sm mt-1">Daily task completion vs creation velocity.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="bg-muted hover:bg-muted font-medium">Last 7 Days</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 pt-6 flex-1 min-h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productivity_trends} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAdded" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" opacity={0.4} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--card)', padding: '12px' }} 
                  itemStyle={{ fontWeight: '600' }}
                />
                <Area type="monotone" name="Tasks Completed" dataKey="completed" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--primary)' }} />
                <Area type="monotone" name="Tasks Added" dataKey="added" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorAdded)" activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Right Column: Focus & Productivity Score */}
        <div className="flex flex-col gap-8">
          
          {/* Today Focus Widget */}
          <Card className="shadow-lg border-border/40 premium-gradient text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
              <Target className="w-32 h-32" />
            </div>
            <CardContent className="p-8 relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  <Flame className="w-6 h-6 text-amber-300" />
                </div>
                <Badge className="bg-white/20 text-white hover:bg-white/30 border-none backdrop-blur-md">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                </Badge>
              </div>
              <h4 className="text-2xl font-bold mb-1">Today's Focus</h4>
              <p className="text-sm text-white/80 font-medium mb-6">
                {today_focus.due_today} tasks due today • {today_focus.workload_estimate_hours}h est. workload
              </p>
              
              <div className="space-y-4">
                {today_focus.highest_priority_task && (
                  <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="text-xs text-amber-300 font-bold tracking-wider uppercase mb-1 flex items-center"><AlertTriangle className="w-3 h-3 mr-1" /> Top Priority</div>
                    <div className="font-medium text-white line-clamp-1">{today_focus.highest_priority_task}</div>
                  </div>
                )}
                {today_focus.overdue > 0 && (
                  <div className="bg-rose-500/20 backdrop-blur-sm rounded-xl p-4 border border-rose-500/30 flex justify-between items-center">
                    <div>
                      <div className="text-xs text-rose-300 font-bold tracking-wider uppercase mb-1">Attention Needed</div>
                      <div className="font-medium text-white">{today_focus.overdue} tasks are overdue</div>
                    </div>
                    <Button size="sm" variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-none h-8" asChild>
                      <Link to="/dashboard/tasks">View</Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Productivity Score */}
          <Card className="shadow-lg border-border/40 overflow-hidden flex-1">
            <CardContent className="p-8 flex flex-col h-full justify-center">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-bold text-foreground">Health Score</h4>
                <div className="p-2 bg-primary/10 rounded-lg text-primary"><Sparkles className="w-5 h-5" /></div>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-6xl font-black tracking-tighter text-foreground">{productivity_score}</span>
                <span className="text-xl font-medium text-muted-foreground mb-1.5">/100</span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden mt-4">
                <motion.div 
                  initial={{ width: 0 }} animate={{ width: `${productivity_score}%` }} transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${productivity_score >= 80 ? 'bg-emerald-500' : productivity_score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-4 font-medium leading-relaxed">
                {productivity_score >= 80 ? 'Excellent momentum! Your team is highly productive.' : 
                 productivity_score >= 50 ? 'Good progress, but keep an eye on overdue tasks.' : 
                 'Attention required. High overdue ratio detected.'}
              </p>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Bottom Section: 3 Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Top Projects */}
        <Card className="shadow-xl border-border/40 flex flex-col overflow-hidden col-span-1 lg:col-span-2 xl:col-span-1">
          <CardHeader className="p-6 border-b border-border/40 bg-muted/10 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary" /> Top Projects</CardTitle>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground" asChild><Link to="/dashboard/projects">View All</Link></Button>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto max-h-[400px]">
            {top_projects.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">No active projects.</div>
            ) : (
              <div className="flex flex-col">
                {top_projects.map((project: any, idx: number) => (
                  <div key={project.id} className="p-5 hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0 group cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-foreground truncate max-w-[70%] group-hover:text-primary transition-colors">{project.title}</p>
                      <Badge variant="outline" className={`text-[10px] uppercase font-bold border-none ${
                        project.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 
                        project.status === 'on_hold' ? 'bg-amber-500/10 text-amber-500' : 'bg-muted text-muted-foreground'
                      }`}>{project.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 w-1/2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${project.completion_percentage}%` }} />
                        </div>
                        <span className="text-xs font-bold text-muted-foreground">{project.completion_percentage}%</span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground font-medium gap-3">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {project.member_count}</span>
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {project.task_count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insights & Task Distribution */}
        <div className="flex flex-col gap-6">
          <Card className="shadow-lg border-border/40 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 overflow-hidden border-indigo-500/10">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Bot className="w-5 h-5" /> Smart Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <ul className="space-y-4 mt-2">
                {insights.map((insight: string, idx: number) => (
                  <motion.li key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="flex items-start gap-3">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                    <span className="text-sm font-medium text-foreground/80 leading-relaxed">{insight}</span>
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-border/40 flex-1">
            <CardHeader className="p-6 pb-0">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Task Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex items-center justify-center h-[200px]">
              {distributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                      {distributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-sm text-muted-foreground">No tasks available</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed & Deadlines */}
        <div className="flex flex-col gap-6">
          {/* Upcoming Deadlines */}
          <Card className="shadow-lg border-border/40">
            <CardHeader className="p-5 border-b border-border/40 bg-muted/10">
              <CardTitle className="text-base font-bold flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary" /> Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {upcoming_deadlines.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No upcoming deadlines.</div>
              ) : (
                <div className="divide-y divide-border/30">
                  {upcoming_deadlines.slice(0, 3).map((task: any) => (
                    <div key={task.id} className="p-4 flex items-start gap-3 hover:bg-muted/20 transition-colors">
                      <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${task.priority === 'urgent' ? 'bg-rose-500' : task.priority === 'high' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">{formatDate(task.due_date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="shadow-lg border-border/40 flex-1 flex flex-col overflow-hidden">
            <CardHeader className="p-5 border-b border-border/40 bg-muted/10">
              <CardTitle className="text-base font-bold flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto max-h-[250px]">
              {recent_activity.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No recent activity.</div>
              ) : (
                <div className="relative p-5">
                  <div className="absolute top-5 bottom-5 left-8 w-px bg-border/50"></div>
                  <div className="space-y-6 relative">
                    {recent_activity.slice(0, 5).map((log: any, idx: number) => (
                      <div key={log.id} className="flex gap-4">
                        <Avatar className="w-8 h-8 shrink-0 border-2 border-background shadow-sm relative z-10">
                          {log.user?.avatar_url && <AvatarImage src={log.user.avatar_url} />}
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                            {getInitials(log.user?.full_name || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 pt-1">
                          <p className="text-sm font-medium text-foreground leading-tight">
                            <span className="font-bold">{log.user?.full_name?.split(' ')[0] || 'User'}</span>{' '}
                            <span className="text-muted-foreground font-normal">{log.action.replace(/_/g, ' ').toLowerCase()}</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-1 font-medium">{new Date(log.timestamp).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', month: 'short', day: 'numeric' })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
