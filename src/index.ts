import JsSHA from "jssha";
import { randomBytes } from "crypto";

/**
 * Left pads a string to a specified length.
 * @param {string} str - The string to pad.
 * @param {number} len - The desired length.
 * @param {string} pad - The padding character.
 * @returns {string} The padded string.
 */
export function leftPad(str: string, len: number, pad: string): string {
  return str.length >= len ? str : pad.repeat(len - str.length) + str;
}

/**
 * Decodes a base32-encoded string to hexadecimal.
 * Supports RFC 4648 Base32.
 * @param {string} input - The base32 string.
 * @returns {string} The decoded hexadecimal string.
 */
export function base32ToHex(input: string): string {
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleanInput = input.toUpperCase().replace(/=+$/, "");
  let bits = "";
  let hex = "";

  for (const char of cleanInput) {
    const val = base32Chars.indexOf(char);
    if (val === -1) {
      throw new Error(`Invalid base32 character: ${char}`);
    }
    bits += leftPad(val.toString(2), 5, "0");
  }

  for (let i = 0; i + 4 <= bits.length; i += 4) {
    const chunk = bits.slice(i, i + 4);
    hex += parseInt(chunk, 2).toString(16);
  }

  return hex;
}

/**
 * Converts a hexadecimal string to a decimal number.
 * @param {string} hex - The hexadecimal string.
 * @returns {number} The decimal number.
 */
export function hexToDec(hex: string): number {
  return parseInt(hex, 16);
}

/**
 * Converts a decimal number to a hexadecimal string.
 * @param {number} dec - The decimal number.
 * @returns {string} The hexadecimal string.
 */
export function decToHex(dec: number): string {
  return leftPad(Math.round(dec).toString(16), 2, "0");
}

export type FixedLengthVariantType =
  | "SHA-1"
  | "SHA-224"
  | "SHA-256"
  | "SHA-384"
  | "SHA-512"
  | "SHA3-224"
  | "SHA3-256"
  | "SHA3-384"
  | "SHA3-512";

export type KeyEncoding = "utf8" | "hex" | "base32";

/**
 * Options for generating a TOTP.
 */
interface GenTOTPOptions {
  period?: number;
  algorithm?: FixedLengthVariantType;
  digits?: number;
  encoding?: KeyEncoding;
}

/**
 * Generates a TOTP (Time-based One-Time Password).
 * @param {string} key - The secret key.
 * @param {GenTOTPOptions} [options={}] - Configuration options.
 * @param {number} [options.period=30] - Time period in seconds.
 * @param {string} [options.algorithm='SHA-1'] - Hash algorithm.
 * @param {number} [options.digits=6] - Length of the resulting OTP.
 * @param {KeyEncoding} [options.encoding='utf8'] - Encoding of the key ('utf8', 'hex', or 'base32').
 * @returns {string} The generated OTP.
 */
export function genTOTP(
  key: string,
  options: GenTOTPOptions = {},
  // Optional unix-milliseconds timestamp for deterministic outputs / testing
  timestamp?: number,
): string {
  const {
    period = 30,
    algorithm = "SHA-1",
    digits = 6,
    encoding = "utf8",
  } = options;

  const epoch = Math.floor((typeof timestamp === "number" ? timestamp : Date.now()) / 1000);
  const timeHex = leftPad(decToHex(Math.floor(epoch / period)), 16, "0");

  let hexKey: string;

  if (encoding === "hex") {
    const lower = key.toLowerCase();
    if (!/^[0-9a-f]+$/.test(lower)) {
      throw new Error("Invalid hex character in key");
    }
    hexKey = lower;
  } else if (encoding === "base32") {
    hexKey = base32ToHex(key);
  } else {
    // utf8 to hex
    const encoder = new TextEncoder();
    hexKey = Array.from(encoder.encode(key))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  const shaObj = new JsSHA(algorithm, "HEX");
  shaObj.setHMACKey(hexKey, "HEX");
  shaObj.update(timeHex);

  const hmac = shaObj.getHMAC("HEX");
  const offset = hexToDec(hmac[hmac.length - 1]);
  const code = (hexToDec(hmac.slice(offset * 2, offset * 2 + 8)) & 0x7fffffff).toString();

  return code.slice(-digits);
}

/**
 * Options for verifying a TOTP.
 */
export interface VerifyTOTPOptions extends GenTOTPOptions {
  window?: number;
}


/**
 * Verifies a TOTP (Time-based One-Time Password).
 * @param {string} key - The secret key.
 * @param {string} token - The token to verify.
 * @param {VerifyTOTPOptions} [options={}] - Configuration options.
 * @returns {boolean} True if the token is valid, false otherwise.
 */
export function verifyTOTP(
  key: string,
  token: string,
  options: VerifyTOTPOptions = {},
  // Optional unix-milliseconds timestamp for deterministic outputs / testing
  timestamp?: number,
): boolean {
  const { window = 1, period = 30 } = options;
  const now = typeof timestamp === "number" ? timestamp : Date.now();

  for (let i = -window; i <= window; i++) {
    const stepTimestamp = now + i * period * 1000;
    const generatedToken = genTOTP(key, options, stepTimestamp);
    if (generatedToken === token) {
      return true;
    }
  }

  return false;
}

/**
 * Options for generating an otpauth URI.
 */
export interface OtpAuthUriOptions {
  accountName: string;
  issuer: string;
  period?: number;
  algorithm?: FixedLengthVariantType;
  digits?: number;
}

/**
 * Generates an otpauth URI for QR code generation.
 * @param {string} key - The base32-encoded secret key.
 * @param {OtpAuthUriOptions} options - Configuration options.
 * @returns {string} The otpauth URI.
 */
export function generateOtpAuthUri(
  key: string,
  options: OtpAuthUriOptions,
): string {
  const {
    accountName,
    issuer,
    period = 30,
    algorithm = "SHA-1",
    digits = 6,
  } = options;

  try {
    base32ToHex(key);
  } catch (e) {
    throw new Error("Invalid base32 key for otpauth URI");
  }

  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccountName = encodeURIComponent(accountName);
  const label = `${encodedIssuer}:${encodedAccountName}`;

  const query = new URLSearchParams({
    secret: key,
    issuer,
    algorithm: algorithm.replace("SHA-", "SHA"),
    digits: digits.toString(),
    period: period.toString(),
  });

  return `otpauth://totp/${label}?${query.toString()}`;
}

/**
 * Encodes a byte array to a base32 string.
 * @param {Uint8Array} bytes - The bytes to encode.
 * @returns {string} The base32-encoded string.
 */
export function bytesToBase32(bytes: Uint8Array): string {
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (let i = 0; i < bytes.length; i++) {
    bits += leftPad(bytes[i].toString(2), 8, "0");
  }

  let base32 = "";
  for (let i = 0; i < bits.length; i += 5) {
    let chunk = bits.slice(i, i + 5);
    if (chunk.length < 5) {
      chunk += "0".repeat(5 - chunk.length);
    }
    const val = parseInt(chunk, 2);
    base32 += base32Chars[val];
  }

  return base32;
}

/**
 * Generates a cryptographically secure secret key.
 * @param {number} [length=20] - The length of the key in bytes.
 * @returns {string} The base32-encoded secret key.
 */
export function generateSecretKey(length = 20): string {
  const bytes = randomBytes(length);
  return bytesToBase32(bytes);
}

/**
 * Options for generating an HOTP.
 */
export interface GenHOTPOptions {
  algorithm?: FixedLengthVariantType;
  digits?: number;
  encoding?: KeyEncoding;
}

/**
 * Generates an HOTP (HMAC-based One-Time Password).
 * @param {string} key - The secret key.
 * @param {number} counter - The counter value.
 * @param {GenHOTPOptions} [options={}] - Configuration options.
 * @returns {string} The generated OTP.
 */
export function genHOTP(
  key: string,
  counter: number,
  options: GenHOTPOptions = {},
): string {
  const {
    algorithm = "SHA-1",
    digits = 6,
    encoding = "utf8",
  } = options;

  const counterHex = leftPad(decToHex(counter), 16, "0");

  let hexKey: string;

  if (encoding === "hex") {
    const lower = key.toLowerCase();
    if (!/^[0-9a-f]+$/.test(lower)) {
      throw new Error("Invalid hex character in key");
    }
    hexKey = lower;
  } else if (encoding === "base32") {
    hexKey = base32ToHex(key);
  } else {
    // utf8 to hex
    const encoder = new TextEncoder();
    hexKey = Array.from(encoder.encode(key))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  const shaObj = new JsSHA(algorithm, "HEX");
  shaObj.setHMACKey(hexKey, "HEX");
  shaObj.update(counterHex);

  const hmac = shaObj.getHMAC("HEX");
  const offset = hexToDec(hmac[hmac.length - 1]);
  const code = (hexToDec(hmac.slice(offset * 2, offset * 2 + 8)) & 0x7fffffff).toString();

  return code.slice(-digits);
}

/**
 * Options for verifying an HOTP.
 */
export interface VerifyHOTPOptions extends GenHOTPOptions {
  window?: number;
}

/**
 * Verifies an HOTP (HMAC-based One-Time Password).
 * @param {string} key - The secret key.
 * @param {string} token - The token to verify.
 * @param {number} counter - The current counter value.
 * @param {VerifyHOTPOptions} [options={}] - Configuration options.
 * @returns {{newCounter: number} | null} The new counter value if the token is valid, otherwise null.
 */
export function verifyHOTP(
  key: string,
  token: string,
  counter: number,
  options: VerifyHOTPOptions = {},
): { newCounter: number } | null {
  const { window = 10 } = options;

  for (let i = 0; i <= window; i++) {
    const currentCounter = counter + i;
    const generatedToken = genHOTP(key, currentCounter, options);
    if (generatedToken === token) {
      return { newCounter: currentCounter + 1 };
    }
  }

  return null;
}

export default genTOTP;