export interface IEventPayloadMetas {
  guid: string;
  name: string;
  application: string;
  timestamp: number;
  correlationId?: string;
  replyTo?: string;
  [k: string]: any;
}
export interface IEventPayload {
  [k: string]: any;
  _metas?: Partial<IEventPayloadMetas>;
}
export type EventHandlerFunction = (
  payload: IEventPayload
) => Promise<IEventPayload | void | null> | IEventPayload | void | null;
export type OverrideMetasFunction = (
  metas: IEventPayloadMetas
) => IEventPayloadMetas;
export interface IEventManagerOptions {
  application: string;
  metas: boolean | OverrideMetasFunction;
  logLevel: "error" | "debug" | "info" | "warn";
  logPrefix: string;
  logTransportMode: "console" | "mute";
  defaultResponseSuffix: string;
  emitAndWaitTimeout: number;
}

export interface IEmitAndWaitOptions {
  emitAndWaitTimeout?: number;
}
