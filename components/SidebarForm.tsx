import React from 'react';
import { PlusCircle, Edit, Cloud, RefreshCw, Save } from 'lucide-react';
import { TravelGroupFormData } from '../types';

interface SidebarFormProps {
  formData: TravelGroupFormData;
  isEditing: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
  user: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
  formatCurrency: (val: number) => string;
}

const SidebarForm: React.FC<SidebarFormProps> = ({
  formData,
  isEditing,
  syncStatus,
  user,
  onInputChange,
  onSubmit,
  onCancelEdit,
  formatCurrency
}) => {
  const profit = formData.revenue - formData.expense;
  const isProfitable = profit >= 0;

  return (
    <aside className="w-80 bg-white shadow-xl flex flex-col z-20 border-r border-slate-200 h-full fixed left-0 top-0 overflow-y-auto">
      <div className="p-6 bg-slate-900 text-white">
        <h1 className="text-xl font-bold flex items-center gap-3 tracking-tight">
          <Cloud className="w-6 h-6 text-blue-400" />
          Blackyoz Cloud
        </h1>
        <div className="flex items-center gap-3 mt-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700 backdrop-blur-sm">
          <div className={`h-2.5 w-2.5 rounded-full ${user ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-amber-400 animate-pulse'}`}></div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Project ID</span>
            <span className="text-xs text-white font-mono tracking-wide">blackyoz</span>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1">
        <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-slate-800">
          {isEditing ? <Edit className="w-5 h-5 text-blue-600" /> : <PlusCircle className="w-5 h-5 text-emerald-600" />}
          {isEditing ? '编辑团信息' : '录入新团'}
        </h2>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">团号</label>
            <input 
              required 
              type="text" 
              name="groupNo" 
              value={formData.groupNo} 
              onChange={onInputChange} 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm" 
              placeholder="TG-2023001" 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">发团日期</label>
            <input 
              required 
              type="date" 
              name="date" 
              value={formData.date} 
              onChange={onInputChange} 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">目的地</label>
            <input 
              required 
              type="text" 
              name="destination" 
              value={formData.destination} 
              onChange={onInputChange} 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm" 
              placeholder="例如: 日本大阪" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">状态</label>
            <select 
              name="status" 
              value={formData.status} 
              onChange={onInputChange} 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm bg-white"
            >
              <option value="等待">等待中</option>
              <option value="成团">已成团</option>
              <option value="取消">已取消</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">招募人数</label>
              <input 
                type="number" 
                name="recruitCount" 
                value={formData.recruitCount} 
                onChange={onInputChange} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">总收入</label>
              <input 
                type="number" 
                name="revenue" 
                value={formData.revenue} 
                onChange={onInputChange} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm bg-emerald-50/50 text-emerald-700 font-medium" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">总支出</label>
              <input 
                type="number" 
                name="expense" 
                value={formData.expense} 
                onChange={onInputChange} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-sm bg-rose-50/50 text-rose-700 font-medium" 
              />
            </div>
          </div>

          <div className={`p-4 rounded-lg text-sm border ${isProfitable ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'} transition-colors duration-300`}>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">预计毛利润</span>
              <span className={`font-bold text-lg ${isProfitable ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(profit)}
              </span>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="submit" 
              disabled={syncStatus === 'syncing' || !user} 
              className="flex-1 bg-slate-900 hover:bg-black disabled:bg-slate-400 text-white py-2.5 px-4 rounded-lg transition-all flex justify-center items-center gap-2 shadow-lg shadow-slate-300 disabled:shadow-none font-medium text-sm"
            >
              {syncStatus === 'syncing' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEditing ? '更新云端' : '保存记录'}
            </button>
            
            {isEditing && (
              <button 
                type="button" 
                onClick={onCancelEdit} 
                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors"
              >
                取消
              </button>
            )}
          </div>
        </form>
      </div>
      
      {/* Bottom Footer */}
      <div className="p-4 border-t border-slate-200 text-center">
         <p className="text-xs text-slate-400">Connected to Google Firebase</p>
      </div>
    </aside>
  );
};

export default SidebarForm;