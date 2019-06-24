import { expect } from "chai";
import { describe, it } from "mocha";
import * as sinon from "sinon";
import EventManager from "../src/index";

describe("Event Manager, Should listen events ", () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });

  it(`Should create a channel to be able to listen a event`, done => {
    /** given */
    const eventManager = new EventManager();

    eventManager.on("DEMO", payload => {
      try {
        // then
        expect(payload).to.have.property("_metas");
        done();
      } catch (err) {
        done(err);
      }
    });
    // when
    eventManager.emit("DEMO", { id: 1 });
  });

  it(`Should add App Name in Metas`, done => {
    /** given */
    const eventManager = new EventManager({ application: "myApp" });

    eventManager.on("DEMO", payload => {
      try {
        // then
        expect(payload._metas).to.have.property("application");
        if (payload._metas) {
          expect(payload._metas.application).to.equal("myApp");
          done();
        } else {
          done(new Error("Should have _metas"));
        }
      } catch (err) {
        done(err);
      }
    });
    // when
    eventManager.emit("DEMO", { id: 1 });
  });

  it(`Should be able to listen multiples times`, done => {
    /** given */
    const eventManager = new EventManager({ application: "myApp" });
    let counter = 0;
    for (let i = 0; i < 4; i++) {
      eventManager.on("DEMO", payload => {
        counter++;
      });
    }
    setTimeout(() => {
      expect(counter).to.equal(4);
      done();
    }, 500);
    // when
    eventManager.emit("DEMO", { id: 1 });
  });

  it(`Should be even if one crash to listen multiples times`, done => {
    /** given */
    const eventManager = new EventManager({ application: "myApp" });
    let counter = 0;
    for (let i = 0; i < 4; i++) {
      eventManager.on("DEMO", payload => {
        counter++;
        if (i === 3) {
          throw new Error("Random Error");
        }
      });
    }
    setTimeout(() => {
      expect(counter).to.equal(4);
      done();
    }, 500);
    // when
    eventManager.emit("DEMO", { id: 1 });
  });
});
