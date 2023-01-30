/// <reference types="vite/client" />

declare global {
  type PlayerCore = {
    destroy: () => void
    seek:  (time: number) => Promise<void>
  }

  type Player = {
    core: () => PlayerCore
  }
}

declare interface Window {
  player: PlayerCore
}
