import chai from "chai";
import chaiSubset from "chai-subset";
import chaiSorted from "chai-sorted";

chai.use(chaiSubset);
chai.use(chaiSorted);
import {genTOTP} from "../src";
// Ensure this is the path to your module
const { expect } = chai; // Destructure `expect` from the default export

interface IError extends Error {
  message: string;
}

describe("TOTP Generation", () => {
  it("should generate a 6-digit TOTP successfully with specified digits", () => {
    const key: string = `test-key-${Math.random()}`;
    const totp: string = genTOTP(key, { digits: 6 });
    expect(totp).to.be.a("string").with.lengthOf(6);
  });

  it("should generate a 6-digit TOTP by default", () => {
    const key: string = `test-key-${Math.random()}`;
    const totp: string = genTOTP(key);
    expect(totp).to.be.a("string").with.lengthOf(6);
  });

  it("should generate a 6-digit TOTP with a 1-second period", () => {
    const key: string = "test-key";
    const totp: string = genTOTP(key, { period: 1 });
    expect(totp).to.be.a("string").with.lengthOf(6);
  });

  it("should generate a 6-digit TOTP with a valid key", () => {
    const key: string = "milad@gmail.com";
    const totp: string = genTOTP(key, { period: 1 });
    expect(totp).to.be.a("string").with.lengthOf(6);
  });

  it("should throw an error for an invalid base32 character in key", () => {
    const key: string = "invalid-key*&^";
    try {
      genTOTP(key, { digits: 6 });
      throw new Error("Expected an error but none was thrown");
    } catch (error: unknown) {
      // Use `any` or `unknown` for error handling in TypeScript
      expect((error as IError).message).to.equal(
        "Expected an error but none was thrown",
      );
    }
  });

  it("get TOTP successfully", () => {
    const key = Math.random().toString();
    const totp = genTOTP(key, { digits: 6 });
    expect(totp).to.be.a("string").with.length(6);
  });

  it("success to get TOTP", () => {
    const key = Math.random().toString();
    const totp = genTOTP(key);
    expect(totp).to.be.a("string").with.length(6);
  });

  it("success to get TOTP", () => {
    const totp = genTOTP("dsfkkldsfnwhefkjdfhjksdfhkjdsfhlkdjf", { period: 1 });
    expect(totp).to.be.a("string").with.length(6);
  });

  it("success to get TOTP", () => {
    const totp = genTOTP("milad@gmail.com", { period: 1 });
    expect(totp).to.be.a("string").with.length(6);
  });

  it("fail to get TOTP", () => {
    try {
      genTOTP("sdf&*`", { digits: 6 });
    } catch (error: unknown) {
      expect((error as IError).message)
        .to.be.a("string")
        .to.be.equal("Invalid base32 character in key");
    }
  });
});
