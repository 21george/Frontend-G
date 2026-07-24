import "socket.io-client";
import type { ManagerOptions, Socket, SocketOptions } from "socket.io-client";

declare module "socket.io-client" {
  export interface AppSocketOptions
    extends Partial<ManagerOptions>, Partial<SocketOptions> {}

  export function io(opts?: AppSocketOptions): Socket;
  export function io(url?: string, opts?: AppSocketOptions): Socket;
}
