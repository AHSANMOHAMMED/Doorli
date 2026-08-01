import type { Metadata } from 'next'
import RegisterClient from './RegisterClient'

export const metadata: Metadata = {
  title: 'Create Account - Doorli ERP',
  description: 'Create your free Doorli ERP account. AI-powered POS & business management with unlimited users. Free forever — no credit card needed.',
  keywords: ['register', 'create account', 'free POS', 'Doorli ERP', 'sign up'],
  openGraph: {
    title: 'Create Free Account | Doorli ERP',
    description: 'Your first company is free forever. AI-powered POS with unlimited users, all features included. No credit card needed.',
    images: [{ url: '/og/home', width: 1200, height: 630 }],
  },
}

export default function RegisterPage() {
  return <RegisterClient />
}
