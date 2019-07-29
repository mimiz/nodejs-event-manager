import { IEventManagerOptions } from "./interfaces";

export const defaultOptions: IEventManagerOptions = {
  application: "application",
  metas: true,
  logLevel: "error",
  logPrefix: "RABBITMQ_EVENT_MANAGER",
  logTransportMode: "console",
  defaultResponseSuffix: ".RESPONSE",
  emitAndWaitTimeout: 30000
};
