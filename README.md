# Team Trainer App

Aplicação para gestão de equipas de treino.

---

## Setup Inicial

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Supabase

#### Passo 1: Criar conta no Supabase
- Vai para [supabase.com](https://supabase.com)
- Cria uma nova conta
- Cria um novo projeto

#### Passo 2: Obter credenciais
- Na dashboard do Supabase, vai a "Project Settings" → "API"
- Copia a "Project URL" e a "anon public" key

#### Passo 3: Configurar arquivo .env
- Copia `.env.example` para `.env`
- Preenche as variáveis:
  ```
  VITE_SUPABASE_URL=your_project_url
  VITE_SUPABASE_KEY=your_anon_key
  ```

#### Passo 4: Setup da Base de Dados
No Supabase, vai a "SQL Editor" e executa este script para criar as tabelas:

```sql
-- Tabela de Utilizadores (gerida pelo Supabase Auth)
-- Supabase cria automaticamente

-- Tabela de Equipas
CREATE TABLE equipas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treinador_id UUID NOT NULL REFERENCES auth.users(id),
  nome VARCHAR(255) NOT NULL,
  escalao VARCHAR(100) NOT NULL,
  criado_em TIMESTAMP DEFAULT now(),
  atualizado_em TIMESTAMP DEFAULT now()
);

-- Tabela de Dias de Treino (configuração)
CREATE TABLE dias_treino (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipa_id UUID NOT NULL REFERENCES equipas(id),
  dia_semana INT NOT NULL (0=seg, 1=ter, 2=qua, 3=qui, 4=sex, 5=sab, 6=dom),
  hora TIME NOT NULL,
  criado_em TIMESTAMP DEFAULT now()
);

-- Tabela de Jogadores
CREATE TABLE jogadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipa_id UUID NOT NULL REFERENCES equipas(id),
  nome VARCHAR(255) NOT NULL,
  numero INT NOT NULL,
  posicao VARCHAR(100),
  criado_em TIMESTAMP DEFAULT now()
);

-- Tabela de Presenças
CREATE TABLE presencas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jogador_id UUID NOT NULL REFERENCES jogadores(id),
  equipa_id UUID NOT NULL REFERENCES equipas(id),
  data DATE NOT NULL,
  presente BOOLEAN NOT NULL,
  notas TEXT,
  criado_em TIMESTAMP DEFAULT now()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE equipas ENABLE ROW LEVEL SECURITY;
ALTER TABLE dias_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE jogadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE presencas ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Utilizadores veem suas equipas" ON equipas
  FOR SELECT USING (auth.uid() = treinador_id);

CREATE POLICY "Utilizadores criam suas equipas" ON equipas
  FOR INSERT WITH CHECK (auth.uid() = treinador_id);
```

### 3. Executar a App

```bash
npm run dev
```

A app vai abrir em `http://localhost:3000`

---

## Estrutura do Projeto

```
src/
├── components/        # Componentes React
│   └── Login.jsx
├── hooks/             # Hooks customizados
│   └── useAuth.js
├── lib/               # Configurações
│   └── supabase.js
├── index.css          # Estilos globais
├── App.jsx            # Componente principal
└── main.jsx           # Entrada do React
```

---

## User Stories Implementadas

- [x] US 1: Login
- [ ] US 2: Criar Equipa
- [ ] US 3: Dashboard

---

## Tecnologias

- React 18
- Vite
- Tailwind CSS
- Supabase
