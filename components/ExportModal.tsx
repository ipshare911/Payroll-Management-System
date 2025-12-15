import React, { useState, useMemo } from 'react';
import { SalaryRecord } from '../types';
import { Download, X, Check, Users, Building2, FileText, Grid } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SalaryRecord[];
  context: {
    year: string;
    department: string;
  };
}

// Define available columns for export
const COLUMN_CONFIG = [
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
  { key: 'total', label: '合计', isFixed: true },
  { key: 'netTotal', label: '实发合计', isFixed: true },
];

type ExportMode = 'detail' | 'by_person' | 'by_department';

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, data, context }) => {
  const [mode, setMode] = useState<ExportMode>('by_person');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(COLUMN_CONFIG.map(c => c.key));

  if (!isOpen) return null;

  const toggleColumn = (key: string) => {
    if (selectedColumns.includes(key)) {
      setSelectedColumns(selectedColumns.filter(k => k !== key));
    } else {
      setSelectedColumns([...selectedColumns, key]);
    }
  };

  const handleExport = () => {
    let exportData: any[] = [];
    let sheetName = '';
    
    // 1. Process Data based on Mode
    if (mode === 'detail') {
      sheetName = '工资明细';
      exportData = data.map(r => {
        const row: any = {
          '月份': r.month,
          '姓名': r.employeeName,
          '部门': r.department,
        };
        selectedColumns.forEach(key => {
            const col = COLUMN_CONFIG.find(c => c.key === key);
            if (col) row[col.label] = r[key as keyof SalaryRecord];
        });
        return row;
      });
    } else if (mode === 'by_person') {
      sheetName = '人员汇总';
      // Aggregate by Person + Dept
      const map = new Map<string, any>();
      data.forEach(r => {
        const id = `${r.employeeName}-${r.department}`;
        if (!map.has(id)) {
          map.set(id, {
            '姓名': r.employeeName,
            '部门': r.department,
            '统计月份数': 0,
            _sums: {} 
          });
        }
        const entry = map.get(id);
        entry['统计月份数'] += 1;
        
        selectedColumns.forEach(key => {
           if (!entry._sums[key]) entry._sums[key] = 0;
           entry._sums[key] += (r[key as keyof SalaryRecord] as number) || 0;
        });
      });

      exportData = Array.from(map.values()).map(item => {
        const row: any = {
          '姓名': item['姓名'],
          '部门': item['部门'],
          '统计月份数': item['统计月份数']
        };
        selectedColumns.forEach(key => {
            const col = COLUMN_CONFIG.find(c => c.key === key);
            if(col) row[col.label] = item._sums[key];
        });
        return row;
      });
    } else if (mode === 'by_department') {
      sheetName = '部门汇总';
      // Aggregate by Dept
      const map = new Map<string, any>();
      data.forEach(r => {
        const id = r.department;
        if (!map.has(id)) {
          map.set(id, {
            '部门': r.department,
            '总人次': 0,
            _sums: {} 
          });
        }
        const entry = map.get(id);
        entry['总人次'] += 1;
        
        selectedColumns.forEach(key => {
           if (!entry._sums[key]) entry._sums[key] = 0;
           entry._sums[key] += (r[key as keyof SalaryRecord] as number) || 0;
        });
      });

      exportData = Array.from(map.values()).map(item => {
         const row: any = {
          '部门': item['部门'],
          '总人次': item['总人次']
        };
        selectedColumns.forEach(key => {
            const col = COLUMN_CONFIG.find(c => c.key === key);
            if(col) row[col.label] = item._sums[key];
        });
        return row;
      });
    }

    // 2. Write File
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const fileName = `工资导出_${context.department === 'all' ? '全院' : context.department}_${context.year}_${mode}.xlsx`;
    XLSX.writeFile(wb, fileName);
    onClose();
  };

  const ModeCard = ({ id, label, icon, desc }: { id: ExportMode, label: string, icon: any, desc: string }) => (
    <div 
      onClick={() => setMode(id)}
      className={`cursor-pointer border rounded-xl p-3 md:p-4 transition-all duration-200 flex flex-col gap-2 ${
        mode === id 
          ? 'border-[#007AFF] bg-blue-50/50 ring-1 ring-[#007AFF]' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-lg ${mode === id ? 'bg-[#007AFF] text-white' : 'bg-gray-100 text-gray-500'}`}>
          {icon}
        </div>
        {mode === id && <Check className="w-5 h-5 text-[#007AFF]" />}
      </div>
      <div>
        <div className={`font-semibold text-sm ${mode === id ? 'text-[#007AFF]' : 'text-gray-700'}`}>{label}</div>
        <div className="text-[10px] md:text-xs text-gray-400 mt-1">{desc}</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
              <Download className="w-5 h-5 text-[#007AFF]" />
              导出工资数据
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              当前范围: {context.year}年 · {context.department === 'all' ? '全院' : context.department} · 共 {data.length} 条记录
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8">
          
          {/* Section 1: Mode Selection */}
          <section>
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#007AFF] rounded-full"></span>
              第一步：选择导出方式
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <ModeCard 
                id="detail" 
                label="原始明细" 
                desc="导出每一条工资记录，不进行合并。"
                icon={<FileText size={18} />} 
              />
              <ModeCard 
                id="by_person" 
                label="按人员汇总" 
                desc="按姓名合并数据，适合查看个人年度总收入。"
                icon={<Users size={18} />} 
              />
              <ModeCard 
                id="by_department" 
                label="按部门汇总" 
                desc="按部门合并数据，适合查看部门成本。"
                icon={<Building2 size={18} />} 
              />
            </div>
          </section>

          {/* Section 2: Column Selection */}
          <section>
             <div className="flex justify-between items-end mb-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#007AFF] rounded-full"></span>
                  第二步：选择导出数据
                </h3>
                <div className="flex gap-2">
                   <button 
                      onClick={() => setSelectedColumns(COLUMN_CONFIG.map(c => c.key))}
                      className="text-xs text-[#007AFF] hover:underline"
                   >
                     全选
                   </button>
                   <span className="text-gray-300">|</span>
                   <button 
                      onClick={() => setSelectedColumns(['total', 'netTotal'])}
                      className="text-xs text-gray-500 hover:text-gray-800 hover:underline"
                   >
                     仅合计
                   </button>
                </div>
             </div>
             
             <div className="bg-[#F9F9FB] rounded-xl p-3 md:p-4 border border-gray-100">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                 {COLUMN_CONFIG.map((col) => (
                   <label 
                      key={col.key} 
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-xs md:text-sm
                        ${selectedColumns.includes(col.key) ? 'bg-white shadow-sm border border-gray-200' : 'hover:bg-gray-100'}
                      `}
                   >
                     <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                        selectedColumns.includes(col.key) 
                          ? 'bg-[#007AFF] border-[#007AFF]' 
                          : 'border-gray-300 bg-white'
                     }`}>
                        {selectedColumns.includes(col.key) && <Check size={12} className="text-white" />}
                     </div>
                     <input 
                       type="checkbox" 
                       className="hidden"
                       checked={selectedColumns.includes(col.key)}
                       onChange={() => toggleColumn(col.key)}
                     />
                     <span className={`truncate ${selectedColumns.includes(col.key) ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                       {col.label}
                     </span>
                   </label>
                 ))}
               </div>
             </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="px-4 py-2 md:px-5 md:py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleExport}
            className="px-4 py-2 md:px-5 md:py-2.5 rounded-xl text-sm font-medium bg-[#007AFF] text-white hover:bg-[#0066CC] shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <Download size={16} />
            确认导出
          </button>
        </div>

      </div>
    </div>
  );
};