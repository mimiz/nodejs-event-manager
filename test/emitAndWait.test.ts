import { expect } from "chai";
import { describe, it } from "mocha";
import * as sinon from "sinon";
import EventManager from "../src/index";
import { IEventPayload } from "../src/lib/interfaces";

describe("Event Manager, Emit And Wait ", () => {
  let sandbox: sinon.SinonSandbox;
  let eventManager: EventManager;
  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    eventManager = new EventManager({
      logLevel: "error",
      application: "unittest"
    });
  });
  afterEach(async () => {
    sandbox.restore();
    await eventManager.close();
  });

  it("Should be able to emit and wait for response one instance", async () => {
    /** given */
    const initialPayload = {
      name: "my super name",
      a: 43,
      b: 57
    };
    const eventName = "add";
    const responseEventName = "add.response";

    /** when */
    eventManager.on(eventName, async (payload: IEventPayload) => {
      return { newKey: "New-Key", result: payload.a + payload.b };
    });
    // ust wait a little bit the queue is created

    // We emit event and wait for other
    const responsePayload = await eventManager.emitAndWait(
      eventName,
      initialPayload,
      responseEventName,
      { emitAndWaitTimeout: 10000 }
    );
    /** then */

    // Check mocks

    // Check result
    expect(responsePayload.newKey).to.equal("New-Key");
    expect(responsePayload.result).to.equal(100);
  });

  it("Should be able to emit and wait for response one instance two times", async () => {
    /** given */
    const payload1 = {
      a: 43,
      b: 57
    };
    const payload2 = {
      a: 44,
      b: 66
    };
    const eventName = "add";

    /** when */
    eventManager.on(eventName, async (payload: IEventPayload) => {
      return { result: payload.a + payload.b };
    });
    // ust wait a little bit the queue is created

    // We emit event and wait for other
    const responsePayload1 = await eventManager.emitAndWait(
      eventName,
      payload1
    );
    const responsePayload2 = await eventManager.emitAndWait(
      eventName,
      payload2
    );
    /** then */

    // Check mocks

    // Check result
    expect(responsePayload1.result).to.equal(100);
    expect(responsePayload2.result).to.equal(110);
  });
});
