import { expect } from "chai";
import { genTOTP } from "../src";

describe("RFC 6238 Test Vectors", () => {
  // Shared secrets from RFC 6238 Appendix B
  const secretSHA1 = "12345678901234567890"; // 20 bytes
  const secretSHA256 = "12345678901234567890123456789012"; // 32 bytes
  const secretSHA512 = "1234567890123456789012345678901234567890123456789012345678901234"; // 64 bytes

  it("SHA1 T=59 -> 94287082", () => {
    const totp = genTOTP(secretSHA1, { algorithm: "SHA-1", digits: 8 }, 59 * 1000);
    expect(totp).to.equal("94287082");
  });

  it("SHA256 T=59 -> 46119246", () => {
    const totp = genTOTP(secretSHA256, { algorithm: "SHA-256", digits: 8 }, 59 * 1000);
    expect(totp).to.equal("46119246");
  });

  it("SHA512 T=59 -> 90693936", () => {
    const totp = genTOTP(secretSHA512, { algorithm: "SHA-512", digits: 8 }, 59 * 1000);
    expect(totp).to.equal("90693936");
  });
});
