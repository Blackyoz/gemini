import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  DollarSign, 
  Users, 
  TrendingUp, 
  PieChart as PieIcon, 
  Trash2, 
  Edit, 
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Loader2,
  FileDown,
  Filter,
  Briefcase,
  Map,
  Building2
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  signInAnonymously, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import * as XLSX from 'xlsx';

import { auth, db } from './services/firebase';
import { TravelGroup, BusinessProject, GenericFormData, DataItem, EntryType } from './types';

import StatusBadge from './components/StatusBadge';
import StatCard from './components/StatCard';
import AnalyticsCharts from './components/AnalyticsCharts';
import SidebarForm from './components/SidebarForm';

type ViewMode = 'travel' | 'business' | 'total';

export default function App() {
  // -- State --
  const [user, setUser] = useState<User | null>(null);
  
  // Data Store
  const [travelGroups, setTravelGroups] = useState<TravelGroup[]>([]);
  const [businessProjects, setBusinessProjects] = useState<BusinessProject[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [authError, setAuthError] = useState<string | null>(null);
  
  // UI State
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('travel');

  const initialFormState: GenericFormData = {
    id: null,
    type: 'travel', // Default to travel
    groupNo: '',
    date: new Date().toISOString().split('T')[0],
    destination: '',
    personInCharge: '',
    status: '等待',
    recruitCount: 0,
    projectName: '',
    revenue: 0,
    expense: 0
  };
  
  const [formData, setFormData] = useState<GenericFormData>(initialFormState);

  // -- Authentication --
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error: any) {
        console.error("Auth failed:", error);
        setAuthError(error.message);
        setSyncStatus('error');
      }
    };
    initAuth();
    
    return onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setAuthError(null);
      }
    });
  }, []);

  // -- Data Sync --
  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // 1. Listen to Travel Groups
    const unsubTravel = onSnapshot(collection(db, 'travel_groups'), (snapshot) => {
      try {
        const loaded: TravelGroup[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'travel',
            groupNo: data.groupNo || '',
            date: data.date || '',
            destination: data.destination || '',
            personInCharge: data.personInCharge || '',
            status: data.status || '等待',
            recruitCount: Number(data.recruitCount) || 0,
            revenue: Number(data.revenue) || 0,
            expense: Number(data.expense) || 0,
            createdAt: data.createdAt,
            creatorId: data.creatorId
          };
        });
        setTravelGroups(loaded.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (e) { console.error("Travel data error", e); }
      setLoading(false);
    }, (err) => { console.error("Travel fetch failed", err); });

    // 2. Listen to Business Projects
    const unsubBusiness = onSnapshot(collection(db, 'business_projects'), (snapshot) => {
      try {
        const loaded: BusinessProject[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'business',
            projectName: data.projectName || '',
            date: data.date || '',
            personInCharge: data.personInCharge || '',
            revenue: Number(data.revenue) || 0,
            expense: Number(data.expense) || 0,
            createdAt: data.createdAt,
            creatorId: data.creatorId
          };
        });
        setBusinessProjects(loaded.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (e) { console.error("Business data error", e); }
      setLoading(false);
    }, (err) => { console.error("Business fetch failed", err); });

    return () => {
      unsubTravel();
      unsubBusiness();
    };
  }, [user]);

  // -- Logic --

  // 1. Combine Data based on View Mode for Table & Export
  const displayedData = useMemo(() => {
    let raw: DataItem[] = [];
    if (viewMode === 'travel') raw = travelGroups;
    else if (viewMode === 'business') raw = businessProjects;
    else raw = [...travelGroups, ...businessProjects];

    // Filter by Month
    if (selectedMonth === 'all') return raw.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return raw.filter(item => item.date.startsWith(selectedMonth)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [viewMode, travelGroups, businessProjects, selectedMonth]);

  // 2. Available Months (from ALL data)
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    [...travelGroups, ...businessProjects].forEach(g => {
      if (g.date && g.date.length >= 7) {
        months.add(g.date.substring(0, 7)); 
      }
    });
    return Array.from(months).sort().reverse(); 
  }, [travelGroups, businessProjects]);

  // 3. Stats Calculation
  const stats = useMemo(() => {
    const data = displayedData;
    const totalRevenue = data.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
    const totalExpense = data.reduce((acc, curr) => acc + (curr.expense || 0), 0);
    const totalProfit = totalRevenue - totalExpense;
    
    // Only count pax/groups for Travel items
    const travelItems = data.filter(d => d.type === 'travel') as TravelGroup[];
    const totalPax = travelItems.reduce((acc, curr) => acc + (curr.recruitCount || 0), 0);
    const activeGroups = travelItems.filter(g => g.status === '成团').length;
    
    // Count projects
    const projectCount = data.filter(d => d.type === 'business').length;

    return { totalRevenue, totalExpense, totalProfit, totalPax, activeGroups, projectCount };
  }, [displayedData]);

  // 4. Chart Data
  const chartData = useMemo(() => {
    // Group by Name (Destination for Travel, Project Name for Business)
    const map: Record<string, { name: string, revenue: number, profit: number }> = {};
    
    displayedData.forEach(item => {
      const name = item.type === 'travel' ? (item.destination || '未知') : (item.projectName || '未知项目');
      if (!map[name]) {
        map[name] = { name: name, revenue: 0, profit: 0 };
      }
      map[name].revenue += item.revenue;
      map[name].profit += (item.revenue - item.expense);
    });
    
    // Return top 20 by revenue to avoid clutter
    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);
  }, [displayedData]);

  // 5. Pie Data (Only relevant for Travel View usually, or Total view showing split)
  const pieData = useMemo(() => {
    if (viewMode === 'business') return []; // No status for business

    const statusMap: Record<string, number> = { '成团': 0, '等待': 0, '取消': 0 };
    // Only count travel groups for status
    const travelItems = displayedData.filter(d => d.type === 'travel') as TravelGroup[];
    
    travelItems.forEach(g => {
      const s = g.status || '等待';
      if (statusMap[s] !== undefined) statusMap[s]++;
      else {
        if (!statusMap['其他']) statusMap['其他'] = 0;
        statusMap['其他']++;
      }
    });
    return Object.keys(statusMap).map(key => ({ name: key, value: statusMap[key] }));
  }, [displayedData, viewMode]);

  // Determine Chart Title based on View Mode
  const chartTitle = useMemo(() => {
    if (viewMode === 'business') return '项目财务分析';
    if (viewMode === 'total') return '财务分析总览';
    return '各目的地财务分析';
  }, [viewMode]);

  // -- Handlers --
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['recruitCount', 'revenue', 'expense'].includes(name) ? Number(value) : value
    }));
  };

  const handleTypeChange = (newType: EntryType) => {
    setFormData(prev => ({
      ...initialFormState, // Reset fields
      type: newType,       // Set new type
      date: prev.date      // Keep date for convenience
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSyncStatus('syncing');
    try {
      const collectionName = formData.type === 'travel' ? 'travel_groups' : 'business_projects';
      
      // Construct payload based on type
      let dataToSave: any = {
        date: formData.date,
        personInCharge: formData.personInCharge || '',
        revenue: Number(formData.revenue) || 0,
        expense: Number(formData.expense) || 0,
        updatedAt: new Date().toISOString()
      };

      if (formData.type === 'travel') {
        dataToSave = {
          ...dataToSave,
          groupNo: formData.groupNo,
          destination: formData.destination,
          status: formData.status,
          recruitCount: Number(formData.recruitCount) || 0,
        };
      } else {
        dataToSave = {
          ...dataToSave,
          projectName: formData.projectName,
        };
      }

      if (isEditing && formData.id) {
        const docRef = doc(db, collectionName, formData.id);
        await updateDoc(docRef, dataToSave);
      } else {
        await addDoc(collection(db, collectionName), {
          ...dataToSave,
          createdAt: new Date().toISOString(),
          creatorId: user.uid
        });
      }
      setFormData({ ...initialFormState, type: formData.type }); // Reset but keep current type
      setIsEditing(false);
      setSyncStatus('idle');
    } catch (error: any) {
      console.error("Save failed:", error);
      alert(`Save failed: ${error.message}`);
      setSyncStatus('error');
    }
  };

  const handleDelete = async (item: DataItem) => {
    if (!window.confirm(`确定要删除 ${item.type === 'travel' ? '该团单' : '该项目'} 吗？`)) return;
    setSyncStatus('syncing');
    try {
      const collectionName = item.type === 'travel' ? 'travel_groups' : 'business_projects';
      await deleteDoc(doc(db, collectionName, item.id));
      
      if (isEditing && formData.id === item.id) {
        setFormData(initialFormState);
        setIsEditing(false);
      }
      setSyncStatus('idle');
    } catch (error) {
      console.error("Delete failed:", error);
      setSyncStatus('error');
    }
  };

  const handleEdit = (item: DataItem) => {
    if (item.type === 'travel') {
      const g = item as TravelGroup;
      setFormData({
        id: g.id,
        type: 'travel',
        groupNo: g.groupNo,
        date: g.date,
        destination: g.destination,
        personInCharge: g.personInCharge || '',
        status: g.status,
        recruitCount: g.recruitCount,
        projectName: '',
        revenue: g.revenue,
        expense: g.expense
      });
    } else {
      const b = item as BusinessProject;
      setFormData({
        id: b.id,
        type: 'business',
        groupNo: '',
        date: b.date,
        destination: '',
        personInCharge: b.personInCharge || '',
        status: '等待',
        recruitCount: 0,
        projectName: b.projectName,
        revenue: b.revenue,
        expense: b.expense
      });
    }
    setIsEditing(true);
  };

  const handleExportExcel = () => {
    if (displayedData.length === 0) {
      alert("暂无数据可导出");
      return;
    }

    const exportFormatted = displayedData.map(item => {
      const profit = item.revenue - item.expense;
      const margin = item.revenue > 0 ? (profit / item.revenue * 100).toFixed(2) + '%' : '0%';
      
      const base = {
        '日期': item.date,
        '类型': item.type === 'travel' ? '旅行团' : '业务项目',
        '名称/目的地': item.type === 'travel' ? (item as TravelGroup).destination : (item as BusinessProject).projectName,
        '负责人': item.personInCharge || '',
        '收入': item.revenue,
        '支出': item.expense,
        '利润': profit,
        '利润率': margin,
      };

      if (item.type === 'travel') {
        const g = item as TravelGroup;
        return {
          ...base,
          '团号': g.groupNo,
          '状态': g.status,
          '招募人数': g.recruitCount,
        };
      } else {
        return {
          ...base,
          '团号': '-',
          '状态': '-',
          '招募人数': '-',
        };
      }
    });

    const ws = XLSX.utils.json_to_sheet(exportFormatted);
    const wb = XLSX.utils.book_new();
    const sheetName = selectedMonth === 'all' ? "总报表" : `${selectedMonth}报表`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const fileName = `Blackyoz_Report_${viewMode}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(val);

  if (authError) return <div className="p-10 text-center text-red-600">Error: {authError}</div>;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      <SidebarForm 
        formData={formData}
        isEditing={isEditing}
        syncStatus={syncStatus}
        user={user}
        onInputChange={handleInputChange}
        onTypeChange={handleTypeChange}
        onSubmit={handleSubmit}
        onCancelEdit={() => {
          setFormData({ ...initialFormState, type: formData.type });
          setIsEditing(false);
        }}
        formatCurrency={formatCurrency}
      />

      <main className="flex-1 overflow-y-auto ml-80 p-8 relative">
        {syncStatus === 'syncing' && (
           <div className="absolute top-6 right-8 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm border border-blue-100 animate-pulse z-30">
             <RefreshCw className="w-3 h-3 animate-spin" /> SYNCING...
           </div>
        )}

        {/* --- Header Area --- */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              南通广电国旅
              <span className="text-slate-400 text-lg font-normal">|</span>
              {viewMode === 'travel' && '旅行团业务'}
              {viewMode === 'business' && '项目业务'}
              {viewMode === 'total' && '公司总览'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {selectedMonth === 'all' ? '所有历史数据' : `${selectedMonth} 月度数据`}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* View Switcher */}
            <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
              <button 
                onClick={() => setViewMode('travel')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${viewMode === 'travel' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Map className="w-4 h-4" /> 旅行团
              </button>
              <button 
                onClick={() => setViewMode('business')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${viewMode === 'business' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Briefcase className="w-4 h-4" /> 项目业务
              </button>
              <button 
                onClick={() => setViewMode('total')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${viewMode === 'total' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Building2 className="w-4 h-4" /> 公司总览
              </button>
            </div>

            {/* Filter */}
            <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm px-3 py-2">
              <Filter className="w-4 h-4 text-slate-500 mr-2" />
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer hover:text-blue-600"
              >
                <option value="all">全部月份</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* --- Stats Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title={viewMode === 'business' ? "项目总利润" : "净利润 (Net Profit)"} 
            value={formatCurrency(stats.totalProfit)} 
            icon={<DollarSign className="w-6 h-6 text-emerald-600" />} 
            colorClass="bg-emerald-100" 
            textColorClass="text-emerald-700" 
          />
          {viewMode === 'business' ? (
             <StatCard 
             title="项目总数" 
             value={`${stats.projectCount} 个`} 
             icon={<Briefcase className="w-6 h-6 text-indigo-600" />} 
             colorClass="bg-indigo-100" 
             textColorClass="text-indigo-700" 
           />
          ) : viewMode === 'travel' ? (
            <StatCard 
              title="累计招募人数" 
              value={`${stats.totalPax} 人`} 
              icon={<Users className="w-6 h-6 text-blue-600" />} 
              colorClass="bg-blue-100" 
              textColorClass="text-blue-700" 
            />
          ) : (
            <StatCard 
              title="业务总量 (团+项目)" 
              value={`${stats.activeGroups + stats.projectCount} 单`} 
              icon={<Building2 className="w-6 h-6 text-blue-600" />} 
              colorClass="bg-blue-100" 
              textColorClass="text-blue-700" 
            />
          )}

          {viewMode === 'travel' && (
            <StatCard 
              title="已成团数量" 
              value={`${stats.activeGroups} 个`} 
              icon={<TrendingUp className="w-6 h-6 text-indigo-600" />} 
              colorClass="bg-indigo-100" 
              textColorClass="text-indigo-700" 
            />
          )}
          
          <StatCard 
            title="平均利润率" 
            value={stats.totalRevenue > 0 ? (stats.totalProfit / stats.totalRevenue * 100).toFixed(1) + '%' : '0%'} 
            icon={<PieIcon className="w-6 h-6 text-purple-600" />} 
            colorClass="bg-purple-100" 
            textColorClass="text-purple-700" 
          />
        </div>

        {/* --- Charts --- */}
        <AnalyticsCharts 
          barData={chartData} 
          pieData={viewMode === 'business' ? [] : pieData} // Hide pie for business view
          formatCurrency={formatCurrency} 
          chartTitle={chartTitle}
        />

        {/* --- Data Table --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-slate-500" />
              详细数据列表
            </h3>
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            >
              <FileDown className="w-4 h-4" />
              导出当前视图 Excel
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
                  <th className="p-4">日期</th>
                  {viewMode === 'total' && <th className="p-4">类型</th>}
                  {viewMode === 'travel' && <th className="p-4">团号</th>}
                  <th className="p-4">{viewMode === 'business' ? '项目名称' : '名称/目的地'}</th>
                  <th className="p-4">负责人</th>
                  {viewMode !== 'business' && <th className="p-4">状态</th>}
                  {viewMode === 'travel' && <th className="p-4 text-right">人数</th>}
                  <th className="p-4 text-right">收入</th>
                  <th className="p-4 text-right">支出</th>
                  <th className="p-4 text-right text-blue-600">利润</th>
                  <th className="p-4 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {displayedData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-400">
                      {loading ? (
                        <div className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" /> 加载中...</div>
                      ) : "暂无数据"}
                    </td>
                  </tr>
                ) : (
                  displayedData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 text-slate-600 font-mono text-xs">{item.date}</td>
                      
                      {viewMode === 'total' && (
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.type === 'travel' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {item.type === 'travel' ? '旅行团' : '项目'}
                          </span>
                        </td>
                      )}
                      
                      {viewMode === 'travel' && <td className="p-4 font-medium">{(item as TravelGroup).groupNo}</td>}
                      
                      <td className="p-4 font-medium text-slate-900">
                        {item.type === 'travel' ? (item as TravelGroup).destination : (item as BusinessProject).projectName}
                      </td>
                      
                      <td className="p-4 text-slate-700">{item.personInCharge || '-'}</td>
                      
                      {viewMode !== 'business' && (
                        <td className="p-4">
                          {item.type === 'travel' ? <StatusBadge status={(item as TravelGroup).status} /> : <span className="text-xs text-gray-400">-</span>}
                        </td>
                      )}
                      
                      {viewMode === 'travel' && <td className="p-4 text-right">{(item as TravelGroup).recruitCount}</td>}
                      
                      <td className="p-4 text-right text-emerald-600 font-medium">{formatCurrency(item.revenue)}</td>
                      <td className="p-4 text-right text-rose-600 font-medium">{formatCurrency(item.expense)}</td>
                      <td className="p-4 text-right font-bold text-slate-800">{formatCurrency(item.revenue - item.expense)}</td>
                      
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(item)} className="p-2 text-rose-600 hover:bg-rose-50 rounded"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}