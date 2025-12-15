import { SalaryRecord } from '../types';

// Updated version to clear previous data
const DB_KEY = 'minerals_pay_db_v4_clean'; 

class LocalDatabase {
  private data: SalaryRecord[] = [];

  constructor() {
    this.load();
    // If no data exists, load some sample data
    if (this.data.length === 0) {
      this.seed();
    }
  }

  private load() {
    const stored = localStorage.getItem(DB_KEY);
    if (stored) {
      try {
        this.data = JSON.parse(stored);
      } catch (e) {
        console.error("Database corruption", e);
        this.data = [];
      }
    }
  }

  private save() {
    localStorage.setItem(DB_KEY, JSON.stringify(this.data));
  }

  private seed() {
    const sampleRecords: SalaryRecord[] = [
      {
        id: 'sample-1',
        sequence: 1,
        employeeName: '张三',
        department: '基础地质所',
        month: '2025-01',
        positionSalary: 5200,
        baseSalary: 3500,
        retentionAllowance: 1200,
        performanceSalary: 4800,
        internalAuditFee: 0,
        certificateSubsidy: 500,
        annualLeavePay: 0,
        publicityPerformance: 200,
        branchAuditFee: 0,
        researchPerformance: 1500,
        otherPerformanceAccounting: 0,
        other: 0,
        total: 16900,
        netTotal: 16900
      },
      {
        id: 'sample-2',
        sequence: 2,
        employeeName: '李四',
        department: '规划所',
        month: '2025-01',
        positionSalary: 5500,
        baseSalary: 3800,
        retentionAllowance: 1200,
        performanceSalary: 5200,
        internalAuditFee: 500,
        certificateSubsidy: 0,
        annualLeavePay: 0,
        publicityPerformance: 0,
        branchAuditFee: 300,
        researchPerformance: 2000,
        otherPerformanceAccounting: 5000, // 走账
        other: 0,
        total: 23500,
        netTotal: 18500
      },
      {
        id: 'sample-3',
        sequence: 3,
        employeeName: '王五',
        department: '储量所',
        month: '2025-02',
        positionSalary: 4800,
        baseSalary: 3200,
        retentionAllowance: 1000,
        performanceSalary: 4500,
        internalAuditFee: 0,
        certificateSubsidy: 500,
        annualLeavePay: 2000,
        publicityPerformance: 100,
        branchAuditFee: 0,
        researchPerformance: 1000,
        otherPerformanceAccounting: 0,
        other: 200,
        total: 17300,
        netTotal: 17300
      }
    ];
    this.data = sampleRecords;
    this.save();
  }

  getAllRecords(): SalaryRecord[] {
    return [...this.data];
  }

  addRecords(records: SalaryRecord[]) {
    this.data = [...this.data, ...records];
    this.save();
  }

  updateRecord(updatedRecord: SalaryRecord) {
    this.data = this.data.map(r => r.id === updatedRecord.id ? updatedRecord : r);
    this.save();
  }
  
  deleteRecord(id: string) {
    this.data = this.data.filter(r => r.id !== id);
    this.save();
  }
}

export const db = new LocalDatabase();