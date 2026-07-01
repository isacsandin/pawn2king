# Pawn2King — Especificação do Sistema

Sistema web para jogos casuais de xadrez 1v1 em tempo real.

---

## 1. Visão Geral

Plataforma web focada em partidas casuais de xadrez. Sem cadastro obrigatório para partidas rápidas (modo convidado), mas com opção de registro para histórico, estatísticas e análise pós-partida.

**Público-alvo:** Jogadores casuais que querem partidas rápidas sem compromisso, sem necessidade de instalar aplicativos ou criar conta.

---

## 2. Tech Stack

| Camada | Tecnologia | Versão |
|---|---|---|
| **Frontend** | React + TypeScript + Vite + Tailwind CSS | React 18 |
| **Gerenciamento de estado** | Zustand + React Query | - |
| **Backend** | Node.js + TypeScript + Express | Node 22 |
| **Tempo real** | Socket.IO | v4 |
| **Validação de xadrez** | chess.js (server-authoritative) | - |
| **Análise** | Material graph (atual) / Stockfish WASM (planejado) | - |
| **ORM** | Prisma | - |
| **Banco principal** | PostgreSQL 16 (Docker) | - |
| **Cache / Sessão / Fila** | Redis 7 (Docker) | - |
| **Autenticação** | JWT (bcrypt + jsonwebtoken) | - |

---

## 3. Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        Cliente (React)                       │
│  ┌─────────┐  ┌──────────┐  ┌──────┐  ┌──────────────────┐  │
│  │ Lobby   │  │ Jogo     │  │Histor│  │ Análise/Replay   │  │
│  │ Página  │  │ Tabuleiro│  │órico │  │ Gráfico Stockfish │  │
│  └─────────┘  └──────────┘  └──────┘  └──────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │          Socket.IO Client + Axios (REST)              │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────┬───────────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │  HTTP REST              │  WebSocket (Socket.IO)
          ▼                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Servidor (Express)                        │
│                                                              │
│  ┌──────────┐  ┌───────────┐  ┌────────────┐               │
│  │ Auth     │  │ Game      │  │ Matchmaking│               │
│  │ Service  │  │ Service   │  │ Service    │               │
│  └──────────┘  └───────────┘  └────────────┘               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  chess.js (validação autoritativa de movimentos)     │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Prisma ORM          │  ioredis (Redis client)       │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────┬──────────────────────────┬────────────────┘
                   │                          │
                   ▼                          ▼
           ┌────────────┐            ┌────────────┐
           │ PostgreSQL │            │   Redis    │
           │            │            │            │
           │ • Users    │            │ • Sessões  │
           │ • Games    │            │ • Fila     │
           │ • Moves    │            │   match    │
           └────────────┘            │ • Cache    │
                                     └────────────┘
```

### Princípios arquiteturais

- **Server-authoritative**: toda validação de movimento ocorre no servidor via `chess.js`. O cliente nunca decide se um movimento é válido.
- **Event-driven**: Socket.IO para comunicação em tempo real (matchmaking, partidas ao vivo).
- **Stateless REST** para autenticação, perfil e histórico.
- **Contêineres**: PostgreSQL e Redis rodam via Docker Compose; a aplicação Node roda localmente em desenvolvimento.

---

## 4. Requisitos Funcionais

### 4.1 Autenticação e Perfil

| ID | Requisito | Prioridade |
|---|---|---|
| RF01 | Registrar conta com email e senha | Alta |
| RF02 | Fazer login com email e senha | Alta |
| RF03 | Jogar como convidado sem cadastro (token temporário) | Alta |
| RF04 | Editar nickname e avatar | Média |
| RF05 | Visualizar perfil público (nickname, rating, estatísticas) | Média |
| RF06 | Recuperar senha | Baixa |

### 4.2 Lobby

| ID | Requisito | Prioridade |
|---|---|---|
| RF07 | Tela inicial com opções: Jogar Rápido, Criar Sala, Entrar por Código | Alta |
| RF08 | Criar sala privada com código de 6 caracteres para compartilhar | Alta |
| RF09 | Entrar em sala privada via código | Alta |
| RF10 | Selecionar controle de tempo antes de entrar na fila | Alta |
| RF11 | Visualizar rating próprio na tela de lobby | Média |

### 4.3 Matchmaking

| ID | Requisito | Prioridade |
|---|---|---|
| RF12 | Fila de espera com busca automática de oponente | Alta |
| RF13 | Matching por rating aproximado (tolerância aumenta com o tempo de espera) | Alta |
| RF14 | Cancelar busca a qualquer momento | Alta |
| RF15 | Feedback visual da busca (tempo de espera, posição na fila) | Média |

### 4.4 Partida em Tempo Real

| ID | Requisito | Prioridade |
|---|---|---|
| RF16 | Tabuleiro interativo com arrastar e soltar peças | Alta |
| RF17 | Destaque de movimentos válidos ao selecionar peça | Alta |
| RF18 | Indicador de turno (brancas/pretas) | Alta |
| RF19 | Relógio com contagem regressiva para ambos os jogadores | Alta |
| RF20 | Desistir da partida | Alta |
| RF21 | Oferecer, aceitar e recusar empate | Alta |
| RF22 | Detecção de xeque e xeque-mate | Alta |
| RF23 | Detecção de afogamento (stalemate) | Alta |
| RF24 | Detecção de repetição de posição (três repetições) | Média |
| RF25 | Detecção de regra dos 50 movimentos | Média |
| RF26 | Notação dos movimentos (álgebra padrão) em painel lateral | Alta |
| RF27 | Indicador de capturas (peças capturadas de cada lado) | Média |
| RF28 | Promoção de peão com seletor de peça | Alta |
| RF29 | Roque (curto e longo) | Alta |
| RF30 | En passant | Alta |

### 4.5 Controle de Tempo

| ID | Requisito | Prioridade |
|---|---|---|
| RF31 | Modo Blitz: 3+0 e 5+0 | Alta |
| RF32 | Modo Rápido: 10+0 e 15+10 | Alta |
| RF33 | Modo Clássico: 30+0 | Alta |
| RF34 | Incremento opcional por movimento (Fischer) | Média |
| RF35 | Relógio pausa automaticamente fora do turno do jogador | Alta |
| RF36 | Jogador perde por tempo se relógio zerar | Alta |

### 4.6 Histórico

| ID | Requisito | Prioridade | Status |
|---|---|---|---|
| RF37 | Lista paginada de partidas anteriores | Alta | ✅ |
| RF38 | Filtros por resultado (vitória, derrota, empate) | Média | 📅 |
| RF39 | Exportar partida em formato PGN | Alta | ✅ |
| RF40 | Visualizar detalhes da partida (oponente, data, controle de tempo) | Alta | ✅ |

### 4.7 Replay e Análise Pós-Partida

| ID | Requisito | Prioridade | Status |
|---|---|---|---|
| RF41 | Navegação jogada-a-jogada (anterior/próximo/início/fim) | Alta | ✅ |
| RF42 | Tabuleiro sincronizado com o movimento atual | Alta | ✅ |
| RF43 | Gráfico de material (diferença de peças por movimento) | Alta | ✅ |
| RF43b | Gráfico de avaliação com Stockfish WASM (substitui material graph) | Alta | 📅 Planejado |
| RF44 | Destaque da melhor jogada em cada posição | Média | 📅 Planejado |
| RF45 | Indicador de erro/impressão (blunders, mistakes, inaccuracies) | Baixa | 📅 Planejado |

---

## 5. Requisitos Não Funcionais

| ID | Requisito | Descrição |
|---|---|---|
| RNF01 | Responsivo | Funciona em desktop e mobile (largura mínima 360px) |
| RNF02 | Latência | Movimentos refletidos em < 200ms (ideal < 100ms) |
| RNF03 | Consistência | Servidor é autoridade final — cliente nunca confia em si mesmo |
| RNF04 | Segurança | Senhas hash com bcrypt, JWT com expiração, validação de inputs |
| RNF05 | Disponibilidade | Sistema tolerante a desconexões: reconexão automática via Socket.IO com timeout de 30s |
| RNF06 | Acessibilidade | Tabuleiro navegável por teclado, contraste adequado |
| RNF07 | Performance | Stockfish WASM roda em Web Worker para não travar a UI |

---

## 6. Modelagem de Dados

### 6.1 Entidades (Prisma Schema)

```prisma
enum GameStatus {
  WAITING
  ACTIVE
  ABORTED
  WHITE_WIN
  BLACK_WIN
  DRAW
  STALEMATE
  TIME_WHITE
  TIME_BLACK
}

enum TimeControl {
  BLITZ_3_0
  BLITZ_5_0
  RAPID_10_0
  RAPID_15_10
  CLASSIC_30_0
}

model User {
  id        String   @id @default(uuid())
  nickname  String   @unique
  email     String   @unique
  password  String   // bcrypt hash
  rating    Int      @default(1200)
  avatarUrl String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  gamesAsWhite Game[] @relation("WhitePlayer")
  gamesAsBlack Game[] @relation("BlackPlayer")
}

model Guest {
  id        String   @id @default(uuid())
  nickname  String
  token     String   @unique
  createdAt DateTime @default(now())
  expiresAt DateTime
}

model Game {
  id           String      @id @default(uuid())
  whiteId      String?
  blackId      String?
  white        User?       @relation("WhitePlayer", fields: [whiteId], references: [id])
  black        User?       @relation("BlackPlayer", fields: [blackId], references: [id])
  whiteRating  Int?
  blackRating  Int?
  status       GameStatus  @default(WAITING)
  timeControl  TimeControl
  pgn          String?
  result       String?     // "1-0", "0-1", "½-½"
  startedAt    DateTime?
  finishedAt   DateTime?
  createdAt    DateTime    @default(now())

  moves     Move[]
  roomCode  String?    @unique // para salas privadas
}

model Move {
  id         String   @id @default(uuid())
  gameId     String
  game       Game     @relation(fields: [gameId], references: [id])
  moveNumber Int
  from       String   // ex: "e2"
  to         String   // ex: "e4"
  promotion  String?  // "q", "r", "b", "n"
  fen        String
  san        String   // notação algébrica padrão
  clockWhite Int?     // milissegundos restantes no relógio das brancas
  clockBlack Int?     // milissegundos restantes no relógio das pretas
  createdAt  DateTime @default(now())
}
```

### 6.2 Redis (Dados temporários)

```json
// Matchmaking Queue (Sorted Set por timeControl)
queue:{timeControl} => score: timestamp, member: { socketId, userId, rating }

// Guest Sessions
guest:{token} => { nickname, expiresAt }
```

---

## 7. API REST

### 7.1 Autenticação

| Método | Rota | Corpo | Resposta | Auth |
|---|---|---|---|---|
| POST | `/api/auth/register` | `{ nickname, email, password }` | `{ token, user }` | Não |
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user }` | Não |
| POST | `/api/auth/guest` | `{ nickname }` | `{ token, guest }` | Não |
| GET | `/api/auth/me` | - | `{ user }` | JWT |

### 7.2 Perfil

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/profile/:id` | Perfil público com estatísticas |
| PATCH | `/api/profile` | Atualizar nickname/avatar (autenticado) |

### 7.3 Partidas

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/games?page=&limit=&status=` | Histórico paginado |
| GET | `/api/games/:id` | Detalhes da partida + movimentos |
| GET | `/api/games/:id/pgn` | Exportar PGN |

---

## 8. Eventos Socket.IO

### 8.1 Conexão

```
Namespace: /
Auth: { token: string } (opcional para convidados)
```

### 8.2 Eventos do Cliente → Servidor

| Evento | Payload | Descrição |
|---|---|---|
| `matchmaking:join` | `{ timeControl }` | Entrar na fila |
| `matchmaking:leave` | - | Sair da fila |
| `game:move` | `{ gameId, from, to, promotion? }` | Fazer movimento |
| `game:resign` | `{ gameId }` | Desistir |
| `game:draw-offer` | `{ gameId }` | Oferecer empate |
| `game:draw-response` | `{ gameId, accept: boolean }` | Aceitar/recusar empate |
| `game:create-room` | `{ timeControl }` | Criar sala privada |
| `game:join-room` | `{ roomCode }` | Entrar em sala privada |

### 8.3 Eventos do Servidor → Cliente

| Evento | Payload | Descrição |
|---|---|---|
| `matchmaking:queue-update` | `{ position, estimatedWait }` | Atualização da fila |
| `matchmaking:found` | `{ gameId, opponent, color, timeControl }` | Oponente encontrado |
| `game:start` | `{ gameId, fen, clock, timeControl, color, resumed? }` | Partida iniciada (ou reconectada) |
| `game:move` | `{ gameId, move, fen, clock, status? }` | Movimento validado |
| `game:over` | `{ gameId, result, reason, pgn }` | Partida encerrada |
| `game:error` | `{ message, code }` | Erro (movimento inválido, etc.) |
| `game:draw-offer` | `{ from }` | Oponente ofereceu empate |
| `game:draw-declined` | `{ from }` | Oponente recusou empate |
| `game:opponent-disconnected` | `{ timeLeft }` | Oponente desconectou |
| `game:opponent-reconnected` | - | Oponente reconectou |
| `game:room-created` | `{ roomCode }` | Sala privada criada |

---

## 9. Fluxos Principais

### 9.1 Fluxo de Partida Rápida (Matchmaking)

```
Jogador                    Servidor                    Oponente
   │                          │                          │
   │── matchmaking:join ─────►│                          │
   │                          ├── entra na fila Redis    │
   │◄── matchmaking:queue-upd │                          │
   │                          │                          │
   │                          ├── busca oponente por     │
   │                          │    rating aproximado     │
   │                          │                          │
   │                          │◄── matchmaking:join ─────│
   │                          │                          │
   │◄── matchmaking:found ────┤── matchmaking:found ────►│
   │                          │                          │
   │                          ├── cria Game no banco     │
   │                          ├── associa socket IDs     │
   │                          │                          │
   │◄── game:start ──────────┤── game:start ───────────►│
   │                          │                          │
   │── game:move ────────────►│                          │
   │                          ├── chess.js valida        │
   │                          ├── salva move no banco    │
   │◄── game:move ───────────┤── game:move ────────────►│
```

### 9.2 Fluxo de Sala Privada

```
Jogador A                    Servidor                   Jogador B
   │                          │                          │
   │── game:create-room ─────►│                          │
   │◄── game:room-created ────┤                          │
   │   (código: ABC123)       │                          │
   │                          │                          │
   │(compartilha código)      │                          │
   │                          │                          │
   │                          │◄── game:join-room ──────│
   │                          │   (código: ABC123)      │
   │                          │                          │
   │◄── game:start ──────────┤── game:start ───────────►│
```

### 9.3 Fluxo de Desconexão

```
Jogador A               Servidor               Jogador B
   │                        │                        │
   │── (desconecta) ───────►│                        │
   │                        ├── inicia timer de      │
   │                        │    reconexão (30s)     │
   │                        ├── notifica oponente    │
   │                        │                        │
   │◄── game:opponent-discon│── game:opp-discon ────►│
   │                        │                        │
   │── (reconecta) ────────►│                        │
   │                        ├── reassocia socket     │
   │                        ├── reenvia estado via   │
   │                        │    game:start (resumed)│
   │◄── game:opponent-recon │── game:opp-recon ─────►│
   │                        │                        │
   │  (ou após 30s)         │                        │
   │                        ├── declara vitória do   │
   │                        │    oponente por WO     │
   │                        ├── game:over ──────────►│
```

---

## 10. Regras de Negócio (Xadrez)

- Toda validação de movimento é feita no servidor com `chess.js`.
- O cliente envia `{ from, to, promotion? }` e o servidor responde com o SAN e FEN resultantes.
- O servidor rejeita movimentos que:
  - Não são turno do jogador
  - São inválidos segundo as regras do xadrez
  - Colocam o próprio rei em xeque
- O servidor detecta automaticamente: xeque-mate, afogamento, repetição (3x), regra dos 50 movimentos, material insuficiente.
- O relógio é gerenciado pelo servidor (broadcast a cada segundo ou por evento de movimento).

---

## 11. UX/UI — Telas

### 11.1 Tela de Login / Registro
- Abas "Entrar" / "Cadastrar"
- Campo de nickname para modo convidado
- Botão "Jogar como Convidado"

### 11.2 Lobby
- Seleção de controle de tempo (Blitz / Rápido / Clássico)
- Botão "Jogar Rápido" → entra na fila
- Botão "Criar Sala" → gera código privado
- Campo "Código da Sala" + botão "Entrar"
- Exibição do rating e nickname do jogador

### 11.3 Matchmaking (Tela de Busca)
- Animação de busca
- Tempo de espera
- Botão "Cancelar"
- Ao encontrar: transição para tela de jogo

### 11.4 Jogo
- Tabuleiro centralizado (renderização SVG ou grid CSS)
- Relógios acima/abaixo do tabuleiro
- Painel lateral com notação dos movimentos
- Botões: Desistir, Oferecer Empate
- Indicador de capturas
- Modal de promoção de peão

### 11.5 Tela de Resultado
- Resultado (vitória/derrota/empate) + motivo
- Botões: "Jogar Novamente", "Ver Análise", "Voltar ao Lobby"

### 11.6 Histórico
- Lista vertical com: oponente, resultado, data, controle de tempo
- Paginação
- Clique para ver detalhes ou exportar PGN

### 11.7 Análise / Replay
- Tabuleiro com navegação (◀ ▶ ⏮ ⏭)
- Notação dos movimentos sincronizada
- Gráfico de material (diferença de peças por movimento) — atual
- Gráfico de avaliação com Stockfish WASM (centipawn loss) — planejado
- Indicador visual de melhor jogada (opcional)

---

## 12. Plano de Implementação

| Fase | Tarefas | Status |
|---|---|---|---|
| **0 — Setup** | Docker Compose (PostgreSQL + Redis), projeto React + Express, Prisma schema, migração inicial | ✅ |
| **1 — Autenticação** | Registro, login, JWT, middleware, guest mode | ✅ |
| **2 — Tabuleiro** | Componente ChessBoard, interação drag/click, destaques, SVGs sólidos | ✅ |
| **3 — Partidas** | Serviço de jogo com chess.js, Socket.IO, salas, relógio, cleanup/reconexão | ✅ |
| **4 — Lobby + Matchmaking** | Fila Redis (sorted sets), criação de salas, matchmaking por rating | ✅ |
| **5 — Persistência** | Salvar Game + Moves, histórico paginado, exportar PGN | ✅ |
| **6 — Análise** | Replay, navegação jogada-a-jogada, gráfico de material | ✅ |
| **6b — Análise Avançada** | Stockfish WASM, gráfico de avaliação, best move, detecção de erros | 📅 |
| **7 — Polimento** | Responsivo, loading states, toasts, sons, teclado | 📅 |

---

## 13. Estrutura de Pastas (Projetada)

```
pawn2king/
├── .spec/
│   └── spec.md
├── docker-compose.yml
├── server/
│   ├── src/
│   │   ├── index.ts
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── sockets/
│   │   └── utils/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   └── tsconfig.json
├── client/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── components/
│   │   │   ├── ChessBoard/
│   │   │   ├── Clock/
│   │   │   ├── MoveList/
│   │   │   ├── Lobby/
│   │   │   └── Analysis/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── tailwind.config.js
└── README.md
```

---

## 14. Notas de Implementação

### 14.1 Prisma Client
- Gerado em `server/src/generated/prisma/` (caminho customizado no `prisma.schema`)
- Import: `from "../generated/prisma/client"`

### 14.2 Socket.IO Rooms
- Cada partida usa `socket.join(gameId)` para isolar eventos
- Broadcast de movimentos e `game:over` via `io.to(gameId).emit()`
- `game:start` é enviado individualmente a cada jogador (contém `color` específica)

### 14.3 Cleanup de Partidas
- `cleanupGame()` centraliza: persistência no banco, remoção de `activeGames`/`playerGames`, limpeza de timers de reconexão, remoção de salas
- Chamada em: `game:move` (fim), `game:resign`, `game:draw-response` (aceito), timeout de desconexão

### 14.4 Reconexão
- Ao conectar, verifica se o usuário tem partida ativa em `playerGames`
- Se sim e a partida está `ACTIVE`, reenvia `game:start` com `resumed: true`
- Cancela o timer de desconexão se existir

### 14.5 Comportamento do Tabuleiro
- `selectSquare` com try/catch para segurança
- Clique em outra peça própria troca a seleção (não requer desselecionar primeiro)
- Drag-and-drop e clique funcionam em paralelo

### 14.6 Modo Convidado
- Se `nickname` não for enviado, o servidor gera automaticamente (ex: "Convidado#XXXX")
- Token JWT com expiração de 24h

### 14.7 Frontend na Rede Local
- Vite configurado com `host: "0.0.0.0"` para acesso de outros dispositivos na LAN
- Proxy do Vite para `/api` e `/socket.io` aponta para `localhost:3001`
