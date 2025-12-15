import { SalaryRecord } from '../types';

// Updated version to clear previous data
const DB_KEY = 'minerals_pay_db_v4_clean'; 

class LocalDatabase {
  private data: SalaryRecord[] = [];

  constructor() {
    this.load();
    // Removed automatic seeding to allow user to test with their own data
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