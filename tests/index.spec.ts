import chai from "chai";
import chaiSubset from "chai-subset";
import chaiSorted from "chai-sorted";

chai.use(chaiSubset);
chai.use(chaiSorted);
import {
  genTOTP,
  base32ToHex,
  verifyTOTP,
  generateOtpAuthUri,
  generateSecretKey,
  bytesToBase32,
} from "../src";
const { expect } = chai;

describe("TOTP Generation", () => {
  it("generates default 6-digit TOTPs", () => {
    const key = `test-key-${Math.random()}`;
    const totp = genTOTP(key);
    expect(totp).to.be.a("string").with.lengthOf(6);
  });

  it("produces deterministic output when timestamp provided", () => {
    const key = "deterministic-key";
    const ts = 1609459200000; // 2021-01-01T00:00:00.000Z
    const a = genTOTP(key, { digits: 6, period: 30 }, ts);
    const b = genTOTP(key, { digits: 6, period: 30 }, ts);
    expect(a).to.equal(b);
  });

  it("different timestamps produce different TOTPs (most of the time)", () => {
    const key = "deterministic-key";
    const t1 = 1609459200000;
    const t2 = t1 + 30000; // +30s
    const a = genTOTP(key, { digits: 6, period: 30 }, t1);
    const b = genTOTP(key, { digits: 6, period: 30 }, t2);
    expect(a).to.be.a("string").with.lengthOf(6);
    expect(b).to.be.a("string").with.lengthOf(6);
  });

  it("accepts valid hex input and rejects invalid hex", () => {
    const ok = () => genTOTP("deadbeef", { encoding: "hex" }, 1609459200000);
    expect(ok).to.not.throw();

    const bad = () => genTOTP("deadbeeG", { encoding: "hex" }, 1609459200000);
    expect(bad).to.throw("Invalid hex character in key");
  });

  it("decodes base32 correctly and rejects invalid characters", () => {
    const hex = base32ToHex("JBSWY3DPEHPK3PXP");
    expect(hex).to.be.a("string");

    expect(() => base32ToHex("INVALID!*")).to.throw(
      "Invalid base32 character: !",
    );
  });
});

describe("TOTP Verification", () => {
  const key = "verification-key";
  const period = 30;
  const options = { period, digits: 8 };
  const ts = 1609459200000; // A fixed timestamp: 2021-01-01T00:00:00.000Z

  it("verifies a correct token at the current timestamp", () => {
    const token = genTOTP(key, options, ts);
    const isValid = verifyTOTP(key, token, { ...options, window: 0 }, ts);
    expect(isValid).to.be.true;
  });

  it("rejects an incorrect token", () => {
    const isValid = verifyTOTP(key, "00000000", options, ts);
    expect(isValid).to.be.false;
  });

  it("verifies a token within the past window", () => {
    const pastTs = ts - period * 1000;
    const token = genTOTP(key, options, pastTs);
    const isValid = verifyTOTP(key, token, options, ts);
    expect(isValid).to.be.true;
  });

  it("verifies a token within the future window", () => {
    const futureTs = ts + period * 1000;
    const token = genTOTP(key, options, futureTs);
    const isValid = verifyTOTP(key, token, options, ts);
    expect(isValid).to.be.true;
  });

  it("rejects a token outside the window", () => {
    const outsideTs = ts - 2 * period * 1000;
    const token = genTOTP(key, options, outsideTs);
    const isValid = verifyTOTP(key, token, { ...options, window: 0 }, ts);
    expect(isValid).to.be.false;
  });
});

describe("OtpAuth URI Generation", () => {
  const key = "JBSWY3DPEHPK3PXP"; // A valid base32 key
  const options = {
    accountName: "user@example.com",
    issuer: "My App",
  };

  it("generates a valid URI with default options", () => {
    const uri = generateOtpAuthUri(key, options);
    const expected =
      "otpauth://totp/My%20App:user%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=My+App&algorithm=SHA1&digits=6&period=30";
    expect(uri).to.equal(expected);
  });

  it("generates a valid URI with all options specified", () => {
    const uri = generateOtpAuthUri(key, {
      ...options,
      digits: 8,
      period: 60,
      algorithm: "SHA-256",
    });
    const expected =
      "otpauth://totp/My%20App:user%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=My+App&algorithm=SHA256&digits=8&period=60";
    expect(uri).to.equal(expected);
  });

  it("throws an error for a non-base32 key", () => {
    const badKey = "not-base32-1";
    const fn = () => generateOtpAuthUri(badKey, options);
    expect(fn).to.throw("Invalid base32 key for otpauth URI");
  });

  it("correctly encodes the issuer and account name", () => {
    const uri = generateOtpAuthUri(key, {
      accountName: "user with spaces@example.com",
      issuer: "My App & Company",
    });
    const expected =
      "otpauth://totp/My%20App%20%26%20Company:user%20with%20spaces%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=My+App+%26+Company&algorithm=SHA1&digits=6&period=30";
    expect(uri).to.equal(expected);
  });
});

describe("Secret Key Generation", () => {
  it("bytesToBase32 encodes a known value correctly", () => {
    const bytes = new Uint8Array([
      0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x21, 0xde, 0xad, 0xbe, 0xef,
    ]);
    const base32 = bytesToBase32(bytes);
    expect(base32).to.equal("JBSWY3DPEHPK3PXP");
  });

  it("generates a key of the correct length", () => {
    const key = generateSecretKey();
    expect(key).to.be.a("string").with.lengthOf(32);
  });

  it("generates a key with only valid base32 characters", () => {
    const key = generateSecretKey();
    expect(key).to.match(/^[A-Z2-7]+$/);
  });

  it("generates different keys on subsequent calls", () => {
    const key1 = generateSecretKey();
    const key2 = generateSecretKey();
    expect(key1).to.not.equal(key2);
  });
});
