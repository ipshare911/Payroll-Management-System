import { SalaryRecord } from '../types';

const API_ENDPOINT = '/api/salary';

class ApiDatabase {
  
  // 从 API 获取所有数据
  async getAllRecords(): Promise<SalaryRecord[]> {
    try {
      const res = await fetch(API_ENDPOINT);
      if (!res.ok) throw new Error('Failed to fetch records');
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("API Error:", error);
      return [];
    }
  }

  // 批量添加数据
  async addRecords(records: SalaryRecord[]): Promise<void> {
    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(records)
      });
      if (!res.ok) throw new Error('Failed to save records');
    } catch (error) {
      console.error("API Save Error:", error);
      throw error;
    }
  }

  // 更新单条数据
  async updateRecord(updatedRecord: SalaryRecord): Promise<void> {
    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRecord)
      });
      if (!res.ok) throw new Error('Failed to update record');
    } catch (error) {
      console.error("API Update Error:", error);
      throw error;
    }
  }
  
  // 删除数据
  async deleteRecord(id: string): Promise<void> {
    try {
      const res = await fetch(`${API_ENDPOINT}?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete record');
    } catch (error) {
      console.error("API Delete Error:", error);
      throw error;
    }
  }
}

export const db = new ApiDatabase();
