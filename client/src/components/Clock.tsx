interface ClockProps {
  time: number
  label: string
  active: boolean
}

export function Clock({ time, label, active }: ClockProps) {
  const totalSeconds = Math.floor(time / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const isLow = time < 60000

  return (
    <div className={`text-center px-4 py-2 rounded-lg transition-colors ${active ? "bg-zinc-700" : "bg-zinc-800"} ${isLow ? "text-red-400" : "text-zinc-100"}`}>
      <span className="text-xs text-zinc-500 uppercase">{label}</span>
      <div className={`text-2xl font-mono font-bold tabular-nums ${active ? "text-amber-400" : ""}`}>
        {minutes}:{seconds.toString().padStart(2, "0")}
      </div>
    </div>
  )
}
