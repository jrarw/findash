'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { ICONS } from '@/lib/iconography'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleLogin() {
    if (!email || !senha) return
    setLoading(true)
    setErro('')

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      setErro('Email ou senha inválidos')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00E5FF] to-[#A855F7] flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20">
            <span className="text-white font-bold text-2xl">F</span>
          </div>
          <h1 className="text-2xl font-bold text-white">FinDash</h1>
          <p className="text-sm text-white/40 mt-1">Finanças pessoais inteligentes</p>
        </div>

        <Card className="p-6 space-y-4">
          <div>
            <label className="text-xs text-white/40 mb-2 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[#00E5FF]/40 transition-all"
              style={{ fontSize: '16px' }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <div>
            <label className="text-xs text-white/40 mb-2 block">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[#00E5FF]/40 transition-all"
              style={{ fontSize: '16px' }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {erro && (
            <p className="text-sm text-red-400 flex items-center gap-2">
              <Icon name={ICONS.status.danger} className="text-sm" />
              {erro}
            </p>
          )}

          <Button onClick={handleLogin} loading={loading} className="w-full" size="lg">
            Entrar
          </Button>
        </Card>

        <p className="text-center text-sm text-white/40 mt-4">
          Não tem conta?{' '}
          <Link href="/cadastro" className="text-[#00E5FF] hover:underline">
            Cadastre-se
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
