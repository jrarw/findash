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

export default function CadastroPage() {
  const router = useRouter()
  const supabase = createClient()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleCadastro() {
    if (!nome || !email || !senha) return
    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)
    setErro('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome }
      }
    })

    if (error) {
      setErro(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Cria registro na tabela usuarios
      await supabase.from('usuarios').insert({
        id: data.user.id,
        nome,
        email,
        role: 'user',
        plano: 'free',
      })

      router.push('/onboarding')
    }

    setLoading(false)
  }

  const inputClass = "min-h-[52px] w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[#00E5FF]/40 transition-all"

  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00E5FF] to-[#A855F7] flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">F</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Criar conta</h1>
          <p className="text-sm text-white/40 mt-1">Comece a controlar suas finanças</p>
        </div>

        <Card className="p-6 space-y-4">
          <div>
            <label className="text-xs text-white/40 mb-2 block">Nome completo</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Seu nome"
              className={inputClass}
              style={{ fontSize: '16px' }}
            />
          </div>

          <div>
            <label className="text-xs text-white/40 mb-2 block">Email</label>
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className={inputClass}
              style={{ fontSize: '16px' }}
            />
          </div>

          <div>
            <label className="text-xs text-white/40 mb-2 block">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className={inputClass}
              style={{ fontSize: '16px' }}
              onKeyDown={e => e.key === 'Enter' && handleCadastro()}
            />
          </div>

          {erro && (
            <p className="text-sm text-red-400 flex items-center gap-2">
              <Icon name={ICONS.status.danger} className="text-sm" />
              {erro}
            </p>
          )}

          <Button onClick={handleCadastro} loading={loading} className="w-full" size="lg">
            Criar conta
          </Button>
        </Card>

        <p className="text-center text-sm text-white/40 mt-4">
          Já tem conta?{' '}
          <Link href="/login" className="text-[#00E5FF] hover:underline">
            Entrar
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
