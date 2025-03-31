import * as si from "systeminformation";
import Docker from "dockerode";

import type { Metrics } from "@shared/types/metrics.type";

type IMetricDTO = {
  hostMetrics: Metrics | null;
  workerMetrics: Metrics[] | null;
  processingMetrics: {
    [key: string]: { processingId: string } & Metrics;
  };

  error: string | null;
};

class ClientCollectorService {
  private readonly docker: Docker;
  private readonly expectedWorkerContainerNameContains = "autodroid_worker";

  constructor() {
    this.docker = new Docker({ socketPath: "/var/run/docker.sock" });
    this.docker.ping();
  }

  protected async collectMetrics(): Promise<IMetricDTO> {
    try {
      const [hostMetrics, workerMetrics, processingMetrics] = await Promise.all(
        [
          this.collectHostMetrics(),
          this.collectWorkerMetrics(),
          this.collectProcessingMetrics(),
        ],
      );

      return {
        hostMetrics,
        workerMetrics,
        processingMetrics,
        error: null,
      };
    } catch (error: any) {
      return {
        hostMetrics: null,
        workerMetrics: null,
        processingMetrics: {},
        error: error.message,
      };
    }
  }

  protected async collectProcessingMetrics(): Promise<{
    [key: string]: { processingId: string } & Metrics;
  }> {
    try {
      const containers = await this.docker.listContainers();

      const workerContainers = containers.filter(container =>
        container.Names.some(name =>
          name
            .substring(1)
            .startsWith(this.expectedWorkerContainerNameContains),
        ),
      );

      const workerMetricsPromises = workerContainers.map(containerInfo => {
        const container = this.docker.getContainer(containerInfo.Id);
        const name = containerInfo.Names[0].substring(1);
        return this.collectContainerMetrics(container, name);
      });

      const workerMetrics = await Promise.all(workerMetricsPromises);

      return workerMetrics.reduce(
        (acc, metrics) => {
          const processingId = metrics.name.split("_")[3];
          acc[processingId] = {
            processingId,
            ...metrics,
          };
          return acc;
        },
        {} as { [key: string]: { processingId: string } & Metrics },
      );
    } catch (error) {
      throw new Error(`Error getting main worker metrics: ${error}`);
    }
  }

  protected async collectWorkerMetrics(): Promise<Metrics[]> {
    try {
      const containers = await this.docker.listContainers();

      const workers = containers.filter(container =>
        container.Names.some(name =>
          name
            .substring(1)
            .startsWith(this.expectedWorkerContainerNameContains),
        ),
      );

      if (!workers.length)
        throw new Error(
          `No ${this.expectedWorkerContainerNameContains} containers found`,
        );

      const result = await Promise.all(
        workers.map(async workerContainer => {
          const container = this.docker.getContainer(workerContainer.Id);
          const metrics = await this.collectContainerMetrics(
            container,
            workerContainer.Names[0].substring(1),
          );

          return metrics;
        }),
      );

      return result;
    } catch (error) {
      throw new Error(`Error getting main worker metrics: ${error}`);
    }
  }

  private async collectHostMetrics(): Promise<Metrics> {
    try {
      const cpuData = await si.currentLoad();
      const memData = await si.mem();

      return {
        name: "host",
        type: "host",
        cpu: {
          usedPercentage: parseFloat(cpuData.currentLoad.toFixed(2)),
          cores: cpuData.cpus.length,
        },
        memory: {
          total: memData.total,
          used: memData.active,
          free: memData.available,
          usedPercentage: parseFloat(
            ((memData.active / memData.total) * 100).toFixed(2),
          ),
        },
      };
    } catch (error) {
      throw new Error(`Error getting system metrics: ${error}`);
    }
  }

  private async collectContainerMetrics(
    container: Docker.Container,
    name: string,
  ): Promise<Metrics> {
    const stats = await container.stats({ stream: false });

    // Calculate CPU usage percentage
    const cpuDelta =
      stats.cpu_stats.cpu_usage.total_usage -
      stats.precpu_stats.cpu_usage.total_usage;
    const systemCpuDelta =
      stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const cpuCores =
      stats.cpu_stats.online_cpus ||
      (stats.cpu_stats.cpu_usage.percpu_usage
        ? stats.cpu_stats.cpu_usage.percpu_usage.length
        : 1);
    const cpuUsage = (cpuDelta / systemCpuDelta) * cpuCores * 100;

    // Calculate memory usage
    const memoryTotal = stats.memory_stats.limit;
    const memoryUsed = stats.memory_stats.usage;
    const memoryFree = memoryTotal - memoryUsed;
    const memoryUsedPercent = (memoryUsed / memoryTotal) * 100;

    return {
      name,
      type: "container",
      cpu: {
        usedPercentage: parseFloat(
          Number.isNaN(cpuUsage) ? "0.00" : cpuUsage.toFixed(2),
        ),
        cores: cpuCores,
      },
      memory: {
        total: memoryTotal,
        used: memoryUsed,
        free: memoryFree,
        usedPercentage: parseFloat(memoryUsedPercent.toFixed(2)),
      },
    };
  }
}

export type { IMetricDTO };
export { ClientCollectorService };
