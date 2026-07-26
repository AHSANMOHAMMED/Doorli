"use client";

import React from 'react';

export default function DoorliSuperAdminDashboardPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      
{/*  Background Elements  */}
<div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
<div className="scanline"></div>
<div className="absolute top-0 left-0 w-full h-full opacity-[0.03]" ></div>
</div>
{/*  Main Content Shell  */}
<main className="w-full max-w-[440px] z-10 flex flex-col items-center">
{/*  Logo Branding  */}
<div className="mb-10 flex flex-col items-center gap-3">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-doorli-red text-[40px]" >security</span>
<span className="font-screen-title text-screen-title tracking-tighter text-on-surface">Doorli <span className="font-light text-outline">Super Admin</span></span>
</div>
</div>
{/*  Login Container  */}
<section className="login-card w-full rounded-xl p-xl flex flex-col gap-6">
<header className="text-center">
<h1 className="font-screen-title text-screen-title text-on-surface mb-2">Command Center Login</h1>
<p className="font-body-compact text-body-compact text-on-surface-variant opacity-80">Restricted access for platform administrators only.</p>
</header>
<form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
{/*  Email Input  */}
<div className="flex flex-col gap-2">
<label className="font-label-medium text-label-medium text-outline-variant" htmlFor="email">ADMIN EMAIL</label>
<div className="relative group">
<span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px] transition-colors group-focus-within:text-secondary">mail</span>
<input className="input-field w-full h-14 pl-12 pr-4 rounded-xl font-body-main text-body-main text-on-surface placeholder:text-muted" id="email" placeholder="admin@doorli.com" type="email" />
</div>
</div>
{/*  Password Input  */}
<div className="flex flex-col gap-2">
<div className="flex justify-between items-center">
<label className="font-label-medium text-label-medium text-outline-variant" htmlFor="password">ACCESS KEY</label>
<a className="font-caption text-caption text-secondary hover:underline" href="#">Forgot access key?</a>
</div>
<div className="relative group">
<span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px] transition-colors group-focus-within:text-secondary">lock</span>
<input className="input-field w-full h-14 pl-12 pr-12 rounded-xl font-body-main text-body-main text-on-surface placeholder:text-muted" id="password" placeholder="••••••••••••" type="password" />
<button className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors" type="button" onClick={() => {}}>
<span className="material-symbols-outlined text-[20px]">visibility</span>
</button>
</div>
</div>
{/*  MFA Reminder (Contextual Detail)  */}
<div className="bg-surface-container-high rounded-lg p-3 flex items-start gap-3 border border-surface-variant">
<span className="material-symbols-outlined text-secondary text-[20px]">info</span>
<p className="font-caption text-caption text-on-surface-variant leading-tight">Biometric or 2FA verification will be required after this step.</p>
</div>
{/*  Action Button  */}
<button className="btn-primary w-full h-14 rounded-xl text-white font-section-header text-section-header flex items-center justify-center gap-2 mt-2 shadow-lg shadow-doorli-red/20 shadow-doorli-red/40" type="submit">
<span className="">Log In</span>
<span className="material-symbols-outlined text-[20px]">arrow_forward</span>
</button>
</form>
<div className="flex items-center justify-center gap-4 mt-2">
<div className="h-px flex-1 bg-surface-variant"></div>
<span className="font-caption text-caption text-outline-variant">ENCRYPTED SESSION</span>
<div className="h-px flex-1 bg-surface-variant"></div>
</div>
<div className="flex justify-center items-center gap-6">
<div className="flex items-center gap-1.5">
<div className="glow-dot animate-pulse"></div>
<span className="font-caption text-caption text-on-surface-variant">Auth Server Up</span>
</div>
<div className="flex items-center gap-1.5 opacity-60">
<span className="material-symbols-outlined text-[16px] text-outline">language</span>
<span className="font-caption text-caption text-on-surface-variant">Region: US-East-1</span>
</div>
</div>
</section>
{/*  Footer Info  */}
<footer className="mt-xl flex flex-col items-center gap-2">
<div className="flex items-center gap-3">
<span className="font-caption text-caption text-outline tracking-wider uppercase text-on-surface-variant">Version 4.2.0</span>
<span className="w-1 h-1 rounded-full bg-outline-variant"></span>
<span className="font-caption text-caption text-doorli-red font-bold tracking-wider uppercase opacity-100">Production Environment</span>
</div>
<p className="font-caption text-caption text-outline-variant opacity-50 text-center">
                © 2024 Doorli Inc. Unauthorized monitoring and access attempt will be prosecuted under federal law.
            </p>
</footer>
</main>




    </div>
  );
}
