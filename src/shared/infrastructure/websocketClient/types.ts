import { MetricsReport } from "@shared/types/metrics.type";
import { Socket } from "socket.io-client";

export interface ServerToClientEvents {
  pong: () => void;

  start: (data: { procedureId: string }) => void;
  stop: (data: { procedureId: string }) => void;
}

export interface ClientToServerEvents {
  ping: () => void;

  report: (data: MetricsReport) => void;
}

export type WebsocketClient = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;
