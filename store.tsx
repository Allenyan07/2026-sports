
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, ActivityRecord, UserGoals, SportCategory } from './types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env as any).SUPABASE_URL || '';
const supabaseKey = (process.env as any).SUPABASE_ANON_KEY || '';
const supabase: SupabaseClient | null = supabaseUrl ? createClient(supabaseUrl, supabaseKey) : null;

interface AppContextType {
  state: AppState;
  isSyncing: boolean;
  addActivity: (activity: Omit<ActivityRecord, 'id' | 'recordedAt'>) => void;
  updateActivity: (record: ActivityRecord) => void;
  deleteActivity: (id: string) => void;
  updateGoals: (goals: UserGoals) => void;
  addCategory: (input: string) => void;
  deleteCategory: (id: string) => void;
  importAllData: (data: AppState) => void;
}

const STORAGE_KEY = 'fittrack_pro_data_v2';

const defaultCategories: SportCategory[] = [
  { id: '1', name: '跑步', emoji: '🏃', isCustom: false },
  { id: '2', name: '羽毛球', emoji: '🏸', isCustom: false },
  { id: '3', name: '跳绳', emoji: '➰', isCustom: false },
  { id: '4', name: '游泳', emoji: '🏊', isCustom: false },
  { id: '5', name: '骑行', emoji: '🚴', isCustom: false },
  { id: '6', name: '乒乓球', emoji: '🏓', isCustom: false },
];

const defaultGoals: UserGoals = {
  annualDays: 120,
  monthlyDays: 15,
  dailyMinutes: 30
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return { 
      activities: [], 
      goals: defaultGoals,
      categories: defaultCategories
    };
  });

  useEffect(() => {
    const initData = async () => {
      if (!supabase) return;
      setIsSyncing(true);
      try {
        const [acts, cats, gls] = await Promise.all([
          supabase.from('activities').select('*').order('recordedAt', { ascending: false }),
          supabase.from('categories').select('*'),
          supabase.from('goals').select('*').eq('id', 'current').single()
        ]);

        const cloudState: Partial<AppState> = {};
        if (acts.data) cloudState.activities = acts.data;
        if (cats.data && cats.data.length > 0) cloudState.categories = cats.data;
        if (gls.data) {
          const { id, ...goalData } = gls.data;
          cloudState.goals = goalData;
        }

        if (Object.keys(cloudState).length > 0) {
          setState(prev => ({ ...prev, ...cloudState }));
        }
      } catch (err) {
        console.error('Failed to sync with cloud:', err);
      } finally {
        setIsSyncing(false);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addActivity = (activity: Omit<ActivityRecord, 'id' | 'recordedAt'>) => {
    const newRecord: ActivityRecord = {
      ...activity,
      id: Math.random().toString(36).substr(2, 9),
      recordedAt: new Date().toISOString()
    };
    
    setState(prev => ({
      ...prev,
      activities: [newRecord, ...prev.activities]
    }));

    if (supabase) {
      supabase.from('activities').insert(newRecord).then(({ error }) => {
        if (error) console.error('Cloud Sync Error (Add):', error);
      });
    }
  };

  const updateActivity = (updatedRecord: ActivityRecord) => {
    setState(prev => ({
      ...prev,
      activities: prev.activities.map(a => a.id === updatedRecord.id ? updatedRecord : a)
    }));

    if (supabase) {
      supabase.from('activities').update(updatedRecord).eq('id', updatedRecord.id).then(({ error }) => {
        if (error) console.error('Cloud Sync Error (Update):', error);
      });
    }
  };

  const deleteActivity = (id: string) => {
    console.log('Attempting to delete activity:', id);
    setState(prev => ({
      ...prev,
      activities: prev.activities.filter(a => a.id !== id)
    }));

    if (supabase) {
      supabase.from('activities').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Cloud Sync Error (Delete):', error);
      });
    }
  };

  const updateGoals = (goals: UserGoals) => {
    setState(prev => ({ ...prev, goals }));

    if (supabase) {
      supabase.from('goals').upsert({ id: 'current', ...goals }).then(({ error }) => {
        if (error) console.error('Cloud Sync Error (Goal):', error);
      });
    }
  };

  const addCategory = (input: string) => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u;
    const match = trimmedInput.match(emojiRegex);
    
    let emoji = '🔥';
    let name = trimmedInput;

    if (match) {
      emoji = match[0];
      name = trimmedInput.replace(emoji, '').trim();
      if (!name) name = emoji;
    }

    if (state.categories.some(c => c.name === name)) return;

    const newCat: SportCategory = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      emoji,
      isCustom: true
    };
    
    setState(prev => ({
      ...prev,
      categories: [...prev.categories, newCat]
    }));

    if (supabase) {
      supabase.from('categories').insert(newCat).then(({ error }) => {
        if (error) console.error('Cloud Sync Error (Category Add):', error);
      });
    }
  };

  const deleteCategory = (id: string) => {
    console.log('Attempting to delete category:', id);
    setState(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id)
    }));

    if (supabase) {
      supabase.from('categories').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Cloud Sync Error (Category Delete):', error);
      });
    }
  };

  const importAllData = (data: AppState) => {
    setState(data);
  };

  return (
    <AppContext.Provider value={{ state, isSyncing, addActivity, updateActivity, deleteActivity, updateGoals, addCategory, deleteCategory, importAllData }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
