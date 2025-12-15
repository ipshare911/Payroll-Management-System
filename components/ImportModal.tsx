import React, { useState, useRef } from 'react';
import { SalaryRecord } from '../types';
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { db } from '../services/db';
import * as XLSX from 'xlsx';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);
    setSuccessMsg(null);
    
    // Important: Reset file input so checking the same file again triggers onChange
    const inputElement = event.target;
    
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      setError('请上传 Excel (.xlsx 或 .xls) 格式文件。');
      inputElement.value = '';
      return;
    }

    setProcessing(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Try to find a sheet with data
        let worksheet: XLSX.WorkSheet | null = null;
        for (const name of workbook.SheetNames) {
            const sheet = workbook.Sheets[name];
            // Simple check if sheet is not empty
            if (sheet['!ref']) {
                worksheet = sheet;
                break;
            }
        }

        if (!worksheet) {
            throw new Error("Excel 文件为空或无法读取。");
        }
        
        // Parse sheet to array of arrays to handle custom header rows (e.g. title in row 1)
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (!rawData || rawData.length === 0) {
          throw new Error('文件中没有解析出有效数据。');
        }

        // 1. Find Header Row
        let headerRowIndex = -1;
        const headerMap: Record<string, number> = {};
        
        // Look for '姓名' or '部门' to identify the header row
        for (let i = 0; i < Math.min(rawData.length, 10); i++) { // Check first 10 rows
            const row = rawData[i];
            const rowStr = row.map(c => String(c).trim());
            if (rowStr.includes('姓名') || rowStr.includes('部门')) {
                headerRowIndex = i;
                rowStr.forEach((cell, idx) => {
                    if (cell) headerMap[cell] = idx;
                });
                break;
            }
        }

        if (headerRowIndex === -1) {
             throw new Error("找不到表头行。请确保第一行或前几行包含 '姓名'、'部门' 等列名。");
        }

        const newRecords: SalaryRecord[] = [];
        const p = (val: any) => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
                const cleaned = val.replace(/,/g, '').trim();
                return parseFloat(cleaned) || 0;
            }
            return 0;
        };

        const getVal = (row: any[], key: string) => {
            const idx = headerMap[key];
            if (idx === undefined) return undefined;
            return row[idx];
        }

        // 2. Parse Data Rows
        rawData.slice(headerRowIndex + 1).forEach((row, index) => {
           if (!row || row.length === 0) return;

           const nameRaw = getVal(row, '姓名');
           if (!nameRaw) return; // Skip rows without name

           const name = String(nameRaw).trim();
           const deptRaw = getVal(row, '部门');
           const dept = deptRaw ? String(deptRaw).trim() : '其他';

           // Handle Month
           let month = '2025-01'; // Default
           const monthRaw = getVal(row, '月份');
           if (monthRaw) {
               // If it's an Excel serial date number (e.g. 45292)
               if (typeof monthRaw === 'number' && monthRaw > 20000) {
                   const date = XLSX.SSF.parse_date_code(monthRaw);
                   // Format as YYYY-MM
                   month = `${date.y}-${String(date.m).padStart(2, '0')}`;
               } else {
                   const mStr = String(monthRaw).trim();
                   // Try to match YYYY-MM or YYYY.MM or YYYY/MM
                   const match = mStr.match(/(\d{4})[-./](\d{1,2})/);
                   if (match) {
                       month = `${match[1]}-${match[2].padStart(2, '0')}`;
                   } else if (mStr.match(/^\d{1,2}$/)) {
                       // Just a month number, assume current year? Better strictly YYYY-MM for safety, 
                       // but let's assume if just '1' is passed, it might be 2025-01.
                       // For safety, let's stick to using what we found or default if invalid.
                       // If data is just '1月', try to parse.
                       const mNum = parseInt(mStr);
                       if (!isNaN(mNum) && mNum >= 1 && mNum <= 12) {
                           month = `2025-${String(mNum).padStart(2, '0')}`;
                       } else {
                           month = mStr; // Keep as is if we can't parse, though it might break filters
                       }
                   } else {
                       month = mStr;
                   }
               }
           }

           // Map fields
           // Note: We check for variations in headers
           const positionSalary = p(getVal(row, '岗位工资'));
           const baseSalary = p(getVal(row, '基本工资'));
           const retentionAllowance = p(getVal(row, '保留津贴'));
           const performanceSalary = p(getVal(row, '绩效工资'));
           const internalAuditFee = p(getVal(row, '内审费'));
           const certificateSubsidy = p(getVal(row, '职业资格证书补贴') ?? getVal(row, '证书补贴'));
           const annualLeavePay = p(getVal(row, '未休年假工资') ?? getVal(row, '年假工资') ?? getVal(row, '未休年假'));
           const publicityPerformance = p(getVal(row, '宣传绩效'));
           const branchAuditFee = p(getVal(row, '分院内审费') ?? getVal(row, '分院内审'));
           const researchPerformance = p(getVal(row, '科研绩效'));
           const otherPerformanceAccounting = p(getVal(row, '其他绩效（走账）') ?? getVal(row, '走账绩效'));
           const other = p(getVal(row, '其他'));

           // Recalculate Totals
           const total = positionSalary + baseSalary + retentionAllowance + performanceSalary + 
                        internalAuditFee + certificateSubsidy + annualLeavePay + publicityPerformance + 
                        branchAuditFee + researchPerformance + otherPerformanceAccounting + other;
           
           const netTotal = total - otherPerformanceAccounting;

           newRecords.push({
            id: crypto.randomUUID(),
            sequence: index + 1,
            employeeName: name,
            department: dept,
            month: month,
            positionSalary,
            baseSalary,
            retentionAllowance,
            performanceSalary,
            internalAuditFee,
            certificateSubsidy,
            annualLeavePay,
            publicityPerformance,
            branchAuditFee,
            researchPerformance,
            otherPerformanceAccounting,
            other,
            total,
            netTotal
          });
        });

        if (newRecords.length > 0) {
          db.addRecords(newRecords);
          setSuccessMsg(`成功导入 ${newRecords.length} 条数据。`);
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        } else {
          setError('未能识别任何有效数据行。请检查 Excel 内容。');
        }

      } catch (err: any) {
        console.error(err);
        setError(err.message || '解析文件失败。');
      } finally {
        setProcessing(false);
        // Reset the input value to allow re-uploading the same file if needed
        inputElement.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary-600" />
            导入工资数据 (Excel)
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-xs flex items-start gap-3">
             <FileText className="w-5 h-5 flex-shrink-0 mt-0.5" />
             <div>
               <p className="font-semibold mb-1">Excel 格式说明:</p>
               <p className="leading-relaxed">
                 1. 必须包含表头行，需含有 <b>姓名</b>、<b>部门</b> 列。<br/>
                 2. 推荐包含：岗位工资、基本工资、保留津贴、绩效工资、内审费 等。<br/>
                 3. 第一行可以是标题，系统会自动向下寻找表头。
               </p>
             </div>
          </div>

          <div className="flex flex-col items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">点击上传</span> 或拖拽 Excel 文件</p>
                <p className="text-xs text-gray-500">支持 .xlsx / .xls</p>
              </div>
              <input 
                  ref={fileInputRef}
                  type="file" 
                  className="hidden" 
                  accept=".xlsx, .xls" 
                  onChange={handleFileUpload} 
                  disabled={processing} 
              />
            </label>
          </div>

          {processing && (
            <div className="text-center text-primary-600 text-sm font-medium animate-pulse">
              正在处理数据，请稍候...
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {successMsg && (
            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-md">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};