
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, ReferenceLine, Legend
} from 'recharts';
import { useApp } from '../store';

const COLORS = ['#10b981', '#111827', '#6366f1', '#f59e0b', '#ef4444', '#ec4899'];

const Stats: React.FC = () => {
  const { state } = useApp();
  const [prefMode, setPrefMode] = useState<'month' | 'year'>('month');
  const [heatmapDate, setHeatmapDate] = useState(new Date());

  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthActivities = state.activities.filter(a => a.date.startsWith(currentMonthStr));
    const annualUniqueDays = new Set(state.activities.map(a => a.date)).size;
    const monthUniqueDays = new Set(monthActivities.map(a => a.date)).size;
    const monthDurationHours = (monthActivities.reduce((s, a) => s + a.duration, 0) / 60).toFixed(1);
    
    let maxStreak = 0;
    let currentStreak = 0;
    const sortedDates = [...new Set(state.activities.map(a => a.date))].sort();
    if (sortedDates.length > 0) {
      currentStreak = 1; maxStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const d1 = new Date(sortedDates[i-1] as string);
        const d2 = new Date(sortedDates[i] as string);
        if ((d2.getTime() - d1.getTime()) / 86400000 === 1) {
          currentStreak++; maxStreak = Math.max(maxStreak, currentStreak);
        } else { currentStreak = 1; }
      }
    }
    return { annualUniqueDays, monthUniqueDays, monthDurationHours, maxStreak };
  }, [state.activities]);

  const typeDistribution = useMemo(() => {
    const now = new Date();
    const filterStr = prefMode === 'month' ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` : `${now.getFullYear()}`;
    const filtered = state.activities.filter(a => a.date.startsWith(filterStr));
    const map: Record<string, number> = {};
    filtered.forEach(a => { map[a.type] = (map[a.type] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [state.activities, prefMode]);

  const annualTrend = useMemo(() => {
    const year = new Date().getFullYear();
    return Array.from({ length: 12 }).map((_, i) => ({
      month: `${i + 1}月`,
      days: new Set(state.activities.filter(a => a.date.startsWith(`${year}-${String(i + 1).padStart(2, '0')}`)).map(a => a.date)).size
    }));
  }, [state.activities]);

  const yAxisDomainMax = useMemo(() => {
    const monthlyGoal = state.goals.monthlyDays;
    const maxMonthDays = Math.max(...annualTrend.map(d => d.days), 0);
    return Math.max(monthlyGoal, maxMonthDays);
  }, [annualTrend, state.goals.monthlyDays]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      {/* 深炭黑看板 */}
      <section className="bg-slate-900 rounded-[3rem] p-8 shadow-2xl shadow-slate-200 text-white relative overflow-hidden">
        <div className="absolute top-8 right-8 w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
          <span className="text-xl">🏆</span>
        </div>
        <h2 className="text-2xl font-black mb-1">趋势看板</h2>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-10">Achievement Status</p>

        <div className="grid grid-cols-2 gap-x-8 gap-y-10">
          <MetricItem 
            title="年度打卡" 
            value={metrics.annualUniqueDays} 
            target={state.goals.annualDays} 
            color="text-emerald-400"
            showProgress 
          />
          <MetricItem 
            title="最高连胜" 
            value={metrics.maxStreak} 
            color="text-orange-400" 
          />
          <MetricItem 
            title="本月打卡" 
            value={metrics.monthUniqueDays} 
            target={state.goals.monthlyDays} 
            color="text-emerald-400"
            showProgress 
          />
          <MetricItem 
            title="本月时长" 
            value={metrics.monthDurationHours} 
            unit="H" 
            color="text-indigo-400" 
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6">
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">运动偏好</h3>
            <div className="flex bg-slate-100 p-1 rounded-full">
              {(['month', 'year'] as const).map(m => (
                <button key={m} onClick={() => setPrefMode(m)} className={`px-4 py-1.5 text-[9px] font-black rounded-full transition-all ${prefMode === m ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>{m === 'month' ? '本月' : '年度'}</button>
              ))}
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeDistribution} innerRadius={50} outerRadius={70} paddingAngle={6} dataKey="value" stroke="none">
                  {typeDistribution.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: '800', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">年度趋势</h3>
            <span className="text-[10px] font-black text-emerald-500 uppercase">目标: {state.goals.monthlyDays}天/月</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={annualTrend} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 'bold'}} />
                <YAxis domain={[0, yAxisDomainMax]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '20px', border: 'none', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="days" fill="#10b981" radius={[6, 6, 0, 0]} barSize={16} />
                <ReferenceLine y={state.goals.monthlyDays} stroke="#f59e0b" strokeDasharray="4 2" strokeWidth={1.5} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">能量地图</h3>
          <div className="flex items-center space-x-4">
            <button onClick={() => setHeatmapDate(new Date(heatmapDate.getFullYear(), heatmapDate.getMonth() - 1, 1))} className="text-slate-400">◀</button>
            <span className="text-[11px] font-black text-slate-900">{heatmapDate.getFullYear()}年{heatmapDate.getMonth()+1}月</span>
            <button onClick={() => setHeatmapDate(new Date(heatmapDate.getFullYear(), heatmapDate.getMonth() + 1, 1))} className="text-slate-400">▶</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-3 mb-6">
          {['一','二','三','四','五','六','日'].map(d => <div key={d} className="text-[10px] font-black text-slate-300 text-center uppercase">{d}</div>)}
          {Array.from({ length: (new Date(heatmapDate.getFullYear(), heatmapDate.getMonth(), 1).getDay() || 7) - 1 }).map((_, i) => <div key={i} />)}
          {Array.from({ length: new Date(heatmapDate.getFullYear(), heatmapDate.getMonth()+1, 0).getDate() }).map((_, i) => {
            const dStr = `${heatmapDate.getFullYear()}-${String(heatmapDate.getMonth()+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;
            const dur = state.activities.filter(a => a.date === dStr).reduce((s,a) => s+a.duration, 0);
            return (
              <div key={i} className={`aspect-square rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${dur >= state.goals.dailyMinutes ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : dur > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-300'}`}>
                {i+1}
              </div>
            );
          })}
        </div>
        
        {/* 图例说明 */}
        <div className="flex justify-center items-center space-x-6 pt-2 border-t border-slate-50">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-slate-50 rounded-sm border border-slate-100"></div>
            <span className="text-[10px] font-bold text-slate-400">未打卡</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-emerald-100 rounded-sm"></div>
            <span className="text-[10px] font-bold text-slate-400">未达标</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-sm shadow shadow-emerald-100"></div>
            <span className="text-[10px] font-bold text-slate-400">已达标</span>
          </div>
        </div>
      </section>
    </div>
  );
};

const MetricItem = ({ title, value, target, unit = '', color, showProgress = false }: any) => {
  const percent = target ? Math.min(100, Math.round((value / target) * 100)) : 0;
  
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{title}</div>
      <div className={`text-3xl font-black flex items-baseline ${color} tabular-nums`}>
        {value}
        {target && <span className="text-xs text-slate-600 ml-1 font-bold">/ {target}</span>}
        <span className="text-xs ml-0.5 opacity-60 uppercase">{unit}</span>
      </div>
      {showProgress && target && (
        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-current ${color} transition-all duration-1000`} 
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default Stats;
