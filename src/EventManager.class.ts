import { v4 as uuid } from "uuid";
import { defaultOptions } from "./lib/defaultOptions";
import { EventManagerError } from "./lib/EventManagerError";
import {
  EventHandlerFunction,
  IEventManagerOptions,
  IEventPayload,
  OverrideMetasFunction
} from "./lib/interfaces";
import { createLogger, LOGGER } from "./lib/logger";
import Emittery = require("emittery");

// import Emittery from "emittery";

export class EventManager {
  private options: IEventManagerOptions;
  private emittery: Emittery;
  constructor(options?: Partial<IEventManagerOptions>) {
    this.options = { ...defaultOptions, ...options };
    this.emittery = new Emittery();
    this.createLogger();
  }

  private createLogger() {
    createLogger({
      prefix: this.options.logPrefix,
      level: this.options.logLevel,
      transportMode: this.options.logTransportMode
    });
  }
  public async on(eventName: string, listener: EventHandlerFunction) {
    try {
      LOGGER.debug(`Listening ${eventName} Event ...`);
      this.emittery.on(eventName, payload => {
        try {
          return listener(payload);
        } catch (error) {
          LOGGER.error(`Error in listener for event ${eventName}`, error);
        }
      });
    } catch (e) {
      LOGGER.error(`Unable to listen event ${eventName}`, e);
      throw new EventManagerError(`Unable to listen event ${eventName}`, e);
    }
  }
  public async emit(eventName: string, payload: IEventPayload): Promise<void> {
    try {
      LOGGER.debug(`Emitting ${eventName} Message ...`);
      // we should create the metas information here
      payload = this.addMetasToPayload(payload, eventName);
      this.emittery.emit(eventName, payload);
      LOGGER.debug(`Message ${eventName} Emitted`);
      return;
    } catch (err) {
      throw new EventManagerError(`Unable to emit event ${eventName}`, err);
    }
  }

  public async initialize() {
    return;
  }
  public async close() {
    LOGGER.debug(`Disconnect EventManager`, { ...this.options });
    return this.emittery.clearListeners();
  }

  private addMetasToPayload(
    payload: IEventPayload,
    eventName: string
  ): IEventPayload {
    if (!this.options.metas) {
      return payload;
    } else {
      const metas = {
        guid: uuid(),
        name: eventName,
        application: this.options.application,
        timestamp: Date.now()
      };
      if (isOverrideMetasFunction(this.options.metas)) {
        return { _metas: this.options.metas(metas), ...payload };
      } else {
        return { _metas: metas, ...payload };
      }
    }
  }
}

function isOverrideMetasFunction(func: any): func is OverrideMetasFunction {
  return {}.toString.call(func) === "[object Function]";
}
