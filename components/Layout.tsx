
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '今日', icon: '🏃' },
    { path: '/stats', label: '趋势', icon: '📊' },
    { path: '/settings', label: '目标', icon: '🎯' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部标题栏 */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-slate-100/50 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">FitTrack <span className="text-emerald-500">Pro</span></h1>
        <div className="flex items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            个人版
          </span>
        </div>
      </header>

      {/* 内容区域 */}
      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full mb-28">
        {children}
      </main>

      {/* 移动端底部导航 */}
      <nav className="fixed bottom-6 left-4 right-4 bg-slate-900/90 backdrop-blur-xl flex justify-around items-center py-2 z-50 rounded-[2.5rem] safe-bottom shadow-2xl">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-2 py-2 px-6 rounded-full transition-all duration-300 ${
                isActive ? 'bg-emerald-500' : 'text-slate-400'
              }`}
            >
              <span className={`text-xl ${isActive ? 'grayscale-0 scale-110' : 'grayscale opacity-60 scale-100'}`}>
                {item.icon}
              </span>
              {isActive && (
                <span className="text-xs font-black text-white">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
