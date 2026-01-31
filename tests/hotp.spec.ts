import chai from "chai";
import { genHOTP, verifyHOTP } from "../src";
const { expect } = chai;

describe("HOTP Generation", () => {
  const key = "hotp-key";

  it("generates a 6-digit HOTP with counter 0", () => {
    const hotp = genHOTP(key, 0);
    expect(hotp).to.be.a("string").with.lengthOf(6);
  });

  it("generates a different HOTP for a different counter", () => {
    const hotp1 = genHOTP(key, 0);
    const hotp2 = genHOTP(key, 1);
    expect(hotp1).to.not.equal(hotp2);
  });

  it("generates an 8-digit HOTP", () => {
    const hotp = genHOTP(key, 0, { digits: 8 });
    expect(hotp).to.be.a("string").with.lengthOf(8);
  });
});

describe("HOTP Verification", () => {
  const key = "hotp-verification-key";
  const options = { digits: 8 };

  it("verifies a correct token and returns the new counter", () => {
    const token = genHOTP(key, 0, options);
    const result = verifyHOTP(key, token, 0, options);
    expect(result).to.deep.equal({ newCounter: 1 });
  });

  it("rejects an incorrect token", () => {
    const result = verifyHOTP(key, "00000000", 0, options);
    expect(result).to.be.null;
  });

  it("verifies a token within the window and returns the new counter", () => {
    const token = genHOTP(key, 5, options);
    const result = verifyHOTP(key, token, 0, options);
    expect(result).to.deep.equal({ newCounter: 6 });
  });

  it("rejects a token outside the window", () => {
    const token = genHOTP(key, 11, options);
    const result = verifyHOTP(key, token, 0, { ...options, window: 10 });
    expect(result).to.be.null;
  });
});
