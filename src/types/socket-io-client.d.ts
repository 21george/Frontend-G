declare module "socket.io-client" {
  export interface Socket {
    on(event: string, callback: (...args: never[]) => void): void;
    off(event: string, callback?: (...args: never[]) => void): void;
    emit(event: string, ...args: unknown[]): void;
    disconnect(): void;
    connected: boolean;
    id?: string;
  }
  export function io(url?: string, opts?: Record<string, unknown>): Socket;
  export { io as default };
}
