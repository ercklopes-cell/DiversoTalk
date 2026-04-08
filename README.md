# DiversoTalk — Deploy Guide

## Estrutura do Projeto
```
diversotalk-app/
├── index.html              ← App principal (SPA)
├── public/
│   └── convite/
│       └── index.html      ← Página de convite (/convite/:token)
└── vercel.json             ← Rewrites para SPA + rota de convite
```

## Deploy na Vercel

### Opção 1: Deploy via CLI
```bash
npm i -g vercel
cd diversotalk-app
vercel --prod
```

### Opção 2: Deploy via GitHub
1. Crie um repositório no GitHub e faça push deste diretório
2. Acesse https://vercel.com/new
3. Importe o repositório
4. **Build settings:** Framework = Other, Output Directory = `.` (raiz)
5. Clique em Deploy

### Opção 3: Drag & Drop
1. Acesse https://vercel.com/new
2. Arraste a pasta `diversotalk-app` para a área de upload

---

## Configurações Necessárias no Supabase

### 1. Ativar Google Auth
1. Acesse: https://supabase.com/dashboard/project/lmwjkmtdyalqvloudlla/auth/providers
2. Habilite **Google**
3. Configure OAuth no Google Cloud Console:
   - Crie credenciais em https://console.cloud.google.com
   - URI de redirecionamento: `https://lmwjkmtdyalqvloudlla.supabase.co/auth/v1/callback`
4. Cole o Client ID e Client Secret no Supabase

### 2. Configurar URL do Site
1. Acesse: https://supabase.com/dashboard/project/lmwjkmtdyalqvloudlla/auth/url-configuration
2. **Site URL:** `https://diversotalk.vercel.app`
3. **Redirect URLs (adicionar):**
   - `https://diversotalk.vercel.app`
   - `https://diversotalk.vercel.app/convite/*`
   - `http://localhost:3000` (para desenvolvimento local)

### 3. Configurar API da Anthropic (para IA de Layout)
O app usa a API da Anthropic diretamente do frontend.
**Para produção**, crie um Edge Function no Supabase para proteger a chave:

```typescript
// supabase/functions/ai-layout/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { image, mediaType } = await req.json()
  
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      // ... system prompt e messages
    })
  })
  
  const data = await resp.json()
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

---

## Funcionalidades Implementadas

| Funcionalidade | Status |
|---|---|
| Login Google (Supabase Auth) | ✅ |
| Perfis com cargos e permissões | ✅ |
| Kanban 5 colunas (Realtime) | ✅ |
| Feed Geral (Realtime) | ✅ |
| PTT com Web Speech API | ✅ |
| Separação Supervisor vs Funcionário | ✅ |
| Foto de evidência (Storage) | ✅ |
| Criação de tarefas (supervisor) | ✅ |
| Gerar convites com token | ✅ |
| Usar convite via URL | ✅ |
| IA Leitura de Layout (Claude) | ✅ |
| Dashboard "Olho de Águia" | ✅ |
| RLS — Row Level Security | ✅ |
| Mobile-first, botões 80px+ | ✅ |

---

## Projeto Supabase
- **URL:** https://lmwjkmtdyalqvloudlla.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/lmwjkmtdyalqvloudlla
- **Tabelas criadas:** dt_projetos, dt_perfis, dt_tarefas, dt_feed_geral, dt_comentarios, dt_convites
- **Storage bucket:** diversotalk (público, fotos de evidência)
- **Functions SQL:** dt_usar_convite, dt_criar_convite, dt_handle_new_user

## Projeto Demo
Um projeto de demonstração foi criado automaticamente:
- **ID:** a0000000-0000-0000-0000-000000000001
- **Nome:** Show SP 2025
- Todos os novos usuários entram neste projeto com cargo `staff` por padrão
- O supervisor pode gerar convites para promover usuários a outros cargos
