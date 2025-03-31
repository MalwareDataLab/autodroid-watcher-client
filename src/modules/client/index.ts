import { logger } from "@shared/utils/logger";
import { WebSocketClient } from "@shared/infrastructure/websocketClient";
import { params } from "@/src";
import { getAllData } from "systeminformation";
import { ClientCollectorService, IMetricDTO } from "./collector";

class ClientService extends ClientCollectorService {
  private readonly initialization: Promise<void>;

  public readonly websocketClient: WebSocketClient;

  private watcherName: string;
  private procedureId: string;
  private count = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private disconnectionTimeout: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.websocketClient = new WebSocketClient();
    this.initialization = this.websocketClient.init();

    this.watcherName = params.name;

    this.websocketClient.socket.on("connect", () => {
      logger.info("🟢 Connected to server...");
      if (this.disconnectionTimeout) {
        clearTimeout(this.disconnectionTimeout);
        this.disconnectionTimeout = null;
      }
    });

    this.websocketClient.socket.on("start", data => {
      logger.info(
        `🟢 Received START command for procedureId: ${data.procedureId}`,
      );

      this.start({ procedureId: data.procedureId }).catch(error => {
        logger.error(`❌ Error starting client: ${error}`);
      });
    });

    this.websocketClient.socket.on("stop", data => {
      logger.info(
        `🔴 Received STOP command for procedureId: ${data.procedureId}`,
      );

      this.stop().catch(error => {
        logger.error(`❌ Error stopping client: ${error}`);
      });
    });

    this.websocketClient.socket.on("disconnect", () => {
      if (this.intervalId) {
        logger.info("🔴 Disconnected from server... Stop sending data.");
        this.disconnectionTimeout = setTimeout(
          () =>
            this.stop().catch(error => {
              logger.error(`❌ Error stopping client: ${error}`);
            }),
          60000,
        );
      }
    });
  }

  async start({ procedureId }: { procedureId: string }): Promise<void> {
    await this.initialization;

    this.procedureId = procedureId;
    this.count = 0;

    const systemInfo = await getAllData();
    this.websocketClient.socket.emit("systemInformation", {
      ...systemInfo,
      procedureId: this.procedureId,
      watcherName: this.watcherName,
    });

    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        await this.send(metrics);
        this.count += 1;
      } catch (error) {
        logger.error(`❌ Error collecting or sending metrics: ${error}`);
      }
    }, 1000);
  }

  async stop(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async send({ workerMetrics, ...data }: IMetricDTO): Promise<void> {
    try {
      if (workerMetrics) {
        workerMetrics?.forEach(current => {
          this.websocketClient.socket.emit("report", {
            watcherName: this.watcherName,
            procedureId: this.procedureId,
            count: this.count,

            ...data,
            workerMetrics: current,

            time: new Date().toISOString(),
          });
        });
      } else {
        this.websocketClient.socket.emit("report", {
          watcherName: this.watcherName,
          procedureId: this.procedureId,
          count: this.count,
          workerMetrics: null,

          ...data,

          time: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error(`❌ Failed to send metrics to server: ${error}`);
    }
  }
}

const client = new ClientService();

const signals = ["SIGINT", "SIGTERM"];
let isShuttingDown = false;

const shutdown = () => {
  if (isShuttingDown) return;

  isShuttingDown = true;
  logger.info("Shutting down client...");
  client.stop();
  client.websocketClient.disconnect();
  process.exit(0);
};

signals.forEach(signal => {
  process.on(signal, shutdown);
});

export { client };
