export interface SalaryRecord {
  id: string;
  sequence: number; // 序号
  employeeName: string; // 姓名
  department: string; // 部门
  
  // Salary Components
  positionSalary: number; // 岗位工资
  baseSalary: number; // 基本工资
  retentionAllowance: number; // 保留津贴
  performanceSalary: number; // 绩效工资
  internalAuditFee: number; // 内审费
  certificateSubsidy: number; // 职业资格证书补贴
  annualLeavePay: number; // 未休年假工资
  publicityPerformance: number; // 宣传绩效
  branchAuditFee: number; // 分院内审费
  researchPerformance: number; // 科研绩效
  otherPerformanceAccounting: number; // 其他绩效（走账）
  other: number; // 其他

  // Totals
  total: number; // 合计 (Sum of all above)
  netTotal: number; // 实发合计 (Total - OtherPerformanceAccounting)

  month: string; // Format: YYYY-MM
}

export type ViewState = 'dashboard' | 'import';