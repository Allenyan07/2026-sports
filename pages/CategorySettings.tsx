
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store';

const CategorySettings: React.FC = () => {
  const { state, addCategory, deleteCategory } = useApp();
  const navigate = useNavigate();
  const [newCatName, setNewCatName] = useState('');

  const handleAddCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName.trim()) {
      addCategory(newCatName.trim());
      setNewCatName('');
    }
  };

  const onHandleDelete = (id: string) => {
    deleteCategory(id);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-12 relative">
      <header className="flex items-center space-x-4">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-slate-400 active:scale-90 transition-transform"
        >
          ◀
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900">项目管理</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">设置运动分类</p>
        </div>
      </header>

      {/* 添加新项目 */}
      <section className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-50">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-1">新增自定义运动</h3>
        <form onSubmit={handleAddCat} className="flex gap-2">
          <input 
            type="text" 
            placeholder="如: 🧘 瑜伽" 
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            className="flex-1 bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:bg-white rounded-xl px-4 py-3 outline-none font-bold transition-all text-sm"
          />
          <button 
            type="submit"
            disabled={!newCatName.trim()}
            className="bg-emerald-500 text-white px-6 rounded-xl font-black text-sm shadow-md active:scale-95 disabled:opacity-30 transition-all"
          >
            添加
          </button>
        </form>
      </section>

      {/* 项目列表 */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            项目列表 ({state.categories.length})
          </h3>
          <span className="text-[10px] text-slate-300 font-bold italic">点击 ✕ 即可移除项目</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {state.categories.map(cat => (
            <div 
              key={cat.id} 
              className={`flex items-center space-x-2 pl-4 pr-1 py-1 rounded-full border transition-all relative ${
                cat.isCustom 
                ? 'bg-emerald-50 border-emerald-100' 
                : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <span className="text-lg">{cat.emoji}</span>
              <span className="text-sm font-bold text-slate-700">{cat.name}</span>
              
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onHandleDelete(cat.id);
                }}
                className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-full transition-all active:scale-90"
                aria-label="删除项目"
              >
                <span className="text-xs font-black leading-none pointer-events-none">✕</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="bg-slate-900 p-6 rounded-[2rem] text-white/90 mt-8">
        <h4 className="font-black text-emerald-400 mb-2 flex items-center text-xs">
          <span className="mr-2">📝</span> 管理指南
        </h4>
        <div className="space-y-2">
          <p className="text-[10px] leading-relaxed font-bold">
            💡 智能识别：输入“🏃 跑步”，系统会自动提取 Emoji 作为项目图标。
          </p>
          <p className="text-white/40 text-[10px] leading-relaxed font-medium">
            所有项目均支持删除。内置项目（白底）和自定义项目（绿底）均点击 ✕ 即可移除。
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategorySettings;
