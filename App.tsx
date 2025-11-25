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
  FileDown
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
import { TravelGroup, TravelGroupFormData, GroupStatus } from './types';

import StatusBadge from './components/StatusBadge';
import StatCard from './components/StatCard';
import AnalyticsCharts from './components/AnalyticsCharts';
import SidebarForm from './components/SidebarForm';

export default function App() {
  // -- State --
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<TravelGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const initialFormState: TravelGroupFormData = {
    id: null,
    groupNo: '',
    date: new Date().toISOString().split('T')[0],
    destination: '',
    personInCharge: '',
    status: '等待',
    recruitCount: 0,
    revenue: 0,
    expense: 0
  };
  
  const [formData, setFormData] = useState<TravelGroupFormData>(initialFormState);

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
    const q = collection(db, 'travel_groups');

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedGroups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TravelGroup[];
      
      // Sort by date descending
      loadedGroups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setGroups(loadedGroups);
      setLoading(false);
      setSyncStatus('idle');
    }, (error: any) => {
      console.error("Data fetch failed:", error);
      if (error.code === 'permission-denied') {
        setAuthError("Permission denied: Check Firestore rules (allow read, write: if true;)");
      } else {
        setAuthError(`Read failed: ${error.message}`);
      }
      setSyncStatus('error');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // -- Computed Stats --
  const stats = useMemo(() => {
    const totalRevenue = groups.reduce((acc, curr) => acc + Number(curr.revenue || 0), 0);
    const totalExpense = groups.reduce((acc, curr) => acc + Number(curr.expense || 0), 0);
    const totalProfit = totalRevenue - totalExpense;
    const totalPax = groups.reduce((acc, curr) => acc + Number(curr.recruitCount || 0), 0);
    const activeGroups = groups.filter(g => g.status === '成团').length;
    return { totalRevenue, totalExpense, totalProfit, totalPax, activeGroups };
  }, [groups]);

  const chartData = useMemo(() => {
    const destMap: Record<string, { name: string, revenue: number, profit: number }> = {};
    groups.forEach(g => {
      if (!destMap[g.destination]) {
        destMap[g.destination] = { name: g.destination, revenue: 0, profit: 0 };
      }
      destMap[g.destination].revenue += Number(g.revenue || 0);
      destMap[g.destination].profit += (Number(g.revenue || 0) - Number(g.expense || 0));
    });
    return Object.values(destMap);
  }, [groups]);

  const pieData = useMemo(() => {
    const statusMap: Record<string, number> = { '成团': 0, '等待': 0, '取消': 0 };
    groups.forEach(g => {
      if (statusMap[g.status] !== undefined) statusMap[g.status]++;
    });
    return Object.keys(statusMap).map(key => ({ name: key, value: statusMap[key] }));
  }, [groups]);

  // -- Handlers --
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['recruitCount', 'revenue', 'expense'].includes(name) ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Cannot save: Not connected to database.");
      return;
    }
    
    setSyncStatus('syncing');
    try {
      const dataToSave = {
        groupNo: formData.groupNo,
        date: formData.date,
        destination: formData.destination,
        personInCharge: formData.personInCharge,
        status: formData.status,
        recruitCount: Number(formData.recruitCount),
        revenue: Number(formData.revenue),
        expense: Number(formData.expense),
        updatedAt: new Date().toISOString()
      };

      if (isEditing && formData.id) {
        const docRef = doc(db, 'travel_groups', formData.id);
        await updateDoc(docRef, dataToSave);
      } else {
        const collectionRef = collection(db, 'travel_groups');
        await addDoc(collectionRef, {
          ...dataToSave,
          createdAt: new Date().toISOString(),
          creatorId: user.uid
        });
      }
      setFormData(initialFormState);
      setIsEditing(false);
    } catch (error: any) {
      console.error("Save failed:", error);
      alert(`Save failed: ${error.message}`);
      setSyncStatus('error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这条记录吗？')) return;
    setSyncStatus('syncing');
    try {
      await deleteDoc(doc(db, 'travel_groups', id));
      if (isEditing && formData.id === id) {
        setFormData(initialFormState);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Delete failed:", error);
      setSyncStatus('error');
    }
  };

  const handleEdit = (item: TravelGroup) => {
    setFormData({
      id: item.id,
      groupNo: item.groupNo,
      date: item.date,
      destination: item.destination,
      personInCharge: item.personInCharge || '',
      status: item.status,
      recruitCount: item.recruitCount,
      revenue: item.revenue,
      expense: item.expense
    });
    setIsEditing(true);
  };

  const handleExportExcel = () => {
    if (groups.length === 0) {
      alert("暂无数据可导出");
      return;
    }

    // 1. Format data for Excel
    const exportData = groups.map(g => {
      const profit = g.revenue - g.expense;
      const margin = g.revenue > 0 ? (profit / g.revenue * 100).toFixed(2) + '%' : '0%';
      return {
        '团号': g.groupNo,
        '发团日期': g.date,
        '目的地': g.destination,
        '责任人': g.personInCharge || '',
        '状态': g.status,
        '招募人数': g.recruitCount,
        '总收入': g.revenue,
        '总支出': g.expense,
        '毛利润': profit,
        '利润率': margin,
        '创建时间': g.createdAt ? new Date(g.createdAt).toLocaleString('zh-CN') : ''
      };
    });

    // 2. Create Sheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Optional: Adjust column widths
    const wscols = [
      {wch: 15}, // 团号
      {wch: 12}, // 日期
      {wch: 15}, // 目的地
      {wch: 12}, // 责任人
      {wch: 8},  // 状态
      {wch: 10}, // 人数
      {wch: 12}, // 收入
      {wch: 12}, // 支出
      {wch: 12}, // 利润
      {wch: 10}, // 利润率
      {wch: 20}  // 创建时间
    ];
    ws['!cols'] = wscols;

    // 3. Create Workbook and Append Sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "团单列表");

    // 4. Download
    const fileName = `Blackyoz_Travel_Groups_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(val);

  // -- Error View --
  if (authError) {
    return (
      <div className="flex h-screen items-center justify-center flex-col p-8 text-center bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-rose-200 max-w-md w-full">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-rose-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Database Connection Issue</h2>
          <p className="text-rose-600 mb-6 text-sm bg-rose-50 p-3 rounded border border-rose-100 font-mono text-left overflow-auto">
            {authError}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      <SidebarForm 
        formData={formData}
        isEditing={isEditing}
        syncStatus={syncStatus}
        user={user}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        onCancelEdit={() => {
          setFormData(initialFormState);
          setIsEditing(false);
        }}
        formatCurrency={formatCurrency}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto ml-80 p-8 relative">
        {/* Sync Indicator */}
        {syncStatus === 'syncing' && (
           <div className="absolute top-6 right-8 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm border border-blue-100 animate-pulse z-30">
             <RefreshCw className="w-3 h-3 animate-spin" /> SYNCING...
           </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="净利润 (实时)" 
            value={formatCurrency(stats.totalProfit)} 
            icon={<DollarSign className="w-6 h-6 text-emerald-600" />} 
            colorClass="bg-emerald-100" 
            textColorClass="text-emerald-700" 
          />
          <StatCard 
            title="累计招募人数" 
            value={`${stats.totalPax} 人`} 
            icon={<Users className="w-6 h-6 text-blue-600" />} 
            colorClass="bg-blue-100" 
            textColorClass="text-blue-700" 
          />
          <StatCard 
            title="已成团数量" 
            value={`${stats.activeGroups} 个`} 
            icon={<TrendingUp className="w-6 h-6 text-indigo-600" />} 
            colorClass="bg-indigo-100" 
            textColorClass="text-indigo-700" 
          />
          <StatCard 
            title="平均利润率" 
            value={stats.totalRevenue > 0 ? (stats.totalProfit / stats.totalRevenue * 100).toFixed(1) + '%' : '0%'} 
            icon={<PieIcon className="w-6 h-6 text-purple-600" />} 
            colorClass="bg-purple-100" 
            textColorClass="text-purple-700" 
          />
        </div>

        {/* Visualization */}
        <AnalyticsCharts 
          barData={chartData} 
          pieData={pieData} 
          formatCurrency={formatCurrency} 
        />

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-slate-500" />
                最近团单
              </h3>
              <span className="text-xs font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                共 {groups.length} 条记录
              </span>
            </div>
            
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
              title="导出为 Excel"
            >
              <FileDown className="w-4 h-4" />
              导出 Excel
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
                  <th className="p-4 font-semibold">团号</th>
                  <th className="p-4 font-semibold">发团日期</th>
                  <th className="p-4 font-semibold">目的地</th>
                  <th className="p-4 font-semibold">责任人</th>
                  <th className="p-4 font-semibold">状态</th>
                  <th className="p-4 font-semibold text-right">招募人数</th>
                  <th className="p-4 font-semibold text-right">总收入</th>
                  <th className="p-4 font-semibold text-right">总支出</th>
                  <th className="p-4 font-semibold text-right text-blue-600">毛利润</th>
                  <th className="p-4 font-semibold text-center">操作</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {groups.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-400">
                      {loading ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                          <p className="font-medium text-slate-600">Connecting to Blackyoz Database...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <CheckCircle2 className="w-10 h-10 text-emerald-500 opacity-80" />
                          <p className="font-medium text-slate-600">System Ready</p>
                          <p className="text-xs">Use the sidebar to add your first travel group.</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  groups.map((group) => (
                    <tr key={group.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 font-medium text-slate-900">{group.groupNo}</td>
                      <td className="p-4 text-slate-600 font-mono text-xs">{group.date}</td>
                      <td className="p-4 text-slate-700 font-medium">{group.destination}</td>
                      <td className="p-4 text-slate-700">{group.personInCharge || '-'}</td>
                      <td className="p-4"><StatusBadge status={group.status} /></td>
                      <td className="p-4 text-right text-slate-600">{group.recruitCount}</td>
                      <td className="p-4 text-right text-emerald-600 font-medium">{formatCurrency(group.revenue)}</td>
                      <td className="p-4 text-right text-rose-600 font-medium">{formatCurrency(group.expense)}</td>
                      <td className="p-4 text-right font-bold text-slate-800">
                        {formatCurrency(group.revenue - group.expense)}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEdit(group)} 
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(group.id)} 
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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