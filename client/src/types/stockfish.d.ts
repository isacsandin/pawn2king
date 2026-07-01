declare module "stockfish.js" {
  interface StockfishModule {
    (): StockfishInstance
  }
  interface StockfishInstance {
    postMessage(msg: string): void
    onmessage: ((msg: string) => void) | null
    onerror?: (err: Error) => void
    terminate(): void
  }
  const Stockfish: StockfishModule
  export default Stockfish
}
