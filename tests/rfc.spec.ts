import { expect } from "chai";
import { genTOTP, FixedLengthVariantType } from "../src";

describe("RFC 6238 complete test vectors", () => {
  const secrets = {
    "SHA-1": "12345678901234567890",
    "SHA-256": "12345678901234567890123456789012",
    "SHA-512": "1234567890123456789012345678901234567890123456789012345678901234",
  };
  const vectors: [number, string, string, string][] = [
    [59, "94287082", "46119246", "90693936"],
    [1111111109, "07081804", "68084774", "25091201"],
    [1111111111, "14050471", "67062674", "99943326"],
    [1234567890, "89005924", "91819424", "93441116"],
    [2000000000, "69279037", "90698825", "38618901"],
    [20000000000, "65353130", "77737706", "47863826"],
  ];
  for (const [time, ...expected] of vectors) {
    Object.entries(secrets).forEach(([algorithm, key], index) => {
      it(algorithm + " at " + time, () => {
        expect(genTOTP(key, { algorithm: algorithm as FixedLengthVariantType, digits: 8 }, time * 1000))
          .to.equal(expected[index]);
      });
    });
  }
});
