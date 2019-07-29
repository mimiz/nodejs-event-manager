import { expect } from "chai";
import { describe, it } from "mocha";
import * as sinon from "sinon";
import EventManager from "../src";
import { pause } from "../src/lib/helper";

describe("Event Manager, emit then wait response from multiple services", () => {
  let sandbox: sinon.SinonSandbox;
  let eventManager: EventManager;

  beforeEach(() => {
    eventManager = new EventManager({
      logLevel: "error",
      application: "unittest"
    });
    sandbox = sinon.createSandbox();
  });
  afterEach(async () => {
    await eventManager.close();
    sandbox.restore();
  });

  it("Should be able to emit and wait for response two instances", async () => {
    /** given */

    /** when */
    eventManager.on("add", async payload => {
      return { result: payload.a + payload.b };
    });
    const response = await eventManager.emitAndWait("add", { a: 32, b: 38 });
    /** then */
    expect(response.result).to.equal(70);
  });

  it("Should be able to emit and wait for response three instances", async () => {
    /** given */

    /** when */
    eventManager.on("add", async payload => {
      return { result: payload.a + payload.b };
    });
    eventManager.on("multiply", async payload => {
      return { result: payload.a * payload.b };
    });
    const addResponse = await eventManager.emitAndWait("add", { a: 42, b: 42 });
    const multiplyResponse = await eventManager.emitAndWait("multiply", {
      a: addResponse.result,
      b: 3
    });
    /** then */
    expect(multiplyResponse.result).to.equal(252);
  });

  it("Should be able to emit and wait for response two times", async () => {
    /** given */

    /** when */
    eventManager.on("add", async payload => {
      return { result: payload.a + payload.b };
    });

    const add1 = await eventManager.emitAndWait("add", { a: 3, b: 42 });
    const add2 = await eventManager.emitAndWait("add", { a: 3, b: 3 });
    /** then */
    expect(add1.result).to.equal(45);
    expect(add2.result).to.equal(6);
  });

  it("Should be able to emit and wait for response three instances", async () => {
    /** given */

    /** when */
    eventManager.on("calculate", async payload => {
      const response = await eventManager.emitAndWait(payload.operation, {
        a: payload.a,
        b: payload.b
      });
      return { result: response.result };
    });
    eventManager.on("multiply", async payload => {
      return { result: payload.a * payload.b };
    });
    eventManager.on("divide", async payload => {
      return { result: payload.a / payload.b };
    });

    const multiply = await eventManager.emitAndWait("calculate", {
      operation: "multiply",
      a: 3,
      b: 42
    });
    const divide = await eventManager.emitAndWait("calculate", {
      operation: "divide",
      a: 3,
      b: 3
    });

    /** then */
    expect(multiply.result).to.equal(126);
    expect(divide.result).to.equal(1);
  });
});
