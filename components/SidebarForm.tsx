import React from 'react';
import { PlusCircle, Edit, Cloud, RefreshCw, Save, Briefcase, Map, X } from 'lucide-react';
import { GenericFormData, EntryType } from '../types';

interface SidebarFormProps {
  formData: GenericFormData;
  isEditing: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
  user: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTypeChange: (type: EntryType) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
  formatCurrency: (val: number) => string;
  isOpen: boolean; // New prop for mobile visibility
  onClose: () => void; // New prop to close on mobile
}

const SidebarForm: React.FC<SidebarFormProps> = ({
  formData,
  isEditing,
  syncStatus,
  user,
  onInputChange,
  onTypeChange,
  onSubmit,
  onCancelEdit,
  formatCurrency,
  isOpen,
  onClose
}) => {
  const profit = formData.revenue - formData.expense;
  const isProfitable = profit >= 0;

  // Responsive classes:
  // Mobile: fixed, starts off-screen (-translate-x-full), slides in (translate-x-0) based on isOpen
  // Desktop (lg): always translate-x-0, fixed position implied but handled by parent layout usually, 
  // here we keep fixed logic but ensure z-index handles overlap on mobile.
  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50
    w-80 bg-white shadow-2xl flex flex-col border-r border-slate-200
    transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    lg:translate-x-0 lg:shadow-xl
  `;

  return (
    <aside className={sidebarClasses}>
      <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-3 tracking-tight">
            <Cloud className="w-6 h-6 text-blue-400" />
            南通广电国旅
          </h1>
          <div className="flex items-center gap-3 mt-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700 backdrop-blur-sm">
            <div className={`h-2.5 w-2.5 rounded-full ${user ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-amber-400 animate-pulse'}`}></div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Cloud System</span>
              <span className="text-xs text-white font-mono tracking-wide">Blackyoz / Admin</span>
            </div>
          </div>
        </div>
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-slate-800">
          {isEditing ? <Edit className="w-5 h-5 text-blue-600" /> : <PlusCircle className="w-5 h-5 text-emerald-600" />}
          {isEditing ? '编辑信息' : '数据录入'}
        </h2>

        {/* Type Toggles - Only show if not editing, or allow switching if new */}
        {!isEditing && (
          <div className="flex p-1 bg-slate-100 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => onTypeChange('travel')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${
                formData.type === 'travel' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Map className="w-3 h-3" />
              旅行团
            </button>
            <button
              type="button"
              onClick={() => onTypeChange('business')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${
                formData.type === 'business' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Briefcase className="w-3 h-3" />
              业务项目
            </button>
          </div>
        )}

        {isEditing && (
          <div className="mb-6 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-500 uppercase tracking-wide">
            正在编辑: {formData.type === 'travel' ? '旅行团信息' : '业务项目'}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          
          {/* --- Fields for Travel Group --- */}
          {formData.type === 'travel' && (
            <>
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
            </>
          )}

          {/* --- Fields for Business Project --- */}
          {formData.type === 'business' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">项目名称</label>
              <input 
                required 
                type="text" 
                name="projectName" 
                value={formData.projectName} 
                onChange={onInputChange} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm" 
                placeholder="例如: 某某公司会议服务" 
              />
            </div>
          )}

          {/* --- Common Fields --- */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {formData.type === 'travel' ? '发团日期' : '项目日期'}
            </label>
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
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {formData.type === 'travel' ? '责任人' : '负责人'}
            </label>
            <input 
              type="text" 
              name="personInCharge" 
              value={formData.personInCharge} 
              onChange={onInputChange} 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm" 
              placeholder="例如: 张三" 
            />
          </div>

          {/* Status only for Travel Groups */}
          {formData.type === 'travel' && (
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
          )}

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            {/* Recruit Count only for Travel */}
            {formData.type === 'travel' && (
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
            )}

            <div className={`${formData.type === 'business' ? 'col-span-2' : ''} space-y-1`}>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {formData.type === 'travel' ? '总收入' : '项目收款'}
              </label>
              <input 
                type="number" 
                name="revenue" 
                value={formData.revenue} 
                onChange={onInputChange} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm bg-emerald-50/50 text-emerald-700 font-medium" 
              />
            </div>
            <div className={`${formData.type === 'business' ? 'col-span-2' : ''} space-y-1`}>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {formData.type === 'travel' ? '总支出' : '项目支出'}
              </label>
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
              <span className="text-slate-500 font-medium">
                {formData.type === 'travel' ? '预计毛利润' : '项目利润'}
              </span>
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
      <div className="p-4 border-t border-slate-200 text-center bg-white">
         <p className="text-xs text-slate-400">© 南通广电国旅 Cloud System</p>
      </div>
    </aside>
  );
};

export default SidebarForm;