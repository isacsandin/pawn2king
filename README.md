# Pawn2King

Sistema web para partidas casuais de xadrez 1v1 em tempo real. Oferece matchmaking automático, salas privadas, relógio, histórico e análise pós-partida.

## Stack

| Camada | Tecnologia |
|---|---|
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS 4 |
| **Estado** | Zustand + React Query |
| **Backend** | Node 22 + Express + TypeScript |
| **Tempo real** | Socket.IO |
| **Validação** | chess.js (server-authoritative) |
| **ORM** | Prisma 6 |
| **Banco** | PostgreSQL 16 (Docker) |
| **Cache/Fila** | Redis 7 (Docker) |
| **Auth** | JWT + bcrypt |

## Pré-requisitos

- Node.js **22.13.0** ou superior
- Docker Desktop (ou Docker Compose standalone)
- NPM

## Setup

```bash
# 1. Subir PostgreSQL e Redis
docker compose up -d

# 2. Instalar dependências do servidor
cd server
npm install

# 3. Rodar migrations do Prisma
npx prisma migrate dev

# 4. Gerar Prisma Client
npx prisma generate

# 5. Instalar dependências do cliente
cd ../client
npm install

# 6. (Opcional) Gerar .env do servidor
#    O arquivo server/.env já existe com valores padrão de desenvolvimento:
#    DATABASE_URL="postgresql://pawn2king:pawn2king_dev@localhost:5432/pawn2king?schema=public"
#    JWT_SECRET="pawn2king-dev-secret-key-change-in-production"
```

## Executar

Em dois terminais separados:

```bash
# Terminal 1 — Servidor (http://localhost:3001)
cd server
npm run dev

# Terminal 2 — Cliente (http://localhost:5173)
cd client
npm run dev
```

O cliente Vite faz proxy de `/api` e `/socket.io` para o servidor. Para acessar de outras máquinas na rede, use o IP da máquina (ex: `http://192.168.x.x:5173`).

## Scripts

### Servidor (`server/`)

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia com hot-reload (tsx) |
| `npm run build` | Compila TypeScript |
| `npm run db:migrate` | Cria/atualiza migrations |
| `npm run db:push` | Sincroniza schema sem migration |
| `npm run db:studio` | Abre Prisma Studio |

### Cliente (`client/`)

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia Vite dev server |
| `npm run build` | Compila e empacota para produção |

## Funcionalidades

- **Autenticação**: registro, login, modo convidado (token JWT)
- **Lobby**: jogar rápido (matchmaking), criar sala privada, entrar por código
- **Matchmaking**: fila com matching por rating (tolerância aumenta com o tempo)
- **Controles de tempo**: Blitz 3+0, 5+0 | Rápido 10+0, 15+10 | Clássico 30+0
- **Tabuleiro**: clique ou drag-and-drop, SVGs sólidos, destaques, promoção
- **Tempo real**: relógio, desistência, oferta/aceite/recusa de empate
- **Reconexão**: timeout de 30s com notificação ao oponente
- **Histórico**: partidas anteriores paginadas, exportar PGN
- **Análise**: replay jogada-a-jogada com navegação e gráfico de material

## Estrutura

```
pawn2king/
├── .spec/spec.md       # Especificação completa do sistema
├── docker-compose.yml  # PostgreSQL 16 + Redis 7
├── server/
│   ├── src/
│   │   ├── index.ts           # Entrypoint (Express + Socket.IO)
│   │   ├── config/            # Database, Redis, constantes
│   │   ├── middleware/        # Auth middleware
│   │   ├── routes/            # REST (auth, profile, games)
│   │   ├── services/          # Game, matchmaking lógica
│   │   └── sockets/           # Handlers Socket.IO
│   ├── prisma/schema.prisma
│   └── package.json
├── client/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── components/        # ChessBoard, Clock, MoveList, etc.
│   │   ├── pages/             # Login, Lobby, Game, History, Analysis
│   │   ├── stores/            # Zustand (auth, game)
│   │   └── services/          # Axios, Socket.IO client
│   ├── vite.config.ts
│   └── package.json
```

## Variáveis de Ambiente (`server/.env`)

```
DATABASE_URL="postgresql://pawn2king:pawn2king_dev@localhost:5432/pawn2king?schema=public"
JWT_SECRET="pawn2king-dev-secret-key-change-in-production"
```
