function SvgWrapper({
  children,
  fill,
  stroke,
}: {
  children: React.ReactNode
  fill: string
  stroke: string
}) {
  return (
    <svg viewBox="0 0 45 45" className="w-full h-full" fill={fill} stroke={stroke} strokeWidth="1.2"
      strokeLinecap="round" strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

function WhitePiece({ children }: { children: React.ReactNode }) {
  return <SvgWrapper fill="#fff" stroke="#1a1a1a">{children}</SvgWrapper>
}

function BlackPiece({ children }: { children: React.ReactNode }) {
  return <SvgWrapper fill="#1a1a1a" stroke="#fff">{children}</SvgWrapper>
}

function PawnBody() {
  return (
    <>
      <circle cx="22.5" cy="13" r="5.5" strokeWidth="1.5" fill="inherit" />
      <path d="M 17 20 C 17 24 19 26 19 26 L 26 26 C 26 26 28 24 28 20 C 28 17 26 15.5 23 15.5 L 22.5 15.5 L 22 15.5 C 19 15.5 17 17 17 20 Z" strokeWidth="1.5" fill="inherit" />
      <path d="M 15 33 C 15 35 17 37 19 37 L 26 37 C 28 37 30 35 30 33 L 30 29 C 30 27 28 26 26 26 L 19 26 C 17 26 15 27 15 29 Z" strokeWidth="1.5" fill="inherit" />
    </>
  )
}

function KnightBody() {
  return (
    <>
      <path d="M 23 8 L 27 6 C 28 6 28 7 28 7 L 28 9 C 30 9 31 10 31 12 L 30 14 L 32 16 C 33 17 33 19 32 20 L 30 21 C 29 22 27 23 25 23 L 18 23 C 16 23 14 22 13 20 L 12 18 C 11 17 11 15 12 14 C 13 13 16 13 17 14 L 18 15 L 19 12 C 19 10 21 8 23 8 Z" strokeWidth="1.5" fill="inherit" />
      <path d="M 26 23 L 27 26 C 27 27 26 28 25 28 L 20 28 C 19 28 18 27 18 26 L 19 23" strokeWidth="1.5" fill="inherit" />
      <path d="M 16 29 C 15 30 15 32 16 33 L 18 35 L 27 35 L 29 33 C 30 32 30 30 29 29 L 27 28 L 18 28 Z" strokeWidth="1.5" fill="inherit" />
      <circle cx="22.5" cy="12" r="1.5" fill="inherit" />
    </>
  )
}

function BishopBody() {
  return (
    <>
      <circle cx="22.5" cy="12" r="4" strokeWidth="1.5" fill="inherit" />
      <circle cx="22.5" cy="7" r="1.5" strokeWidth="1.5" fill="inherit" />
      <path d="M 22.5 17 C 20 17 18 19 18 21 C 18 24 20 25 20 26 L 20 29 L 17 31 C 15 32 14 34 14 36 L 14 37 L 31 37 L 31 36 C 31 34 30 32 28 31 L 25 29 L 25 26 C 25 25 27 24 27 21 C 27 19 25 17 22.5 17 Z" strokeWidth="1.5" fill="inherit" />
    </>
  )
}

function RookBody() {
  return (
    <>
      <path d="M 15 10 L 15 8 L 18 8 L 18 10 L 20 10 L 20 8 L 25 8 L 25 10 L 27 10 L 27 8 L 30 8 L 30 10" strokeWidth="1.5" fill="none" />
      <path d="M 15 11 L 30 11 L 29 33 L 16 33 Z" strokeWidth="1.5" fill="inherit" />
      <path d="M 17 34 L 17 36 L 28 36 L 28 34" strokeWidth="1.5" fill="none" />
      <rect x="17" y="36" width="11" height="2" rx="1" strokeWidth="1.5" fill="inherit" />
    </>
  )
}

function QueenBody() {
  return (
    <>
      <circle cx="22.5" cy="8" r="2" strokeWidth="1.5" fill="inherit" />
      <circle cx="15" cy="10" r="1.8" strokeWidth="1.5" fill="inherit" />
      <circle cx="30" cy="10" r="1.8" strokeWidth="1.5" fill="inherit" />
      <circle cx="12.5" cy="14" r="1.5" strokeWidth="1.5" fill="inherit" />
      <circle cx="32.5" cy="14" r="1.5" strokeWidth="1.5" fill="inherit" />
      <path d="M 22.5 11 L 18.5 16 L 14 14 L 16 19 L 12 23 L 17.5 25 L 18 28 L 15 30 C 14 31 13 33 13 35 L 13 36 L 32 36 L 32 35 C 32 33 31 31 30 30 L 27 28 L 27.5 25 L 33 23 L 29 19 L 31 14 L 26.5 16 Z" strokeWidth="1.5" fill="inherit" />
    </>
  )
}

function KingBody() {
  return (
    <>
      <circle cx="22.5" cy="14" r="6" strokeWidth="1.5" fill="inherit" />
      <path d="M 14 22 C 14 25 15 26 16 27 L 17 28 L 14 32 C 13 34 13 36 14 38 L 31 38 C 32 36 32 34 31 32 L 28 28 L 29 27 C 30 26 31 25 31 22 C 31 19 29 16 26 15 C 25 15 24 14 24 14 L 23 11" strokeWidth="1.5" fill="inherit" />
      <line x1="18" y1="5" x2="27" y2="5" strokeWidth="2" />
      <line x1="22.5" y1="1" x2="22.5" y2="9" strokeWidth="2" />
    </>
  )
}

const PIECE_COMPONENTS: Record<string, React.FC> = {
  P: PawnBody, p: PawnBody,
  N: KnightBody, n: KnightBody,
  B: BishopBody, b: BishopBody,
  R: RookBody, r: RookBody,
  Q: QueenBody, q: QueenBody,
  K: KingBody, k: KingBody,
}

export function getPieceSvg(type: string) {
  const isWhite = type === type.toUpperCase()
  const Wrapper = isWhite ? WhitePiece : BlackPiece
  const Body = PIECE_COMPONENTS[type]

  if (!Body) return null

  return (
    <Wrapper>
      <Body />
    </Wrapper>
  )
}
