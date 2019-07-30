import { v4 as uuid } from "uuid";
import { defaultOptions } from "./lib/defaultOptions";
import { EventManagerError } from "./lib/EventManagerError";
import { timeout } from "./lib/helper";
import {
  EventHandlerFunction,
  IEmitAndWaitOptions,
  IEventManagerOptions,
  IEventPayload,
  OverrideMetasFunction
} from "./lib/interfaces";
import { createLogger, LOGGER } from "./lib/logger";

import Emittery = require("emittery");

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
      this.emittery.on(eventName, async payload => {
        try {
          const response = await listener(payload);
          if (response) {
            this.emitResponseIfNeeded(payload, response);
          }
          return response;
        } catch (error) {
          LOGGER.error(`Error in listener for event ${eventName}`, error);
        }
      });
    } catch (e) {
      LOGGER.error(`Unable to listen event ${eventName}`, e);
      throw new EventManagerError(`Unable to listen event ${eventName}`, e);
    }
  }
  public async emit(
    eventName: string,
    payload: IEventPayload
  ): Promise<IEventPayload> {
    try {
      LOGGER.debug(`Emitting ${eventName} Message ...`);
      // we should create the metas information here
      payload = this.addMetasToPayload(payload, eventName);
      this.emittery.emit(eventName, payload);
      LOGGER.debug(`Message ${eventName} Emitted`);
      return payload;
    } catch (err) {
      throw new EventManagerError(`Unable to emit event ${eventName}`, err);
    }
  }

  public async emitAndWait(
    eventName: string,
    payload: IEventPayload,
    replyToName?: string,
    options?: IEmitAndWaitOptions
  ): Promise<IEventPayload> {
    return new Promise(async (resolve, reject) => {
      LOGGER.info(`EmitAndWait : ${eventName}`);
      let replyTo = replyToName
        ? replyToName
        : `${eventName}${this.options.defaultResponseSuffix}`;
      const correlationId = uuid();
      replyTo += `.${correlationId}`;
      const overrideMetas = payload._metas
        ? {
            correlationId,
            replyTo,
            ...payload._metas
          }
        : {
            correlationId,
            replyTo
          };
      const newPayload = {
        ...payload
      };
      newPayload._metas = overrideMetas;

      const listen = () => {
        return new Promise(resolve => {
          this.on(replyTo, (responsePayload: IEventPayload) => {
            resolve(responsePayload);
          });
        });
      };

      const duration =
        options && options.emitAndWaitTimeout
          ? options.emitAndWaitTimeout
          : this.options.emitAndWaitTimeout;
      const timeoutMessage = `Timeout Error after ${duration} milliseconds for event ${eventName} and correlationId ${correlationId} `;

      Promise.race([timeout(duration, timeoutMessage), listen()])
        .then((payload: any) => {
          resolve(payload);
          // cleaning
          // Putting in setTimeout to be done after every thing else;
          setImmediate(async () => {
            this.emittery.off(replyTo, (payload: IEventPayload) => {
              console.log("e");
            });
          });
        })
        .catch(reject);
      const payloadEmitted = await this.emit(eventName, newPayload);
      LOGGER.info(`EmitAndWait : ${eventName}`, { payload: payloadEmitted });
    });
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
      const metasOverride = payload._metas ? payload._metas : {};

      const metas = {
        guid: uuid(),
        name: eventName,
        application: this.options.application,
        timestamp: Date.now(),
        ...metasOverride
      };

      if (isOverrideMetasFunction(this.options.metas)) {
        return { ...payload, _metas: this.options.metas(metas) };
      } else {
        return { ...payload, _metas: metas };
      }
    }
  }

  private async emitResponseIfNeeded(
    sourcePayload: IEventPayload,
    targetPayload: IEventPayload
  ): Promise<IEventPayload | void> {
    if (
      sourcePayload &&
      sourcePayload._metas &&
      sourcePayload._metas.correlationId &&
      sourcePayload._metas.replyTo &&
      targetPayload !== null &&
      typeof targetPayload === "object"
    ) {
      const newPayload = {
        _metas: {
          responseTo: sourcePayload._metas.name,
          correlationId: sourcePayload._metas.correlationId
        },
        ...targetPayload
      };

      return this.emit(sourcePayload._metas.replyTo, newPayload);
    }
  }
}

function isOverrideMetasFunction(func: any): func is OverrideMetasFunction {
  return {}.toString.call(func) === "[object Function]";
}
