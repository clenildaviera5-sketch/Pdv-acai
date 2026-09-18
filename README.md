# PDV Açaí — Supabase + Login + sincronização

Esta versão adiciona:
- Login/cadastro com e-mail e senha via Supabase Auth.
- Sincronização dos dados do PDV na tabela `pdv_data`.
- RLS para cada usuário acessar somente o próprio registro.
- Persistência em nuvem entre celulares/computadores.
- Exportação de relatório em CSV, TXT e PNG.
- Funciona no navegador e mantém um cache local.

## 1. Banco Supabase
No SQL Editor do projeto, execute o SQL que criou a tabela `pdv_data` e as políticas RLS.

## 2. Chave
A versão pode receber as credenciais por variáveis Vite:
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY

Se essas variáveis não existirem, ao abrir o aplicativo ele exibirá uma tela para colar a Project URL e a Publishable key. A Publishable key pode ser usada no navegador; nunca use a Secret key no frontend.

## 3. Rodar
npm install
npm run dev

## 4. Publicar
Execute:
npm run build
Depois publique a pasta `dist` em um host estático. Em Vercel, configure as duas variáveis de ambiente antes do deploy.

## 5. Login
No Supabase > Authentication, mantenha "Allow new users to sign up" ativado. Para o primeiro teste, a confirmação de e-mail pode permanecer desativada.

## 6. Outro celular
Abra o endereço publicado, entre com o mesmo e-mail e senha e os dados serão carregados da nuvem.
