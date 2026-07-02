import wKing from "/src/assets/pieces/w-king.png"
import wQueen from "/src/assets/pieces/w-queen.png"
import wRook from "/src/assets/pieces/w-rook.png"
import wBishop from "/src/assets/pieces/w-bishop.png"
import wKnight from "/src/assets/pieces/w-knight.png"
import wPawn from "/src/assets/pieces/w-pawn.png"
import bKing from "/src/assets/pieces/b-king.png"
import bQueen from "/src/assets/pieces/b-queen.png"
import bRook from "/src/assets/pieces/b-rook.png"
import bBishop from "/src/assets/pieces/b-bishop.png"
import bKnight from "/src/assets/pieces/b-knight.png"
import bPawn from "/src/assets/pieces/b-pawn.png"

const IMAGES: Record<string, string> = {
  K: wKing, Q: wQueen, R: wRook, B: wBishop, N: wKnight, P: wPawn,
  k: bKing, q: bQueen, r: bRook, b: bBishop, n: bKnight, p: bPawn,
}

export function getPieceSvg(type: string) {
  const src = IMAGES[type]
  if (!src) return null
  return <img src={src} alt={type} className="w-full h-full object-contain" draggable={false} />
}
