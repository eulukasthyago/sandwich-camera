import { ElectronAPI } from '@electron-toolkit/preload'
import { Buffer } from 'node:buffer'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    Buffer: Buffer
  }
}
