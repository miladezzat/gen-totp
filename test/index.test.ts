import chai from "./chai"; // Import the default export from chai.ts
import getTOTP from "../src";
// Ensure this is the path to your module
const { expect } = chai; // Destructure `expect` from the default export

interface IError extends Error {
  message: string;
}

describe("TOTP Generation", () => {
  it("should generate a 6-digit TOTP successfully with specified digits", () => {
    const key: string = `test-key-${Math.random()}`;
    const totp: string = getTOTP(key, { digits: 6 });
    expect(totp).to.be.a("string").with.lengthOf(6);
  });

  it("should generate a 6-digit TOTP by default", () => {
    const key: string = `test-key-${Math.random()}`;
    const totp: string = getTOTP(key);
    expect(totp).to.be.a("string").with.lengthOf(6);
  });

  it("should generate a 6-digit TOTP with a 1-second period", () => {
    const key: string = "test-key";
    const totp: string = getTOTP(key, { period: 1 });
    expect(totp).to.be.a("string").with.lengthOf(6);
  });

  it("should generate a 6-digit TOTP with a valid key", () => {
    const key: string = "milad@gmail.com";
    const totp: string = getTOTP(key, { period: 1 });
    expect(totp).to.be.a("string").with.lengthOf(6);
  });

  it("should throw an error for an invalid base32 character in key", () => {
    const key: string = "invalid-key*&^";
    try {
      getTOTP(key, { digits: 6 });
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
    const totp = getTOTP(key, { digits: 6 });
    expect(totp).to.be.a("string").with.length(6);
  });

  it("success to get TOTP", () => {
    const key = Math.random().toString();
    const totp = getTOTP(key);
    expect(totp).to.be.a("string").with.length(6);
  });

  it("success to get TOTP", () => {
    const totp = getTOTP("dsfkkldsfnwhefkjdfhjksdfhkjdsfhlkdjf", { period: 1 });
    expect(totp).to.be.a("string").with.length(6);
  });

  it("success to get TOTP", () => {
    const totp = getTOTP("milad@gmail.com", { period: 1 });
    expect(totp).to.be.a("string").with.length(6);
  });

  it("fail to get TOTP", () => {
    try {
      getTOTP("sdf&*`", { digits: 6 });
    } catch (error: unknown) {
      expect((error as IError).message)
        .to.be.a("string")
        .to.be.equal("Invalid base32 character in key");
    }
  });
});
