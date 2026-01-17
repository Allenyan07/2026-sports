
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { ActivityRecord } from '../types';

const Dashboard: React.FC = () => {
  const { state, addActivity, updateActivity, deleteActivity, addCategory } = useApp();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ActivityRecord | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isAddingNewType, setIsAddingNewType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const sortedCategories = useMemo(() => {
    const lastUsedMap: Record<string, number> = {};
    state.activities.forEach(a => {
      const time = new Date(a.recordedAt).getTime();
      if (!lastUsedMap[a.type] || time > lastUsedMap[a.type]) {
        lastUsedMap[a.type] = time;
      }
    });

    return [...state.categories].sort((a, b) => {
      const timeA = lastUsedMap[a.name] || 0;
      const timeB = lastUsedMap[b.name] || 0;
      if (timeA !== timeB) return timeB - timeA;
      return 0;
    });
  }, [state.categories, state.activities]);

  const [formData, setFormData] = useState({
    date: todayStr,
    type: '',
    duration: state.goals.dailyMinutes,
  });

  const openModal = (record?: ActivityRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        date: record.date,
        type: record.type,
        duration: record.duration,
      });
    } else {
      setEditingRecord(null);
      setFormData({
        date: todayStr,
        type: sortedCategories.length > 0 ? sortedCategories[0].name : '',
        duration: state.goals.dailyMinutes,
      });
    }
    setIsAddingNewType(false);
    setNewTypeName('');
    setErrorMsg('');
    setShowModal(true);
  };

  const todayRecords = useMemo(() => 
    state.activities.filter(a => a.date === todayStr), 
  [state.activities, todayStr]);

  const totalTodayDuration = useMemo(() => 
    todayRecords.reduce((sum, r) => sum + r.duration, 0),
  [todayRecords]);

  const completionPercent = Math.round((totalTodayDuration / state.goals.dailyMinutes) * 100);
  const progressWidth = Math.min(100, (totalTodayDuration / state.goals.dailyMinutes) * 100);

  const streak = useMemo(() => {
    let currentStreak = 0;
    const sortedDates = [...new Set(state.activities.map(a => a.date))].sort().reverse();
    if (sortedDates.length === 0) return 0;
    for (let i = 0; i < sortedDates.length; i++) {
      const d = new Date(sortedDates[i] as string);
      const expected = new Date(todayStr);
      expected.setDate(expected.getDate() - i);
      if (d.toISOString().split('T')[0] === expected.toISOString().split('T')[0]) {
        currentStreak++;
      } else { break; }
    }
    return currentStreak;
  }, [state.activities, todayStr]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    let finalType = formData.type;
    
    if (isAddingNewType) {
      if (!newTypeName.trim()) {
        setErrorMsg('请输入自定义项目名称');
        return;
      }
      addCategory(newTypeName.trim());
      const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u;
      const match = newTypeName.trim().match(emojiRegex);
      finalType = match ? newTypeName.trim().replace(match[0], '').trim() || match[0] : newTypeName.trim();
    }

    if (editingRecord) {
      updateActivity({ ...editingRecord, ...formData, type: finalType });
      setSuccessMsg('已更新 ✨');
    } else {
      addActivity({ ...formData, type: finalType });
      setSuccessMsg('打卡完成 ✨');
    }
    setShowModal(false);
    setNewTypeName('');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const handleDelete = () => {
    if (editingRecord) {
      deleteActivity(editingRecord.id);
      setShowModal(false);
      setSuccessMsg('已删除 🗑️');
      setTimeout(() => setSuccessMsg(''), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-0.5">关注你的身体</h2>
          <p className="text-xl font-black text-slate-900">你好，{ streak > 0 ? `已坚持 ${streak} 天` : '开始打卡吧' }</p>
        </div>
        <div className="bg-white shadow-sm border border-slate-100 px-3 py-1.5 rounded-full flex items-center space-x-1.5">
          <span className="text-sm">🔥</span>
          <span className="text-xs font-black text-slate-600 tracking-tight">{streak}</span>
        </div>
      </div>

      <div className={`rounded-[2.5rem] p-8 shadow-2xl shadow-emerald-200/50 relative overflow-hidden transition-all duration-500 bg-emerald-500`}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-baseline space-x-1.5">
            <span className="text-7xl font-black text-white leading-none tabular-nums tracking-tighter">{totalTodayDuration}</span>
            <span className="text-sm font-black text-white/50 uppercase tracking-widest italic">min</span>
          </div>
          <div className="text-[10px] font-black text-white/70 uppercase tracking-[0.3em] mt-3">今日进度</div>
          
          <div className="w-full mt-10 space-y-4">
            <div className="flex justify-between text-[10px] font-black text-white/90 tracking-wider">
              <span className="uppercase">完成度 {completionPercent}%</span>
              <span className="font-extrabold italic tracking-tighter">目标 {state.goals.dailyMinutes}min</span>
            </div>
            <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-1000 ease-out shadow-sm"
                style={{ width: `${progressWidth}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => openModal()}
        className="fixed bottom-28 right-6 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl z-40 active:scale-90 transition-transform"
      >
        <span className="mb-0.5">+</span>
      </button>

      <div>
        <div className="flex justify-between items-end mb-4 px-1">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">最近活动</h3>
          <button onClick={() => navigate('/history')} className="text-[10px] font-black text-emerald-600">查看历史轨迹</button>
        </div>
        <div className="space-y-3">
          {state.activities.slice(0, 3).map((record) => (
            <div 
              key={record.id} 
              className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center justify-between active:bg-slate-50 transition-colors"
              onClick={() => openModal(record)}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                  {state.categories.find(c => c.name === record.type)?.emoji || '🔥'}
                </div>
                <div>
                  <div className="text-sm font-black text-slate-800 leading-tight">{record.type}</div>
                  <div className="text-[9px] font-bold text-slate-300 mt-1 uppercase tracking-tighter">{record.date}</div>
                </div>
              </div>
              <div className="text-sm font-black text-emerald-500 tabular-nums">{record.duration}min</div>
            </div>
          ))}
          {state.activities.length === 0 && (
            <div className="py-12 text-center text-[10px] font-bold text-slate-300 italic">暂无记录，动起来吧！</div>
          )}
        </div>
      </div>

      {showModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-t-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500 pb-10 px-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mt-4 mb-8"></div>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900">{editingRecord ? '调整记录' : '新记录'}</h3>
              <div className="flex space-x-2">
                {editingRecord && (
                  <button 
                    type="button"
                    onClick={handleDelete}
                    className="text-xs font-black text-rose-500 px-4 py-1.5 bg-rose-50 rounded-full active:scale-95 transition-transform"
                  >
                    删除
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => setShowModal(false)} 
                  className="text-xs font-black text-slate-400 px-4 py-1.5 bg-slate-50 rounded-full active:scale-95 transition-transform"
                >
                  取消
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-center animate-in zoom-in-95">
                  ⚠️ {errorMsg}
                </div>
              )}
              <div className="bg-slate-50 rounded-[2rem] divide-y divide-slate-100 border border-slate-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">日期</label>
                  {editingRecord ? (
                    <span className="font-bold text-sm text-slate-400 py-1">{formData.date}</span>
                  ) : (
                    <input type="date" value={formData.date} max={todayStr} onChange={e => setFormData({...formData, date: e.target.value})} className="bg-transparent outline-none font-bold text-sm text-right text-slate-900" />
                  )}
                </div>
                <div className="flex items-center justify-between px-6 py-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">项目</label>
                  <select value={isAddingNewType ? 'NEW' : formData.type} onChange={e => e.target.value === 'NEW' ? setIsAddingNewType(true) : (setIsAddingNewType(false), setFormData({...formData, type: e.target.value}))} className="bg-transparent outline-none font-bold text-sm text-right text-emerald-600">
                    {sortedCategories.map(c => <option key={c.id} value={c.name}>{c.emoji} {c.name}</option>)}
                    {!editingRecord && <option value="NEW">＋ 自定义...</option>}
                  </select>
                </div>
              </div>
              {isAddingNewType && (
                <div className="space-y-2">
                  <input type="text" placeholder="emoji+文字 (如: 🧘 瑜伽)" autoFocus value={newTypeName} onChange={e => setNewTypeName(e.target.value)} className="w-full bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl px-6 py-4 outline-none font-bold text-sm" />
                </div>
              )}
              
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100/50 space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">时长调整</span>
                    <span className="text-2xl font-black text-emerald-500 tabular-nums">{formData.duration} min</span>
                </div>
                <input 
                    type="range" min="5" max="180" step="5"
                    value={formData.duration}
                    onInput={(e) => {
                      const val = parseInt((e.target as HTMLInputElement).value);
                      setFormData(prev => ({...prev, duration: val}));
                    }}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500 outline-none"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${((formData.duration - 5) / (180 - 5)) * 100}%, #e2e8f0 ${((formData.duration - 5) / (180 - 5)) * 100}%, #e2e8f0 100%)`
                    }}
                />
              </div>

              <button type="submit" className="w-full bg-emerald-500 text-white font-black py-5 rounded-[1.5rem] shadow-xl active:scale-95 transition-transform text-md">
                {editingRecord ? '保存修改' : '确认打卡'}
              </button>
            </form>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-10 duration-500">
          <div className="bg-slate-900 text-white px-8 py-3 rounded-full font-black text-xs shadow-2xl flex items-center space-x-2">
            <span>{successMsg}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
