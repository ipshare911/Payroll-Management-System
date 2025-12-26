import React, { useState, useEffect, useMemo } from 'react';
import { 
  Upload as UploadIcon, 
  Download,
  Search,
  Building2,
  ChevronRight,
  ChevronLeft,
  Wallet,
  PieChart as PieChartIcon,
  Users,
  Calculator,
  ChevronDown,
  Pencil,
  Save,
  X as XIcon,
  Trash2,
  Rows,
  Sigma,
  UserCircle,
  LogOut,
  Menu,
  ChevronUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { SalaryRecord } from './types';
import { db } from './services/db';
import { ImportModal } from './components/ImportModal';
import { ExportModal } from './components/ExportModal';
import { Login } from './components/Login'; 

// --- Constants ---
const DEPARTMENTS = ['基础地质所', '规划所', '储量所', '绿色矿山所', '矿业经济所', '遥感所', '办公室'];

const STAT_COLUMNS: { key: keyof SalaryRecord; label: string }[] = [
    { key: 'positionSalary', label: '岗位工资' },
    { key: 'baseSalary', label: '基本工资' },
    { key: 'retentionAllowance', label: '保留津贴' },
    { key: 'performanceSalary', label: '绩效工资' },
    { key: 'internalAuditFee', label: '内审费' },
    { key: 'certificateSubsidy', label: '证书补贴' },
    { key: 'annualLeavePay', label: '未休年假' },
    { key: 'publicityPerformance', label: '宣传绩效' },
    { key: 'branchAuditFee', label: '分院内审' },
    { key: 'researchPerformance', label: '科研绩效' },
    { key: 'otherPerformanceAccounting', label: '走账绩效' },
    { key: 'other', label: '其他' },
];

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(val);
};

function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const auth = sessionStorage.getItem('mineral_auth');
    return auth === 'true';
  });

  // Mobile Detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Navigation State
  const [activeDepartment, setActiveDepartment] = useState<string>('all'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  
  // Auto-collapse sidebars on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
      setIsRightSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
      setIsRightSidebarOpen(true);
    }
  }, [isMobile]);

  // Filter State
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // View State
  const [viewMode, setViewMode] = useState<'monthly' | 'summary'>('monthly');

  // Custom Stat State
  const [customStatKey, setCustomStatKey] = useState<keyof SalaryRecord>('performanceSalary');

  // Data State
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SalaryRecord | null>(null);

  // Mobile Expanded Cards State
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated]);

  const refreshData = () => {
    setRecords(db.getAllRecords());
  };

  // Auth Handlers
  const handleLogin = (success: boolean) => {
    if (success) {
      sessionStorage.setItem('mineral_auth', 'true');
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
        sessionStorage.removeItem('mineral_auth');
        setIsAuthenticated(false);
        window.location.reload();
    }
  };

  // --- Computed Data ---
  const availableYears = useMemo(() => {
    const years = new Set(records.map(r => r.month.split('-')[0]));
    if (!years.has('2025')) years.add('2025');
    return Array.from(years).sort().reverse();
  }, [records]);

  const filteredRecords = useMemo(() => {
    let filtered = records;
    if (activeDepartment !== 'all') {
      filtered = filtered.filter(r => r.department === activeDepartment);
    }
    filtered = filtered.filter(r => r.month.startsWith(selectedYear));
    if (selectedMonth !== 'all') {
      const monthStr = `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
      filtered = filtered.filter(r => r.month === monthStr);
    }
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.employeeName.includes(searchTerm) || 
        r.department.includes(searchTerm) 
      );
    }
    return filtered;
  }, [records, activeDepartment, selectedYear, selectedMonth, searchTerm]);

  // Employee Directory Data
  const employeeDirectory = useMemo(() => {
      let baseData = records.filter(r => r.month.startsWith(selectedYear));
      if (activeDepartment !== 'all') {
          baseData = baseData.filter(r => r.department === activeDepartment);
      }
      const map = new Map<string, { name: string; dept: string; total: number; count: number }>();
      baseData.forEach(r => {
          const key = `${r.employeeName}-${r.department}`;
          if (!map.has(key)) {
              map.set(key, { name: r.employeeName, dept: r.department, total: 0, count: 0 });
          }
          const entry = map.get(key)!;
          entry.total += r.netTotal;
          entry.count += 1;
      });
      let list = Array.from(map.values());
      if (searchTerm) {
          list = list.filter(e => e.name.includes(searchTerm) || e.dept.includes(searchTerm));
      }
      return list.sort((a, b) => b.total - a.total);
  }, [records, activeDepartment, selectedYear, searchTerm]);

  // Summary Data
  const summaryRecords = useMemo(() => {
      if (viewMode === 'monthly') return [];
      const map = new Map<string, SalaryRecord & { count: number }>();
      filteredRecords.forEach(r => {
          const key = `${r.employeeName}-${r.department}`;
          if (!map.has(key)) {
              map.set(key, { ...r, id: key, month: '', count: 0, positionSalary: 0, baseSalary: 0, retentionAllowance: 0, performanceSalary: 0, internalAuditFee: 0, certificateSubsidy: 0, annualLeavePay: 0, publicityPerformance: 0, branchAuditFee: 0, researchPerformance: 0, otherPerformanceAccounting: 0, other: 0, total: 0, netTotal: 0 });
          }
          const entry = map.get(key)!;
          entry.count += 1;
          STAT_COLUMNS.forEach(col => { (entry[col.key] as number) += (r[col.key] as number); });
          entry.total += r.total;
          entry.netTotal += r.netTotal;
      });
      return Array.from(map.values());
  }, [filteredRecords, viewMode]);

  const displayRecords = viewMode === 'monthly' ? filteredRecords : summaryRecords;

  // Chart Data
  const trendData = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => ({ name: `${i + 1}月`, total: 0 }));
    
    records.forEach(r => {
        if (!r.month.startsWith(selectedYear)) return;
        if (activeDepartment !== 'all' && r.department !== activeDepartment) return;
        
        const monthPart = r.month.split('-')[1];
        const monthIndex = parseInt(monthPart, 10) - 1;
        if (!isNaN(monthIndex) && monthIndex >= 0 && monthIndex < 12) {
            data[monthIndex].total += r.netTotal;
        }
    });
    
    return data;
  }, [records, selectedYear, activeDepartment]);

  // Stats
  const totalPayout = filteredRecords.reduce((acc, r) => acc + r.netTotal, 0); 
  const grossTotalPayout = filteredRecords.reduce((acc, r) => acc + r.total, 0); 
  const headcount = new Set(filteredRecords.map(r => r.employeeName)).size;
  const customStatValue = filteredRecords.reduce((acc, r) => {
      const val = r[customStatKey];
      return acc + (typeof val === 'number' ? val : 0);
  }, 0);

  // --- Handlers ---
  const handleEditClick = (record: SalaryRecord) => {
    setEditingId(record.id);
    setEditForm({ ...record });
  };
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };
  const handleSaveEdit = () => {
    if (!editForm) return;
    const total = STAT_COLUMNS.reduce((acc, col) => acc + (Number(editForm[col.key]) || 0), 0);
    const netTotal = total - (Number(editForm.otherPerformanceAccounting) || 0);
    const updatedRecord = { ...editForm, total, netTotal };
    db.updateRecord(updatedRecord);
    refreshData();
    setEditingId(null);
    setEditForm(null);
  };
  
  const handleDelete = (id: string) => {
      // Use setTimeout to allow UI to update/detach event handlers on touch devices
      setTimeout(() => {
        if(window.confirm('确定要删除这条记录吗？')) {
            try {
                db.deleteRecord(id);
                refreshData();
            } catch (e) {
                console.error("Delete failed", e);
                alert("删除失败，请重试。");
            }
        }
      }, 50);
  };

  const handleInputChange = (field: keyof SalaryRecord, value: string) => {
      if (!editForm) return;
      let parsedValue: string | number = value;
      if (!['employeeName', 'department', 'month', 'id', 'sequence'].includes(field)) {
          parsedValue = parseFloat(value);
          if (isNaN(parsedValue)) parsedValue = 0;
      }
      setEditForm({ ...editForm, [field]: parsedValue });
  };
  
  const toggleCard = (id: string) => {
      const next = new Set(expandedCards);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setExpandedCards(next);
  };

  // Helper to render cell content (text or input)
  const renderCell = (record: SalaryRecord, field: keyof SalaryRecord, isNumeric: boolean = true) => {
      if (viewMode === 'monthly' && editingId === record.id && editForm) {
          return (
              <input 
                  type={isNumeric ? "number" : "text"}
                  className={`w-full bg-white border border-[#007AFF] rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#007AFF] ${isNumeric ? 'text-right' : 'text-left'}`}
                  value={editForm[field] || ''}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  onClick={(e) => e.stopPropagation()} // Prevent card expansion
              />
          );
      }
      return isNumeric ? (record[field] as number) : (record[field] as string);
  };

  // --- Auth Check ---
  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  return (
    <div className="flex h-[100dvh] bg-[#F5F5F7] text-[#1D1D1F] font-sans overflow-hidden selection:bg-[#007AFF] selection:text-white">
      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSuccess={refreshData} />
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} data={filteredRecords} context={{ year: selectedYear, department: activeDepartment }} />

      {/* Mobile Sidebar Backdrop */}
      {isMobile && isSidebarOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar (Left) */}
      <aside className={`bg-[#FBFBFD] border-r border-[#E5E5EA] transition-transform duration-300 ease-in-out z-50 flex flex-col flex-shrink-0 
          fixed inset-y-0 left-0 w-64 h-full
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:h-auto
          ${!isSidebarOpen && !isMobile ? 'md:w-0 md:overflow-hidden md:border-none' : 'md:w-64'}
      `}>
        <div className="h-16 flex items-center px-6 pt-4 mb-2 flex-shrink-0">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#007AFF] to-[#5856D6] rounded-lg shadow-md flex items-center justify-center text-white">
                <Wallet size={18} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <h1 className="font-semibold text-sm leading-tight whitespace-nowrap">矿产资源分院</h1>
                <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">工资管理系统</span>
              </div>
           </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
             <div className="px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                导航
             </div>
             <SidebarItem icon={<PieChartIcon size={18} />} label="分院概况" active={activeDepartment === 'all'} onClick={() => {setActiveDepartment('all'); if(isMobile) setIsSidebarOpen(false);}} />
             <div className="mt-4 mb-1 px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">研究所</div>
             {DEPARTMENTS.map((dept) => (
                <SidebarItem key={dept} icon={<Building2 size={18} />} label={dept} active={activeDepartment === dept} onClick={() => {setActiveDepartment(dept); if(isMobile) setIsSidebarOpen(false);}} />
             ))}
        </nav>
        <div className="p-3 border-t border-[#E5E5EA]">
            <button type="button" onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors group cursor-pointer">
                <LogOut size={18} />
                退出登录
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative min-w-0">
        <header className="bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA] flex flex-col md:flex-row md:items-center justify-between px-4 md:px-6 py-3 md:py-0 md:h-16 z-10 flex-shrink-0 sticky top-0 gap-3">
          <div className="flex items-center justify-between md:justify-start gap-4">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 hover:bg-black/5 rounded-lg text-gray-500 transition-colors">
                    {isMobile ? <Menu size={20} /> : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M9 3v18"/></svg>
                    )}
                </button>
                <h2 className="text-lg font-semibold tracking-tight truncate">
                    {activeDepartment === 'all' ? '分院概况' : activeDepartment}
                </h2>
            </div>
            {/* Mobile Action Buttons moved to right of header */}
            <div className="flex md:hidden items-center gap-1">
                 <button onClick={() => setIsImportModalOpen(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><UploadIcon size={20} /></button>
                 <button onClick={() => setIsExportModalOpen(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><Download size={20} /></button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
             {/* View Mode Toggle - Visible on mobile now for switching between Detail/Summary */}
             <div className="flex flex-shrink-0 bg-[#F2F2F7] rounded-lg p-1 mr-2">
                 <button onClick={() => setViewMode('monthly')} className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'monthly' ? 'bg-white text-[#007AFF] shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                     <Rows size={12} /> <span className="whitespace-nowrap">明细</span>
                 </button>
                 <button onClick={() => setViewMode('summary')} className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'summary' ? 'bg-white text-[#007AFF] shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                     <Sigma size={12} /> <span className="whitespace-nowrap">汇总</span>
                 </button>
             </div>

            <div className="relative flex-shrink-0">
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="appearance-none bg-[#F2F2F7] hover:bg-[#E5E5EA] text-sm font-medium pl-3 pr-8 py-1.5 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all">
                    {availableYears.map(y => <option key={y} value={y}>{y}年</option>)}
                </select>
                <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 rotate-90 pointer-events-none" />
            </div>

             <div className="relative flex-shrink-0">
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="appearance-none bg-[#F2F2F7] hover:bg-[#E5E5EA] text-sm font-medium pl-3 pr-8 py-1.5 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all">
                    <option value="all">全年</option>
                    {[...Array(12)].map((_, i) => <option key={i} value={(i+1).toString()}>{i+1}月</option>)}
                </select>
                <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 rotate-90 pointer-events-none" />
            </div>

            <div className="relative group flex-shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="搜索..." 
                    className="bg-[#F2F2F7] hover:bg-[#E5E5EA] focus:bg-white text-sm pl-9 pr-8 py-1.5 rounded-lg w-24 focus:w-40 md:w-40 md:focus:w-60 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 border border-transparent focus:border-[#007AFF]/30 placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                 {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-200"><XIcon size={12} /></button>}
            </div>

            <div className="hidden md:block h-4 w-px bg-gray-300 mx-1"></div>
            <button onClick={() => setIsImportModalOpen(true)} className="hidden md:block p-2 text-gray-500 hover:text-[#007AFF] hover:bg-[#007AFF]/10 rounded-full transition-colors" title="导入"><UploadIcon className="w-5 h-5" /></button>
            <button onClick={() => setIsExportModalOpen(true)} className="hidden md:block p-2 text-gray-500 hover:text-[#007AFF] hover:bg-[#007AFF]/10 rounded-full transition-colors" title="导出设置"><Download className="w-5 h-5" /></button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
            {/* Inner Main Content */}
            <div className="flex-1 overflow-auto p-3 md:p-6 scroll-smooth">
              <div className="max-w-[1920px] mx-auto space-y-4 md:space-y-6">

                 {/* Stats Row */}
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-5">
                    <AppleStatCard title="合计总额" value={formatCurrency(grossTotalPayout)} icon={<Wallet className="text-white" size={20} />} color="from-[#8E8E93] to-[#48484A]" trend={selectedMonth !== 'all' ? `2025年${selectedMonth}月` : `${selectedYear}年度`} />
                    <AppleStatCard title="实发合计总额" value={formatCurrency(totalPayout)} icon={<PieChartIcon className="text-white" size={20} />} color="from-[#007AFF] to-[#0055B3]" trend="扣除走账绩效" />
                    <AppleStatCard title="发放人数" value={headcount.toString()} suffix="人" icon={<Users className="text-white" size={20} />} color="from-[#FF9500] to-[#E68600]" trend={activeDepartment === 'all' ? '全院' : activeDepartment} />
                    
                    {/* Custom Stat (Hidden on very small screens if needed, but kept for now) */}
                    <div className="bg-white p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm border border-[#E5E5EA] flex flex-col justify-between h-28 md:h-32 relative overflow-hidden group">
                        <div className="flex justify-between items-start z-10">
                            <div className="relative z-20">
                                <div className="relative inline-block">
                                    <select className="appearance-none bg-transparent pr-4 py-0 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer focus:outline-none hover:text-[#007AFF] transition-colors" value={customStatKey} onChange={(e) => setCustomStatKey(e.target.value as keyof SalaryRecord)}>
                                        {STAT_COLUMNS.map(col => <option key={col.key} value={col.key}>{col.label}总额</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-0 top-0 w-3 h-3 text-gray-400 pointer-events-none mt-0.5" />
                                </div>
                                <div className="mt-1 flex items-baseline gap-1">
                                    <h3 className="text-xl md:text-2xl font-bold text-[#1D1D1F] tracking-tight">{formatCurrency(customStatValue)}</h3>
                                </div>
                            </div>
                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#AF52DE] to-[#5856D6] flex items-center justify-center shadow-lg shadow-gray-200`}>
                                <Calculator className="text-white" size={18} />
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* Trend Chart (Hidden on mobile to save space, or kept small) */}
                 <div className="hidden md:block bg-white rounded-3xl p-6 shadow-sm border border-[#E5E5EA]">
                     <div className="flex justify-between items-center mb-6">
                         <h3 className="font-semibold text-gray-800">{selectedYear}年度实发趋势 <span className="text-xs font-normal text-gray-400 ml-2">({activeDepartment === 'all' ? '全院' : activeDepartment})</span></h3>
                     </div>
                     <div className="h-48">
                         <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={trendData}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2F2F7" />
                                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8E8E93', fontSize: 11}} dy={10} />
                                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#8E8E93', fontSize: 11}} tickFormatter={(value) => `${value/1000}k`} />
                                 <RechartsTooltip cursor={{fill: '#F2F2F7', radius: 4}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value: any) => [formatCurrency(value), '实发']} />
                                 <Bar dataKey="total" fill="#007AFF" radius={[6, 6, 6, 6]} barSize={24} />
                             </BarChart>
                         </ResponsiveContainer>
                     </div>
                 </div>
                 
                 {/* Desktop Table View */}
                 <div className="hidden md:flex bg-white rounded-3xl shadow-sm border border-[#E5E5EA] overflow-hidden flex-col">
                    <div className="px-6 py-4 border-b border-[#E5E5EA] flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-[#007AFF] rounded-full"></span>
                            {viewMode === 'monthly' ? '工资明细' : '人员工资汇总'}
                        </h3>
                        <div className="text-xs text-gray-500 font-medium bg-[#F2F2F7] px-2 py-1 rounded-lg">共 {displayRecords.length} {viewMode === 'monthly' ? '条记录' : '人'}</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left whitespace-nowrap">
                            <thead className="bg-[#F9F9FB] text-gray-500 font-medium">
                                <tr>
                                    <th className="px-4 py-3 first:pl-6 sticky left-0 bg-[#F9F9FB] z-10 border-r border-[#E5E5EA]">{viewMode === 'monthly' ? '月份' : '统计'}</th>
                                    <th className="px-4 py-3 sticky left-24 bg-[#F9F9FB] z-10 border-r border-[#E5E5EA]">姓名</th>
                                    <th className="px-4 py-3">部门</th>
                                    {STAT_COLUMNS.map(col => <th key={col.key} className="px-4 py-3 text-right">{col.label}</th>)}
                                    <th className="px-4 py-3 text-right font-semibold bg-gray-50">合计</th>
                                    <th className="px-4 py-3 text-right font-bold text-[#007AFF] bg-blue-50/50">实发合计</th>
                                    {viewMode === 'monthly' && <th className="px-4 py-3 text-center sticky right-0 bg-[#F9F9FB] z-10 border-l border-[#E5E5EA]">操作</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E5EA]">
                                {displayRecords.map((record) => (
                                    <tr key={record.id} className="hover:bg-[#F5F5F7] transition-colors group">
                                        <td className="px-4 py-3 first:pl-6 text-gray-500 sticky left-0 bg-white group-hover:bg-[#F5F5F7] border-r border-[#E5E5EA] transition-colors font-mono">{viewMode === 'monthly' ? record.month : <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">共 {(record as any).count} 个月</span>}</td>
                                        <td className="px-4 py-3 font-medium text-[#1D1D1F] sticky left-24 bg-white group-hover:bg-[#F5F5F7] border-r border-[#E5E5EA] transition-colors">{renderCell(record, 'employeeName', false)}</td>
                                        <td className="px-4 py-3 text-gray-600">{renderCell(record, 'department', false)}</td>
                                        {STAT_COLUMNS.map(col => <td key={col.key} className="px-4 py-3 text-right font-numeric w-24">{renderCell(record, col.key)}</td>)}
                                        <td className="px-4 py-3 text-right font-numeric font-semibold bg-gray-50 group-hover:bg-gray-100">{editingId === record.id ? '-' : formatCurrency(record.total)}</td>
                                        <td className="px-4 py-3 text-right font-numeric font-bold text-[#007AFF] bg-blue-50/50 group-hover:bg-blue-100/50">{editingId === record.id ? '-' : formatCurrency(record.netTotal)}</td>
                                        {viewMode === 'monthly' && (
                                            <td className="px-2 py-2 sticky right-0 bg-white group-hover:bg-[#F5F5F7] border-l border-[#E5E5EA] transition-colors z-10 text-center">
                                                {editingId === record.id ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={handleSaveEdit} className="p-1.5 bg-[#007AFF] text-white rounded-md hover:bg-[#0055B3] transition-colors shadow-sm"><Save size={14} /></button>
                                                        <button onClick={handleCancelEdit} className="p-1.5 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 transition-colors"><XIcon size={14} /></button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => handleEditClick(record)} className="p-1.5 text-gray-400 hover:text-[#007AFF] hover:bg-blue-50 rounded-md transition-colors"><Pencil size={14} /></button>
                                                        <button onClick={() => handleDelete(record.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={14} /></button>
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 </div>

                 {/* Mobile Card View */}
                 <div className="md:hidden space-y-3 pb-8">
                     {displayRecords.length === 0 && <div className="text-center py-10 text-gray-400 italic bg-white rounded-xl">未找到相关数据</div>}
                     {displayRecords.map((record) => {
                         const isEditing = editingId === record.id;
                         const isExpanded = expandedCards.has(record.id) || isEditing;
                         
                         return (
                             <div key={record.id} className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${isExpanded ? 'ring-1 ring-[#007AFF] border-[#007AFF] shadow-md' : 'border-[#E5E5EA] shadow-sm'}`}>
                                 <div className="p-4" onClick={() => !isEditing && toggleCard(record.id)}>
                                     <div className="flex justify-between items-start">
                                         <div className="flex items-center gap-3">
                                             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 shadow-inner">
                                                 {record.employeeName.slice(0, 1)}
                                             </div>
                                             <div>
                                                 <div className="font-bold text-[#1D1D1F] flex items-center gap-2">
                                                     {renderCell(record, 'employeeName', false)}
                                                 </div>
                                                 <div className="text-xs text-gray-400 mt-0.5">
                                                     {renderCell(record, 'department', false)} · {viewMode === 'monthly' ? record.month : `汇总 (${(record as any).count}个月)`}
                                                 </div>
                                             </div>
                                         </div>
                                         <div className="text-right">
                                             <div className="text-lg font-bold text-[#007AFF] font-numeric">
                                                 {isEditing ? '---' : formatCurrency(record.netTotal)}
                                             </div>
                                             <div className="text-[10px] text-gray-400 uppercase">实发合计</div>
                                         </div>
                                     </div>

                                     {/* Collapsed Preview (if not expanded) */}
                                     {!isExpanded && (
                                         <div className="mt-3 pt-3 border-t border-dashed border-gray-100 flex justify-between text-xs text-gray-500">
                                              <span>岗位: {formatCurrency(record.positionSalary)}</span>
                                              <span>绩效: {formatCurrency(record.performanceSalary)}</span>
                                              <ChevronDown size={14} className="text-gray-300" />
                                         </div>
                                     )}
                                 </div>

                                 {/* Expanded Details Form/View */}
                                 {isExpanded && (
                                     <div className="bg-[#F9F9FB] border-t border-[#E5E5EA] p-4 text-xs">
                                         <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
                                             {STAT_COLUMNS.map(col => (
                                                 <div key={col.key} className="flex flex-col gap-1">
                                                     <span className="text-gray-400 scale-90 origin-top-left">{col.label}</span>
                                                     <div className="font-numeric font-medium text-gray-700">
                                                         {renderCell(record, col.key)}
                                                     </div>
                                                 </div>
                                             ))}
                                             <div className="col-span-2 pt-2 border-t border-gray-200 flex justify-between items-center mt-1">
                                                <span className="font-semibold text-gray-600">应发合计</span>
                                                <span className="font-bold text-gray-800 text-sm">{isEditing ? '-' : formatCurrency(record.total)}</span>
                                             </div>
                                         </div>

                                         {viewMode === 'monthly' && (
                                             <div className="flex gap-2 pt-2">
                                                 {isEditing ? (
                                                     <>
                                                         <button onClick={handleSaveEdit} className="flex-1 bg-[#007AFF] text-white py-2 rounded-lg font-medium shadow-sm hover:bg-[#0055B3]">保存修改</button>
                                                         <button onClick={handleCancelEdit} className="flex-1 bg-white border border-gray-300 text-gray-600 py-2 rounded-lg font-medium">取消</button>
                                                     </>
                                                 ) : (
                                                     <>
                                                         <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditClick(record); }} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-1 active:bg-gray-100">
                                                             <Pencil size={14} /> 编辑
                                                         </button>
                                                         <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(record.id); }} className="px-4 bg-white border border-red-200 text-red-600 py-2 rounded-lg font-medium hover:bg-red-50 flex items-center justify-center gap-1 active:bg-red-50">
                                                             <Trash2 size={16} /> 删除
                                                         </button>
                                                     </>
                                                 )}
                                                 {!isEditing && (
                                                     <button onClick={() => toggleCard(record.id)} className="px-3 text-gray-400">
                                                         <ChevronUp size={16} />
                                                     </button>
                                                 )}
                                             </div>
                                         )}
                                     </div>
                                 )}
                             </div>
                         );
                     })}
                 </div>

              </div>
            </div>

            {/* Right Sidebar - Employee Query Module */}
            <aside className={`bg-white/80 backdrop-blur-xl flex flex-col z-40 flex-shrink-0 transition-transform duration-300 border-l border-[#E5E5EA] 
                ${isMobile ? 'fixed inset-y-0 right-0 w-72 shadow-2xl' : 'relative'}
                ${isRightSidebarOpen ? 'translate-x-0' : (isMobile ? 'translate-x-full' : '')}
                ${!isMobile && !isRightSidebarOpen ? 'w-12' : 'w-72'}
            `}>
               {/* Mobile Toggle Handle for Right Sidebar */}
               {isMobile && !isRightSidebarOpen && (
                   <button 
                       onClick={() => setIsRightSidebarOpen(true)}
                       className="fixed bottom-6 right-6 w-12 h-12 bg-[#007AFF] text-white rounded-full shadow-lg flex items-center justify-center z-50 animate-bounce"
                   >
                       <UserCircle size={24} />
                   </button>
               )}
               
               {/* Mobile Backdrop for Right Sidebar */}
               {isMobile && isRightSidebarOpen && (
                   <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[-1]" onClick={() => setIsRightSidebarOpen(false)} style={{right: '288px', width: '100vw'}}></div>
               )}

               {isRightSidebarOpen ? (
                   <div className="w-72 flex flex-col h-full">
                       <div className="p-4 border-b border-[#E5E5EA] sticky top-0 bg-white/50 backdrop-blur-sm z-10 flex justify-between items-center">
                           <div>
                               <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                                   <UserCircle size={16} className="text-[#007AFF]" />
                                   {selectedYear} 员工名录
                               </h3>
                           </div>
                           <div className="flex items-center gap-2">
                               <button onClick={() => setIsRightSidebarOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-md transition-colors">
                                   <ChevronRight size={16} />
                               </button>
                           </div>
                       </div>
                       <div className="flex-1 overflow-y-auto p-2 space-y-1">
                           {employeeDirectory.length === 0 ? <div className="text-center py-10 text-gray-400 text-xs">无员工数据</div> : employeeDirectory.map(emp => (
                                   <button key={`${emp.name}-${emp.dept}`} onClick={() => { setSearchTerm(emp.name); if(isMobile) setIsRightSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all duration-200 group border ${searchTerm === emp.name ? 'bg-[#007AFF] text-white shadow-md border-[#007AFF]' : 'bg-white border-transparent hover:border-[#E5E5EA] hover:bg-gray-50 text-gray-700'}`}>
                                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0 transition-colors ${searchTerm === emp.name ? 'bg-white/20 text-white' : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500'}`}>{emp.name.slice(0, 1)}</div>
                                      <div className="flex-1 min-w-0">
                                          <div className="font-semibold text-sm truncate">{emp.name}</div>
                                          <div className={`text-[11px] truncate mt-0.5 ${searchTerm === emp.name ? 'text-blue-100' : 'text-gray-400'}`}>{emp.dept}</div>
                                      </div>
                                      <div className="text-right">
                                          <div className={`text-xs font-bold font-numeric ${searchTerm === emp.name ? 'text-white' : 'text-[#1D1D1F]'}`}>{formatCurrency(emp.total)}</div>
                                      </div>
                                   </button>
                               ))
                           }
                       </div>
                   </div>
               ) : (
                   !isMobile && (
                       <div className="w-12 flex flex-col items-center h-full py-4 bg-[#F9F9FB] cursor-pointer hover:bg-[#F2F2F7] transition-colors" onClick={() => setIsRightSidebarOpen(true)} title="展开员工名录">
                           <div className="p-2 rounded-lg bg-white shadow-sm border border-gray-200 mb-4 text-[#007AFF]"><UserCircle size={20} /></div>
                           <div className="[writing-mode:vertical-rl] text-xs font-medium text-gray-500 tracking-widest whitespace-nowrap">员工名录</div>
                       </div>
                   )
               )}
            </aside>
        </div>
      </main>
    </div>
  );
}

const SidebarItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${active ? 'bg-white text-[#007AFF] shadow-sm' : 'text-gray-500 hover:bg-black/5 hover:text-gray-900'}`}>
        <span className={`transition-colors ${active ? 'text-[#007AFF]' : 'text-gray-400 group-hover:text-gray-600'}`}>{icon}</span>
        {label}
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#007AFF]"></div>}
    </button>
);

const AppleStatCard = ({ title, value, suffix, icon, color, trend }: any) => (
    <div className="bg-white p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm border border-[#E5E5EA] flex flex-col justify-between h-28 md:h-32 relative overflow-hidden group">
        <div className="flex justify-between items-start z-10">
            <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">{title}</p>
                <div className="mt-1 flex items-baseline gap-1">
                    <h3 className="text-xl md:text-2xl font-bold text-[#1D1D1F] tracking-tight">{value}</h3>
                    {suffix && <span className="text-sm text-gray-500 font-medium">{suffix}</span>}
                </div>
            </div>
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg shadow-gray-200`}>{icon}</div>
        </div>
        <div className="z-10 mt-auto"><span className="text-[10px] font-medium text-gray-400 bg-[#F5F5F7] px-2 py-1 rounded-md">{trend}</span></div>
    </div>
);

export default App;