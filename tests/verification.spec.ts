import { expect } from "chai";
import { createHmac } from "node:crypto";
import { bytesToBase32, genHOTP, verifyHOTP, verifyTOTP, GenHOTPOptions, KeyEncoding } from "../src";

const key = "12345678901234567890";
const algorithms: NonNullable<GenHOTPOptions["algorithm"]>[] = [
  "SHA-1", "SHA-224", "SHA-256", "SHA-384", "SHA-512", "SHA3-224", "SHA3-256", "SHA3-384", "SHA3-512",
];

function reference(counter: number, algorithm: string): string {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac(algorithm, key).update(message).digest();
  return String((hmac.readUInt32BE(hmac[hmac.length - 1] & 15) & 0x7fffffff) % 100000000).padStart(8, "0");
}

describe("Verification with one decoded secret per window", () => {
  for (const algorithm of algorithms) {
    for (const encoding of ["utf8", "hex", "base32"] as KeyEncoding[]) {
      it("matches independent window vectors for " + algorithm + " / " + encoding, () => {
        const encoded = encoding === "utf8" ? key : encoding === "hex" ? Buffer.from(key).toString("hex") : bytesToBase32(Buffer.from(key));
        const options = { algorithm, encoding, digits: 8, window: 3 };
        const nodeAlgorithm = algorithm.startsWith("SHA3") ? algorithm.toLowerCase() : algorithm.replace("-", "").toLowerCase();
        const counter = 2 ** 32;
        for (let delta = -4; delta <= 4; delta += 1) {
          const token = reference(counter + delta, nodeAlgorithm);
          expect(verifyTOTP(encoded, token, options, counter * 30000)).to.equal(Math.abs(delta) <= 3);
          expect(verifyHOTP(encoded, token, counter, options)).to.deep.equal(
            delta >= 0 && delta <= 3 ? { newCounter: counter + delta + 1 } : null,
          );
        }
      });
    }
  }
  it("keeps the earliest HOTP match when short tokens collide", () => {
    const options = { digits: 1, window: 100 };
    const token = genHOTP(key, 100, options);
    let first = 0;
    while (genHOTP(key, first, options) !== token) first += 1;
    expect(first).to.be.lessThan(100);
    expect(verifyHOTP(key, token, 0, options)).to.deep.equal({ newCounter: first + 1 });
  });
  it("validates secrets even when the token shape is invalid", () => {
    for (const token of ["", "not-a-token"]) {
      expect(() => verifyTOTP("MZ", token, { encoding: "base32" }, 0)).to.throw("unused bits");
      expect(() => verifyHOTP("abc", token, 0, { encoding: "hex" })).to.throw("Invalid hex");
    }
  });
});
