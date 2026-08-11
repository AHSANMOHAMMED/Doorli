"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { superAdminFetch } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setError('');

    try {
      // POST to standard API login
      const res = await superAdminFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.success && res.accessToken) {
        // Verify they are an admin
        if (res.user?.role !== 'admin') {
          throw new Error('Access denied. You are not a Super Admin.');
        }
        
        localStorage.setItem('doorli_superadmin_token', res.accessToken);
        router.push('/');
      } else {
        throw new Error('Invalid login response');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-6 relative bg-[#121212] text-[#e5e2e1]">
      <style>{`
        .login-card {
            background: #1E1E1E;
            border: 1px solid #333333;
            box-shadow: 0 8px 32px rgba(0,0,0,0.6);
            backdrop-filter: blur(8px);
        }
        .input-field {
            background-color: #2C2C2C;
            border: 1px solid transparent;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .input-field:focus {
            border-color: #98cdf2;
            box-shadow: 0 0 0 2px rgba(152, 205, 242, 0.2);
            outline: none;
        }
        .btn-primary {
            background-color: #E63946;
            transition: filter 0.2s ease, transform 0.1s ease;
        }
        .btn-primary:hover {
            filter: brightness(1.1);
        }
        .btn-primary:active {
            transform: scale(0.98);
        }
        .scanline {
            width: 100%;
            height: 100px;
            z-index: 5;
            background: linear-gradient(0deg, rgba(230, 57, 70, 0) 0%, rgba(230, 57, 70, 0.03) 50%, rgba(230, 57, 70, 0) 100%);
            opacity: 0.1;
            position: absolute;
            bottom: 100%;
            animation: scanline 8s linear infinite;
        }
        @keyframes scanline {
            0% { bottom: 100%; }
            100% { bottom: -100px; }
        }
        .glow-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #E63946;
            box-shadow: 0 0 10px #E63946;
        }
      `}</style>

      {/* Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="scanline"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#E63946 0.5px, transparent 0.5px)", backgroundSize: "24px 24px" }}></div>
      </div>

      {/* Main Content Shell */}
      <main className="w-full max-w-[440px] z-10 flex flex-col items-center">
        
        {/* Logo Branding */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#E63946] text-[40px]">security</span>
            <span className="text-2xl tracking-tighter text-white font-bold">Doorli <span className="font-light text-gray-400">Super Admin</span></span>
          </div>
        </div>

        {/* Login Container */}
        <section className="login-card w-full rounded-xl p-8 flex flex-col gap-6">
          <header className="text-center">
            <h1 className="text-xl text-white mb-2 font-semibold">Command Center Login</h1>
            <p className="text-sm text-gray-400">Restricted access for platform administrators only.</p>
          </header>

          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            {/* Email Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-400 tracking-wider" htmlFor="email">ADMIN EMAIL</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-[20px] transition-colors group-focus-within:text-white">mail</span>
                <input 
                  className="input-field w-full h-14 pl-12 pr-4 rounded-xl text-white placeholder:text-gray-600" 
                  id="email" 
                  placeholder="admin@doorli.com" 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-400 tracking-wider" htmlFor="password">ACCESS KEY</label>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-[20px] transition-colors group-focus-within:text-white">lock</span>
                <input 
                  className="input-field w-full h-14 pl-12 pr-12 rounded-xl text-white placeholder:text-gray-600" 
                  id="password" 
                  placeholder="••••••••••••" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors" 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            {/* Action Button */}
            <button 
              className={`w-full h-14 rounded-xl text-white font-bold flex items-center justify-center gap-2 mt-2 shadow-lg btn-primary ${isAuthenticating ? 'opacity-70 cursor-not-allowed' : ''}`} 
              type="submit"
              disabled={isAuthenticating}
            >
              <span>{isAuthenticating ? 'Authenticating...' : 'Log In'}</span>
              <span className={`material-symbols-outlined text-[20px] ${isAuthenticating ? 'animate-spin' : ''}`}>{isAuthenticating ? 'sync' : 'arrow_forward'}</span>
            </button>
          </form>

          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="h-px flex-1 bg-[#333333]"></div>
            <span className="text-xs text-gray-500 tracking-widest">ENCRYPTED SESSION</span>
            <div className="h-px flex-1 bg-[#333333]"></div>
          </div>
        </section>
      </main>
    </div>
  );
}
