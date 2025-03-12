import { io } from "socket.io-client";

import { logger } from "@shared/utils/logger";
import { executeAction } from "@shared/utils/executeAction.util";

import { params } from "@/src";
import { WebsocketClient } from "./types";

class WebSocketClient {
  public socket: WebsocketClient;

  constructor() {
    const { token, url } = params;
    this.socket = io(url, {
      path: "/websocket",

      auth: getAuthToken => {
        getAuthToken({
          token: `Bearer ${token}`,
        });
      },

      autoConnect: false,

      reconnection: true,
      reconnectionDelay: 30000,
      reconnectionAttempts: Infinity,
    });

    this.startCommonListeners();
  }

  private async checkServerConnection(): Promise<void> {
    const { url } = params;

    if (!url) throw new Error("❌ URL is not defined");

    return new Promise<void>(resolve => {
      const checkConnection = async () => {
        try {
          const response = await fetch(url);
          if (response.ok) {
            logger.info("🟢 Server is online");
            if (!this.socket.connected) {
              logger.info("Attempting to reconnect to server");
              await this.init();
            }
            return true;
          }
          logger.warn(`🟠 Server returned status ${response.status}`);
          return false;
        } catch (error) {
          logger.error(
            `🔴 Server connection failed: ${error instanceof Error ? error.message : String(error)}`,
          );
          return false;
        }
      };

      const intervalId = setInterval(async () => {
        if (await checkConnection()) {
          clearInterval(intervalId);
          resolve();
        }
      }, 5000);
    });
  }

  public async init(): Promise<void> {
    if (!this.socket.connected)
      await executeAction({
        action: () => this.connect(),
        actionName: "Websocket connection initialization",
        retryDelay: 15000,
        maxRetries: Infinity,
        logging: true,
      });
  }

  private async handleConnectionError(): Promise<void> {
    try {
      await this.checkServerConnection();

      logger.info("Server is available, trying to refresh authentication");

      await this.init();
    } catch (error) {
      logger.error(
        `❌ Error while refreshing access token during websocket connection opening. Unable to continue ${error}`,
      );
      process.exit(1);
    }
  }

  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const stopListeners = () => {
        // eslint-disable-next-line no-use-before-define
        this.socket.off("connect_error", onError);
        // eslint-disable-next-line no-use-before-define
        this.socket.off("connect", onSuccess);
      };

      const onSuccess = () => {
        stopListeners();
        resolve();
      };

      const onError = (error: any) => {
        stopListeners();
        this.disconnect();
        reject(error);
      };

      try {
        this.socket.connect();
        this.socket.once("connect_error", onError);
        this.socket.once("connect", onSuccess);
      } catch (error) {
        stopListeners();
        this.disconnect();
        reject(error);
      }
    });
  }

  public disconnect(): void {
    this.socket.disconnect();
  }

  private startCommonListeners(): void {
    this.socket.on("connect", () => {
      logger.info("✅ Connected to server");
    });

    this.socket.on("disconnect", () => {
      logger.info("⭕ Disconnected from server");
    });

    this.socket.io.on("error", error => {
      logger.error(`❌ Websocket error due ${error.message}`);
    });

    this.socket.on("connect_error", err => {
      logger.error(`❌ Websocket connection error due ${err.message}`);

      if (!!err.message && err.message.toLowerCase().includes("unauthorized")) {
        logger.error("❌ Unauthorized access. Trying to refresh.");
        this.handleConnectionError();
      }
    });

    this.socket.io.on("reconnect_attempt", () => {
      logger.info("🔃 Trying to reconnect to server");
    });

    this.socket.io.on("reconnect_error", error => {
      logger.error(`❌ Error while reconnecting ${error.message}`);
    });

    this.socket.io.on("reconnect_failed", () => {
      logger.error(`❌ Fail to reconnect to server`);
    });

    this.socket.io.on("reconnect", () => {
      logger.info("🔄 Reconnected to server");
    });
  }

  public getIsConnected(): boolean {
    return this.socket.connected;
  }
}

export { WebSocketClient };
