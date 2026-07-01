const PIECES = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
} as const

export function getPieceChar(piece: string): string {
  return PIECES[piece as keyof typeof PIECES] || piece
}

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
export const RANKS = [8, 7, 6, 5, 4, 3, 2, 1]

export function squareToCoord(square: string): [number, number] {
  const file = FILES.indexOf(square[0])
  const rank = RANKS.indexOf(Number(square[1]))
  return [file, rank]
}

export function coordToSquare(file: number, rank: number): string {
  return `${FILES[file]}${RANKS[rank]}`
}
