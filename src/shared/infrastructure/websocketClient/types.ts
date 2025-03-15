import { MetricsReport } from "@shared/types/metrics.type";
import { Socket } from "socket.io-client";
import type { getAllData } from "systeminformation";

export interface ServerToClientEvents {
  pong: () => void;

  start: (data: { procedureId: string }) => void;
  stop: (data: { procedureId: string }) => void;
}

export interface ClientToServerEvents {
  ping: () => void;

  report: (data: MetricsReport) => void;
  systemInformation: (
    data: Awaited<ReturnType<typeof getAllData>> & { procedureId: string },
  ) => void;
}

export type WebsocketClient = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;
