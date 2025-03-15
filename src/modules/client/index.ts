import { logger } from "@shared/utils/logger";
import { WebSocketClient } from "@shared/infrastructure/websocketClient";
import { params } from "@/src";
import { getAllData } from "systeminformation";
import { ClientCollectorService, IMetricDTO } from "./collector";

class ClientService extends ClientCollectorService {
  private readonly initialization: Promise<void>;

  public readonly websocketClient: WebSocketClient;

  private workerName: string;
  private procedureId: string;
  private count = 0;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.websocketClient = new WebSocketClient();
    this.initialization = this.websocketClient.init();

    this.workerName = params.name;

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
        this.stop().catch(error => {
          logger.error(`❌ Error stopping client: ${error}`);
        });
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
      workerName: this.workerName,
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

  private async send(data: IMetricDTO): Promise<void> {
    try {
      this.websocketClient.socket.emit("report", {
        workerName: this.workerName,
        procedureId: this.procedureId,
        count: this.count,

        ...data,

        time: new Date().toISOString(),
      });
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
