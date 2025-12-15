import React, { useState } from 'react';
import { Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (success: boolean) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate network delay for better UX feeling
    setTimeout(() => {
      if (username === 'admin' && password === 'admin2025') {
        onLogin(true);
      } else {
        setError('用户名或密码错误');
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4 font-sans selection:bg-[#007AFF] selection:text-white">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 animate-in fade-in zoom-in duration-300">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#007AFF] to-[#5856D6] rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4 text-white">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-[#1D1D1F]">工资管理系统</h1>
          <p className="text-sm text-gray-500 mt-2">矿产资源分院 · 安全登录</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase ml-1">用户名</label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#007AFF] transition-colors" />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#F5F5F7] border-transparent focus:bg-white border focus:border-[#007AFF] rounded-xl py-3 pl-10 pr-4 text-sm transition-all outline-none"
                placeholder="请输入用户名"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase ml-1">密码</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#007AFF] transition-colors" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#F5F5F7] border-transparent focus:bg-white border focus:border-[#007AFF] rounded-xl py-3 pl-10 pr-4 text-sm transition-all outline-none"
                placeholder="请输入密码"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-xs text-center font-medium bg-red-50 py-2 rounded-lg animate-pulse">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[#007AFF] hover:bg-[#0062CC] text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                登录系统 <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-400">
            内部系统 · 请妥善保管账号密码
          </p>
        </div>
      </div>
    </div>
  );
};