
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store';

const Settings: React.FC = () => {
  const { state, updateGoals, importAllData } = useApp();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  
  // 使用字符串存储临时状态，以便支持输入框完全删除内容
  const [tempGoals, setTempGoals] = useState({
    annualDays: state.goals.annualDays.toString(),
    monthlyDays: state.goals.monthlyDays.toString(),
    dailyMinutes: state.goals.dailyMinutes.toString()
  });
  const [saveStatus, setSaveStatus] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    
    // 校验必填逻辑
    const fields = ['annualDays', 'monthlyDays', 'dailyMinutes'] as const;
    fields.forEach(field => {
      const val = parseInt(tempGoals[field]);
      if (!tempGoals[field] || isNaN(val) || val <= 0) {
        newErrors[field] = true;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    updateGoals({
      annualDays: parseInt(tempGoals.annualDays),
      monthlyDays: parseInt(tempGoals.monthlyDays),
      dailyMinutes: parseInt(tempGoals.dailyMinutes)
    });
    
    setShowEditModal(false);
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2000);
  };

  const openEditModal = () => {
    setTempGoals({
      annualDays: state.goals.annualDays.toString(),
      monthlyDays: state.goals.monthlyDays.toString(),
      dailyMinutes: state.goals.dailyMinutes.toString()
    });
    setErrors({});
    setShowEditModal(true);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `FitTrack_Backup_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.activities && json.goals && json.categories) {
          if (window.confirm('确定要恢复此档案吗？当前所有记录将被覆盖。')) {
            importAllData(json);
            alert('恢复成功！');
          }
        } else {
          alert('无效的档案文件格式。');
        }
      } catch (err) {
        alert('读取档案失败，请确保文件是有效的 JSON 备份。');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700 pb-16">
      <header className="flex justify-between items-end px-1 mb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-none">目标设定</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Personal Goals</p>
        </div>
        <button 
          onClick={openEditModal}
          className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-lg active:scale-95 transition-all"
        >
          修改
        </button>
      </header>

      <div className="space-y-3">
        {/* 紧凑型年度目标 */}
        <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl">🏆</div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">年度打卡</div>
              <div className="text-xl font-black text-slate-900">{state.goals.annualDays} <span className="text-xs text-slate-300 italic">DAYS</span></div>
            </div>
          </div>
        </div>

        {/* 紧凑型双栏目标 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-2">
            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-lg">📅</div>
            <div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">月度勤奋</div>
              <div className="text-lg font-black text-slate-900">{state.goals.monthlyDays} <span className="text-[10px] text-slate-300 italic">DAYS</span></div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-2">
            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-lg">⏱️</div>
            <div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">日均时长</div>
              <div className="text-lg font-black text-slate-900">{state.goals.dailyMinutes} <span className="text-[10px] text-slate-300 italic">min</span></div>
            </div>
          </div>
        </div>
      </div>

      <section onClick={() => navigate('/settings/categories')} className="bg-white rounded-[1.5rem] px-5 py-4 border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer active:bg-slate-50 transition-colors">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl">🧩</div>
          <div>
            <h3 className="text-sm font-black text-slate-900 leading-none">项目管理</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Manage Categories</p>
          </div>
        </div>
        <div className="text-slate-300">▶</div>
      </section>

      {/* 备份与恢复 */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={handleExport}
          className="bg-white border border-slate-100 py-4 rounded-[1.5rem] shadow-sm flex flex-col items-center justify-center space-y-1 active:scale-95 transition-transform"
        >
          <span className="text-lg">📤</span>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">导出档案</span>
        </button>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="bg-white border border-slate-100 py-4 rounded-[1.5rem] shadow-sm flex flex-col items-center justify-center space-y-1 active:scale-95 transition-transform"
        >
          <span className="text-lg">📥</span>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">恢复档案</span>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            accept=".json" 
            className="hidden" 
          />
        </button>
      </div>

      {showEditModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowEditModal(false)}
        >
          <div 
            className="bg-white rounded-t-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 p-8 pb-12"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8"></div>
            <h3 className="text-2xl font-black text-slate-900 mb-8">调整目标</h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-5">
                <EditInput 
                  label="年度天数目标" 
                  value={tempGoals.annualDays} 
                  error={errors.annualDays}
                  onChange={(v: string) => {
                    setTempGoals({...tempGoals, annualDays: v});
                    if (v && parseInt(v) > 0) setErrors(prev => ({...prev, annualDays: false}));
                  }} 
                />
                <div className="grid grid-cols-2 gap-4">
                  <EditInput 
                    label="每月天数" 
                    value={tempGoals.monthlyDays} 
                    error={errors.monthlyDays}
                    onChange={(v: string) => {
                      setTempGoals({...tempGoals, monthlyDays: v});
                      if (v && parseInt(v) > 0) setErrors(prev => ({...prev, monthlyDays: false}));
                    }} 
                  />
                  <EditInput 
                    label="每日时长(分)" 
                    value={tempGoals.dailyMinutes} 
                    error={errors.dailyMinutes}
                    onChange={(v: string) => {
                      setTempGoals({...tempGoals, dailyMinutes: v});
                      if (v && parseInt(v) > 0) setErrors(prev => ({...prev, dailyMinutes: false}));
                    }} 
                  />
                </div>
              </div>
              
              {Object.keys(errors).some(k => errors[k]) && (
                <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center animate-in fade-in">
                  请填写所有目标数值且需大于 0
                </div>
              )}

              <button type="submit" className="w-full bg-emerald-500 text-white font-black py-5 rounded-[1.5rem] shadow-xl active:scale-95 transition-transform">确认修改</button>
            </form>
          </div>
        </div>
      )}

      {saveStatus && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-10 duration-500">
          <div className="bg-slate-900 text-white px-8 py-3 rounded-full font-black text-xs shadow-2xl">
            目标已更新 ✨
          </div>
        </div>
      )}
    </div>
  );
};

const EditInput = ({ label, value, error, onChange }: { label: string, value: string, error?: boolean, onChange: (v: string) => void }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
    <input 
      type="text" 
      inputMode="numeric"
      pattern="[0-9]*"
      placeholder="请输入数值"
      value={value === '0' ? '' : value} 
      onChange={e => {
        const val = e.target.value;
        if (val === '' || /^\d+$/.test(val)) {
          onChange(val);
        }
      }} 
      className={`w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 outline-none font-black text-2xl placeholder:text-slate-200 transition-colors ${
        error ? 'border-rose-300 bg-rose-50/30' : 'border-transparent focus:border-emerald-500'
      }`} 
    />
  </div>
);

export default Settings;
