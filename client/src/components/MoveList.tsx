import type { MoveInfo } from "../stores/game"

interface MoveListProps {
  moves: MoveInfo[]
}

export function MoveList({ moves }: MoveListProps) {
  const pairs: [number, MoveInfo?, MoveInfo?][] = []
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push([Math.floor(i / 2) + 1, moves[i], moves[i + 1]])
  }

  return (
    <div className="bg-zinc-800 rounded-lg p-3 max-h-64 overflow-y-auto text-sm font-mono">
      {pairs.length === 0 && (
        <p className="text-zinc-500 text-center py-4">Nenhum movimento ainda</p>
      )}
      {pairs.map(([num, white, black]) => (
        <div key={num} className="flex gap-2 py-0.5">
          <span className="text-zinc-500 w-6 text-right">{num}.</span>
          <span className="text-zinc-100 w-16">{white?.san || ""}</span>
          <span className="text-zinc-100 w-16">{black?.san || ""}</span>
        </div>
      ))}
    </div>
  )
}
