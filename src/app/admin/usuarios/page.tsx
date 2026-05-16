import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format'
import type { Usuario } from '@/types/database'

async function getUsuarios(): Promise<Usuario[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('usuarios')
    .select('id, nome, email, role, plano, ultimo_acesso, created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  return (data ?? []) as Usuario[]
}

export default async function UsuariosAdminPage() {
  const usuarios = await getUsuarios()

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Usuários</h1>
        <p className="text-sm text-white/40 mt-1">{usuarios.length} usuários cadastrados</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Nome', 'Email', 'Plano', 'Role', 'Cadastro'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-white/30 font-medium uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u, i) => (
                <tr
                  key={u.id}
                  className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i === usuarios.length - 1 ? 'border-b-0' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.nome?.[0]?.toUpperCase() ?? 'U'}
                      </div>
                      <span className="text-sm text-white/80">{u.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-white/50">{u.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.plano === 'premium' ? 'purple' : u.plano === 'pro' ? 'cyan' : 'default'}>
                      {u.plano}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.role === 'admin' ? 'warning' : 'default'}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-white/30">{formatDate(u.created_at)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
