import { GoogleGenAI } from "@google/genai";
import { SalaryRecord } from '../types';

export const analyzeSalaryData = async (records: SalaryRecord[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key 未配置。请在环境配置中添加 Google Gemini API Key 以使用智能分析功能。";
  }

  // Summarize data to avoid token limits
  const summary = records.reduce((acc, curr) => {
    if (!acc[curr.department]) {
      acc[curr.department] = { total: 0, count: 0 };
    }
    acc[curr.department].total += curr.netTotal;
    acc[curr.department].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const prompt = `
    作为一名人力资源数据分析专家，请根据以下矿产资源分院的工资概况数据生成一份简短的分析报告（中文）：
    
    数据概况: ${JSON.stringify(summary)}
    
    请包含以下内容：
    1. 各部门薪资支出对比。
    2. 如果有数据差异过大，请指出潜在原因（假设性）。
    3. 对下个月的预算规划给出一条建议。
    
    请保持语气专业、客观。
  `;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "无法生成分析报告。";
  } catch (error) {
    console.error("Gemini AI Analysis failed:", error);
    return "AI 分析服务暂时不可用，请稍后再试。";
  }
};