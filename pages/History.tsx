
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { ActivityRecord } from '../types';

const History: React.FC = () => {
  const { state, updateActivity, deleteActivity } = useApp();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ActivityRecord | null>(null);
  
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isHorizontalSwipe = useRef<boolean>(false);

  const heatmapData = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayActivities = state.activities.filter(a => a.date === dateStr);
      const totalDuration = dayActivities.reduce((sum, a) => sum + a.duration, 0);
      let status: 'none' | 'partial' | 'full' = 'none';
      if (totalDuration > 0) {
        status = totalDuration >= state.goals.dailyMinutes ? 'full' : 'partial';
      }
      days.push({ day: i, dateStr, status, duration: totalDuration });
    }
    return days;
  }, [state.activities, selectedDate, state.goals.dailyMinutes]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedDate(newDate);
  };

  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const dayRecords = useMemo(() => 
    state.activities.filter(a => a.date === selectedDateStr),
  [state.activities, selectedDateStr]);

  const openEdit = (record: ActivityRecord) => {
    if (swipedId === record.id) {
      setSwipedId(null);
      return;
    }
    setEditingRecord({...record});
    setShowModal(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
    isHorizontalSwipe.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent, id: string) => {
    if (!touchStartRef.current) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = touchStartRef.current.x - currentX;
    const deltaY = Math.abs(touchStartRef.current.y - currentY);

    if (!isHorizontalSwipe.current && Math.abs(deltaX) > 10 && Math.abs(deltaX) > deltaY) {
      isHorizontalSwipe.current = true;
    }

    if (isHorizontalSwipe.current) {
      if (deltaX > 50) {
        setSwipedId(id);
      } else if (deltaX < -50) {
        setSwipedId(null);
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    isHorizontalSwipe.current = false;
  };

  const handleDeleteFromModal = () => {
    if (editingRecord) {
      deleteActivity(editingRecord.id);
      setShowModal(false);
      setEditingRecord(null);
    }
  };

  const fastDelete = (id: string) => {
    deleteActivity(id);
    setSwipedId(null);
  };

  useEffect(() => {
    const reset = () => setSwipedId(null);
    window.addEventListener('scroll', reset);
    return () => window.removeEventListener('scroll', reset);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 swipe-container">
      <header className="flex items-center space-x-4 px-1">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-slate-400 active:scale-90">
          ◀
        </button>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">历史轨迹</h1>
      </header>

      <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-md font-black text-slate-800">
            {selectedDate.getFullYear()}年{selectedDate.getMonth() + 1}月
          </h3>
          <div className="flex items-center space-x-2">
            <button onClick={() => changeMonth(-1)} className="text-slate-400 bg-slate-50 p-2 rounded-xl active:scale-90 transition-transform">◀</button>
            <button onClick={() => changeMonth(1)} className="text-slate-400 bg-slate-50 p-2 rounded-xl active:scale-90 transition-transform">▶</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2.5">
          {heatmapData.map((d) => (
            <button 
              key={d.day}
              onClick={() => setSelectedDate(new Date(d.dateStr))}
              className={`aspect-square rounded-xl flex items-center justify-center transition-all relative border-2 ${
                selectedDateStr === d.dateStr ? 'border-emerald-500 scale-105 z-10' : 'border-transparent'
              } ${
                d.status === 'full' ? 'bg-emerald-500 text-white shadow-md' :
                d.status === 'partial' ? 'bg-emerald-100 text-emerald-800' :
                'bg-slate-50 text-slate-400 font-bold'
              }`}
            >
              <span className="text-[10px] font-black">{d.day}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex justify-between">
          <span>{selectedDateStr} 明细</span>
          <span className="font-bold tracking-tighter text-slate-300 italic">点击可修改或删除</span>
        </h3>
        <div className="space-y-3 px-1">
          {dayRecords.map((record) => (
            <div 
              key={record.id} 
              className="relative overflow-hidden rounded-[2rem] shadow-sm bg-white swipe-item"
              onTouchStart={handleTouchStart}
              onTouchMove={(e) => handleTouchMove(e, record.id)}
              onTouchEnd={handleTouchEnd}
            >
              <button 
                type="button"
                className={`absolute inset-y-0 right-0 w-24 bg-rose-600 flex flex-col items-center justify-center text-white transition-all duration-300 ${swipedId === record.id ? 'opacity-100 z-20' : 'opacity-0 z-0'}`}
                style={{ pointerEvents: swipedId === record.id ? 'auto' : 'none' }}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation(); 
                  fastDelete(record.id);
                }}
              >
                <span className="text-xl">🗑️</span>
                <span className="text-[10px] font-black uppercase mt-1">删除</span>
              </button>
              
              <div 
                className="p-5 relative z-10 flex items-center justify-between transition-transform duration-300 ease-out bg-white active:bg-slate-50"
                style={{ transform: swipedId === record.id ? 'translateX(-96px)' : 'translateX(0)' }}
                onClick={() => openEdit(record)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                    {state.categories.find(c => c.name === record.type)?.emoji || '🔥'}
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-800 leading-tight">{record.type}</div>
                    <div className="text-[9px] font-bold text-slate-300 mt-1 uppercase tracking-tighter">
                      {new Date(record.recordedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-black text-emerald-500 tabular-nums">
                  {record.duration}min
                </div>
              </div>
            </div>
          ))}
          {dayRecords.length === 0 && (
            <div className="py-12 text-center text-[10px] font-bold text-slate-300 italic">该日无运动记录</div>
          )}
        </div>
      </div>

      {showModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-t-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 p-8 pb-12"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mt-4 mb-8"></div>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900">调整记录</h3>
              <div className="flex space-x-2">
                {editingRecord && (
                  <button 
                    onClick={handleDeleteFromModal}
                    className="text-xs font-black text-rose-500 px-4 py-1.5 bg-rose-50 rounded-full active:scale-95 transition-transform"
                  >
                    删除
                  </button>
                )}
                <button 
                  onClick={() => setShowModal(false)} 
                  className="text-xs font-black text-slate-400 px-4 py-1.5 bg-slate-50 rounded-full active:scale-95 transition-transform"
                >
                  取消
                </button>
              </div>
            </div>

            <form onSubmit={(e) => { 
              e.preventDefault(); 
              if(editingRecord) updateActivity(editingRecord); 
              setShowModal(false); 
            }} className="space-y-6">
              <div className="bg-slate-50 rounded-[2rem] divide-y divide-slate-100 border border-slate-100 overflow-hidden mb-4">
                <div className="flex items-center justify-between px-6 py-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">日期</label>
                  <span className="font-bold text-sm text-slate-400 py-1">{editingRecord?.date}</span>
                </div>
                <div className="flex items-center justify-between px-6 py-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">项目</label>
                  <select 
                    value={editingRecord?.type} 
                    onChange={e => setEditingRecord(prev => prev ? {...prev, type: e.target.value} : null)}
                    className="bg-transparent outline-none font-bold text-sm text-right text-emerald-600"
                  >
                    {state.categories.map(c => <option key={c.id} value={c.name}>{c.emoji} {c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100/50 space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">持续时长</span>
                    <span className="text-2xl font-black text-emerald-500 tabular-nums">{editingRecord?.duration} min</span>
                </div>
                <input 
                    type="range" min="5" max="180" step="5"
                    value={editingRecord?.duration || 0}
                    onInput={(e) => {
                      const val = parseInt((e.target as HTMLInputElement).value);
                      setEditingRecord(prev => prev ? {...prev, duration: val} : null);
                    }}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500 outline-none"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${(((editingRecord?.duration || 0) - 5) / (180 - 5)) * 100}%, #e2e8f0 ${(((editingRecord?.duration || 0) - 5) / (180 - 5)) * 100}%, #e2e8f0 100%)`
                    }}
                />
              </div>
              <button type="submit" className="w-full bg-emerald-500 text-white font-black py-5 rounded-[1.5rem] shadow-xl active:scale-95 transition-transform">
                保存修改
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
