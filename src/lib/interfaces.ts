export interface IEventPayloadMetas {
  guid: string;
  name: string;
  application: string;
  timestamp: number;
  [k: string]: any;
}
export interface IEventPayload {
  [k: string]: any;
  _metas?: IEventPayloadMetas;
}
export type EventHandlerFunction = (
  payload: IEventPayload
) => void | Promise<boolean | void>;
export type OverrideMetasFunction = (
  metas: IEventPayloadMetas
) => IEventPayloadMetas;
export interface IEventManagerOptions {
  application: string;
  metas: boolean | OverrideMetasFunction;
  logLevel: "error" | "debug" | "info" | "warn";
  logPrefix: string;
  logTransportMode: "console" | "mute";
}
