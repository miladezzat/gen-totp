import { expect } from "chai";
import { createHmac } from "node:crypto";
import {
  base32ToHex, bytesToBase32, genHOTP, genTOTP, verifyHOTP, verifyTOTP,
  generateSecretKey, generateOtpAuthUri, GenHOTPOptions,
} from "../src";

const secret = "12345678901234567890";

function referenceHOTP(key: string, counter: number, digits: number, algorithm = "sha1"): string {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac(algorithm, key).update(message).digest();
  const offset = hmac[hmac.length - 1] & 15;
  const value = hmac.readUInt32BE(offset) & 0x7fffffff;
  return String(value % (10 ** digits)).padStart(digits, "0");
}

describe("RFC 4226 complete HOTP vectors", () => {
  ["755224", "287082", "359152", "969429", "338314", "254676", "287922", "162583", "399871", "520489"]
    .forEach((expected, counter) => {
      it("matches counter " + counter, () => expect(genHOTP(secret, counter)).to.equal(expected));
    });
});

describe("Fixed-width OTP and counter regressions", () => {
  it("preserves a leading zero from the RFC 6238 SHA-1 vector", () => {
    expect(genTOTP(secret, { digits: 8 }, 1111111109000)).to.equal("07081804");
  });
  for (let digits = 1; digits <= 10; digits += 1) {
    it("matches independent HMAC truncation with " + digits + " digits", () => {
      for (let counter = 0; counter < 30; counter += 1) {
        expect(genHOTP(secret, counter, { digits })).to.equal(referenceHOTP(secret, counter, digits));
      }
    });
  }
  it("preserves leading zeros for 10-digit HOTP", () => {
    expect(genHOTP(secret, 0, { digits: 10 })).to.equal("1284755224");
    expect(genHOTP(secret, 1, { digits: 10 })).to.equal("1094287082");
    expect(genHOTP(secret, 4, { digits: 10 })).to.equal("1640338314");
    expect(genHOTP(secret, 2, { digits: 10 })).to.equal("0137359152");
    expect(genHOTP(secret, 12, { digits: 10 })).to.equal(referenceHOTP(secret, 12, 10));
  });
  it("handles subsecond periods without rounding down the timestamp first", () => {
    expect(genTOTP(secret, { period: 0.5 }, 750)).to.equal(genHOTP(secret, 1));
  });
  for (const [period, milliseconds] of [[0.07, 70], [0.1, 100], [0.29, 290], [30.1, 30100], [31.9, 31900]]) {
    it("uses exact decimal boundaries for period " + period, () => {
      for (const counter of [1, 3, 13, 100]) {
        const timestamp = milliseconds * counter;
        const expected = genHOTP(secret, counter);
        expect(genTOTP(secret, { period }, timestamp - 1)).to.equal(genHOTP(secret, counter - 1));
        expect(genTOTP(secret, { period }, timestamp)).to.equal(expected);
        expect(genTOTP(secret, { period }, timestamp + 1)).to.equal(expected);
        expect(verifyTOTP(secret, expected, { period, window: 0 }, timestamp)).to.equal(true);
      }
    });
  }
  it("handles scientific notation and sub-millisecond decimal periods", () => {
    expect(genTOTP(secret, { period: 1e-6 }, 0.003)).to.equal(genHOTP(secret, 3));
    expect(genTOTP(secret, { period: Number.MAX_VALUE }, Number.MAX_SAFE_INTEGER)).to.equal(genHOTP(secret, 0));
    expect(genTOTP(secret, { period: Number.MIN_VALUE }, 0)).to.equal(genHOTP(secret, 0));
    expect(() => genTOTP(secret, { period: Number.MIN_VALUE }, 1)).to.throw("Invalid counter");
  });
  it("supports counters above 32 bits and at the safe integer limit", () => {
    for (const counter of [2 ** 32, Number.MAX_SAFE_INTEGER]) {
      expect(genHOTP(secret, counter)).to.equal(referenceHOTP(secret, counter, 6));
    }
  });
  it("verifies epoch-zero tokens using the default window", () => {
    expect(verifyTOTP(secret, genTOTP(secret, {}, 0), {}, 0)).to.equal(true);
  });
  it("does not accept an HOTP token a second time after advancing its counter", () => {
    const token = genHOTP(secret, 0);
    expect(verifyHOTP(secret, token, 0, { window: 0 })).to.deep.equal({ newCounter: 1 });
    expect(verifyHOTP(secret, token, 1, { window: 0 })).to.equal(null);
  });
});

describe("RFC 4648 Base32 vectors", () => {
  const vectors = [["", ""], ["f", "MY======"], ["fo", "MZXQ===="], ["foo", "MZXW6==="],
    ["foob", "MZXW6YQ="], ["fooba", "MZXW6YTB"], ["foobar", "MZXW6YTBOI======"]];
  for (const [raw, encoded] of vectors) {
    it("round trips " + JSON.stringify(raw) + " with and without padding", () => {
      const hex = Buffer.from(raw).toString("hex");
      expect(base32ToHex(encoded)).to.equal(hex);
      expect(base32ToHex(encoded.replace(/=+$/, "").toLowerCase())).to.equal(hex);
      expect(bytesToBase32(Buffer.from(raw))).to.equal(encoded.replace(/=+$/, ""));
    });
  }
  it("decodes arbitrary byte lengths without trailing nibbles", () => {
    for (let length = 1; length <= 128; length += 1) {
      const bytes = Uint8Array.from({ length }, (_, index) => (index * 31 + length) % 256);
      const encoded = bytesToBase32(bytes);
      expect(base32ToHex(encoded)).to.equal(Buffer.from(bytes).toString("hex"));
      expect(genHOTP(encoded, 2, { encoding: "base32" }))
        .to.equal(genHOTP(Buffer.from(bytes).toString("hex"), 2, { encoding: "hex" }));
    }
  });
  for (const malformed of ["A", "AAA", "AAAAAA", "MY=", "MZXQ===", "MZXW6YTB=", "MZ", "MY====A=", "========"]) {
    it("rejects malformed Base32 " + malformed, () => {
      expect(() => base32ToHex(malformed)).to.throw();
    });
  }
  it("produces usable secrets at every byte-length remainder", () => {
    for (let length = 1; length <= 20; length += 1) {
      const key = generateSecretKey(length);
      expect(base32ToHex(key)).to.have.lengthOf(length * 2);
      expect(genTOTP(key, { encoding: "base32" }, 59000)).to.match(/^\d{6}$/);
    }
  });
});

describe("Input validation and verification limits", () => {
  for (const digits of [0, -1, 11, 1.5, Infinity, NaN]) {
    it("rejects invalid digit count " + digits, () => {
      expect(() => genTOTP(secret, { digits }, 0)).to.throw("Invalid digits");
      expect(() => genHOTP(secret, 0, { digits })).to.throw("Invalid digits");
    });
  }
  for (const period of [0, -1, Infinity, NaN]) {
    it("rejects invalid period " + period, () => {
      expect(() => genTOTP(secret, { period }, 0)).to.throw("Invalid period");
      expect(() => verifyTOTP(secret, "000000", { period }, 0)).to.throw("Invalid period");
    });
  }
  for (const counter of [-1, 0.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
    it("rejects invalid counter " + counter, () => {
      expect(() => genHOTP(secret, counter)).to.throw("Invalid counter");
      expect(() => verifyHOTP(secret, "000000", counter)).to.throw("Invalid counter");
    });
  }
  for (const timestamp of [-1, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
    it("rejects invalid timestamp " + timestamp, () => {
      expect(() => genTOTP(secret, {}, timestamp)).to.throw("Invalid timestamp");
    });
  }
  for (const window of [-1, 0.5, Infinity, NaN, 1001]) {
    it("rejects invalid verification window " + window, () => {
      expect(() => verifyTOTP(secret, "000000", { window }, 0)).to.throw("Invalid window");
      expect(() => verifyHOTP(secret, "000000", 0, { window })).to.throw("Invalid window");
    });
  }
  it("rejects a lookahead that would return an unsafe counter", () => {
    expect(() => verifyHOTP(secret, "000000", Number.MAX_SAFE_INTEGER, { window: 0 })).to.throw("Invalid counter");
  });
  for (const token of ["12345", "1234567", "12345a", "１２３４５６", "", " 755224", "755224\n", "75522\n"]) {
    it("rejects malformed token " + JSON.stringify(token), () => {
      expect(verifyHOTP(secret, token, 0)).to.equal(null);
      expect(verifyTOTP(secret, token, {}, 0)).to.equal(false);
    });
  }
  it("rejects unknown encodings and algorithms", () => {
    expect(() => genHOTP(secret, 0, { encoding: "invalid" } as unknown as GenHOTPOptions)).to.throw("Invalid key encoding");
    expect(() => genHOTP(secret, 0, { algorithm: "MD5" } as unknown as GenHOTPOptions)).to.throw("Invalid algorithm");
  });
  it("rejects empty keys and incomplete hexadecimal bytes", () => {
    expect(() => genHOTP("", 0)).to.throw("Invalid key");
    expect(() => genHOTP("", 0, { encoding: "base32" })).to.throw("Invalid key");
    expect(() => genHOTP("abc", 0, { encoding: "hex" })).to.throw("Invalid hex");
  });
  it("rejects zero and fractional secret lengths", () => {
    for (const length of [0, -1, 1.5, Infinity, NaN]) expect(() => generateSecretKey(length)).to.throw("Invalid secret length");
  });
});

describe("Authenticator URI validation", () => {
  const options = { accountName: "user@example.com", issuer: "Example" };
  it("normalizes lowercase padded Base32", () => {
    const uri = new URL(generateOtpAuthUri("mzxq====", options));
    expect(uri.searchParams.get("secret")).to.equal("MZXQ");
  });
  it("rejects empty keys, malformed labels, and unsupported URI algorithms", () => {
    expect(() => generateOtpAuthUri("", options)).to.throw("Invalid base32");
    expect(() => generateOtpAuthUri("MY", { ...options, accountName: "" })).to.throw("Invalid account name");
    expect(() => generateOtpAuthUri("MY", { ...options, issuer: "bad:issuer" })).to.throw("Invalid issuer");
    expect(() => generateOtpAuthUri("MY", { ...options, algorithm: "SHA3-256" })).to.throw("Unsupported otpauth");
    expect(() => generateOtpAuthUri("MY", { ...options, period: 0.5 })).to.throw("Invalid otpauth period");
    expect(() => generateOtpAuthUri("MY", { ...options, digits: 0 })).to.throw("Invalid digits");
    expect(() => generateOtpAuthUri("MY", { ...options, digits: 4 })).to.throw("Invalid otpauth digits");
  });
});


describe("Additional algorithms and encoding interoperability", () => {
  const algorithms: GenHOTPOptions["algorithm"][] = ["SHA-1", "SHA-224", "SHA-256", "SHA-384", "SHA-512", "SHA3-224", "SHA3-256", "SHA3-384", "SHA3-512"];
  for (const algorithm of algorithms) {
    it("matches Node crypto for " + algorithm, () => {
      const nodeAlgorithm = algorithm!.startsWith("SHA3") ? algorithm!.toLowerCase() : algorithm!.replace("-", "").toLowerCase();
      expect(genHOTP(secret, 20, { algorithm, digits: 8 })).to.equal(referenceHOTP(secret, 20, 8, nodeAlgorithm));
    });
  }
  it("uses the same bytes for UTF-8, uppercase hex, and Base32 secrets", () => {
    const key = "secretKey你好😊🔑";
    const bytes = Buffer.from(key);
    const expected = genHOTP(key, 123);
    expect(genHOTP(bytes.toString("hex").toUpperCase(), 123, { encoding: "hex" })).to.equal(expected);
    expect(genHOTP(bytesToBase32(bytes), 123, { encoding: "base32" })).to.equal(expected);
  });
  it("changes counters exactly at period boundaries", () => {
    expect(genTOTP(secret, {}, 29999)).to.equal(genHOTP(secret, 0));
    expect(genTOTP(secret, {}, 30000)).to.equal(genHOTP(secret, 1));
    expect(genTOTP(secret, { period: 60 }, 59999)).to.equal(genHOTP(secret, 0));
    expect(genTOTP(secret, { period: 60 }, 60000)).to.equal(genHOTP(secret, 1));
  });
});
