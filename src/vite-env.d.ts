/// <reference types="vite/client" />

/**
 * alias of vite-plugin-monkey/dist/client
 */
declare module '$' {
  export * from 'vite-plugin-monkey/dist/client';
}

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
