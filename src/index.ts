import JsSHA from "jssha";
import { randomBytes, timingSafeEqual } from "node:crypto";

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const ALGORITHMS = [
  "SHA-1", "SHA-224", "SHA-256", "SHA-384", "SHA-512",
  "SHA3-224", "SHA3-256", "SHA3-384", "SHA3-512",
] as const;

export type FixedLengthVariantType = typeof ALGORITHMS[number];
export type KeyEncoding = "utf8" | "hex" | "base32";

export interface GenHOTPOptions {
  algorithm?: FixedLengthVariantType;
  digits?: number;
  encoding?: KeyEncoding;
}
export interface GenTOTPOptions extends GenHOTPOptions { period?: number; }
export interface VerifyTOTPOptions extends GenTOTPOptions { window?: number; }
export interface TOTPMatch { counter: number; delta: number; }
export interface VerifyHOTPOptions extends GenHOTPOptions { window?: number; }
export interface OtpAuthUriOptions {
  accountName: string;
  issuer: string;
  period?: number;
  algorithm?: FixedLengthVariantType;
  digits?: number;
}

export function leftPad(str: string, len: number, pad: string): string {
  return str.length >= len ? str : pad.repeat(len - str.length) + str;
}

/** Decode complete bytes and reject malformed lengths, padding, and unused bits. */
export function base32ToHex(input: string): string {
  if (typeof input !== "string") throw new Error("Invalid base32 input");
  const rawInput = input.replace(/=+$/, "");
  // Check characters before length to preserve the public invalid-character error.
  for (const char of rawInput) {
    if (!/^[A-Z2-7]$/i.test(char)) throw new Error(`Invalid base32 character: ${char}`);
  }
  const cleanInput = rawInput.toUpperCase();
  const padding = input.length - cleanInput.length;
  const remainder = cleanInput.length % 8;
  if (![0, 2, 4, 5, 7].includes(remainder)
    || (padding > 0 && (input.length % 8 !== 0 || padding !== (8 - remainder) % 8))) {
    throw new Error("Invalid base32 length or padding");
  }
  let buffer = 0;
  let bitCount = 0;
  let hex = "";
  for (const char of cleanInput) {
    buffer = (buffer << 5) | BASE32_CHARS.indexOf(char);
    bitCount += 5;
    if (bitCount >= 8) {
      bitCount -= 8;
      hex += ((buffer >>> bitCount) & 0xff).toString(16).padStart(2, "0");
      buffer &= (1 << bitCount) - 1;
    }
  }
  if (buffer !== 0) throw new Error("Invalid base32 unused bits");
  return hex;
}

export function hexToDec(hex: string): number { return parseInt(hex, 16); }
export function decToHex(dec: number): string {
  return leftPad(Math.round(dec).toString(16), 2, "0");
}

function validateOtpOptions(options: GenHOTPOptions): void {
  const { digits = 6, algorithm = "SHA-1", encoding = "utf8" } = options;
  if (!Number.isInteger(digits) || digits < 1 || digits > 10) {
    throw new Error("Invalid digits; must be an integer between 1 and 10");
  }
  if (!ALGORITHMS.includes(algorithm)) throw new Error("Invalid algorithm");
  if (!["utf8", "hex", "base32"].includes(encoding)) throw new Error("Invalid key encoding");
}
function validatePeriod(period: number): void {
  if (!Number.isFinite(period) || period <= 0) {
    throw new Error("Invalid period; must be a positive number");
  }
}
function validateCounter(counter: number): void {
  if (!Number.isSafeInteger(counter) || counter < 0) {
    throw new Error("Invalid counter; must be a non-negative safe integer");
  }
}
function validateWindow(window: number): void {
  if (!Number.isInteger(window) || window < 0 || window > 1000) {
    throw new Error("Invalid window; must be an integer between 0 and 1000");
  }
}
function decimalParts(value: number): [bigint, number] {
  const [coefficient, exponent = "0"] = value.toString().split("e");
  const decimalPlaces = coefficient.includes(".") ? coefficient.length - coefficient.indexOf(".") - 1 : 0;
  return [BigInt(coefficient.replace(".", "")), Number(exponent) - decimalPlaces];
}
function timeCounter(timestamp: number, period: number): number {
  validatePeriod(period);
  if (!Number.isFinite(timestamp) || timestamp < 0 || timestamp > Number.MAX_SAFE_INTEGER) {
    throw new Error("Invalid timestamp; must be non-negative Unix milliseconds within the safe integer range");
  }
  // Divide the decimal inputs in milliseconds exactly. Binary floating-point
  // division can otherwise select the previous counter at a period boundary.
  let [numerator, timestampExponent] = decimalParts(timestamp);
  let [denominator, periodExponent] = decimalParts(period);
  const exponent = timestampExponent - periodExponent - 3;
  if (exponent >= 0) numerator *= 10n ** BigInt(exponent);
  else denominator *= 10n ** BigInt(-exponent);
  const counter = Number(numerator / denominator);
  validateCounter(counter);
  return counter;
}
function keyToHex(key: string, encoding: KeyEncoding): string {
  if (typeof key !== "string" || key.length === 0) throw new Error("Invalid key; must be a non-empty string");
  if (encoding === "hex") {
    if (!/^(?:[0-9a-f]{2})+$/i.test(key)) throw new Error("Invalid hex character in key");
    return key.toLowerCase();
  }
  if (encoding === "base32") {
    const hex = base32ToHex(key);
    if (hex.length === 0) throw new Error("Invalid key; must contain at least one byte");
    return hex;
  }
  return Buffer.from(key, "utf8").toString("hex");
}

/** HOTP with a big-endian counter and fixed-width decimal output. */
export function genHOTP(key: string, counter: number, options: GenHOTPOptions = {}): string {
  validateOtpOptions(options);
  validateCounter(counter);
  const { algorithm = "SHA-1", digits = 6, encoding = "utf8" } = options;
  return hotpFromHex(keyToHex(key, encoding), counter, algorithm, digits);
}
function hotpFromHex(hex: string, counter: number, algorithm: FixedLengthVariantType, digits: number): string {
  const sha = new JsSHA(algorithm, "HEX");
  sha.setHMACKey(hex, "HEX");
  sha.update(counter.toString(16).padStart(16, "0"));
  const hmac = sha.getHMAC("HEX");
  const offset = hexToDec(hmac[hmac.length - 1]);
  const code = hexToDec(hmac.slice(offset * 2, offset * 2 + 8)) & 0x7fffffff;
  return (code % (10 ** digits)).toString().padStart(digits, "0");
}
/** timestamp is Unix milliseconds; defaults to Date.now(). */
export function genTOTP(key: string, options: GenTOTPOptions = {}, timestamp = Date.now()): string {
  const { period = 30 } = options;
  return genHOTP(key, timeCounter(timestamp, period), options);
}
function validToken(token: string, digits: number): boolean {
  return typeof token === "string" && token.length === digits && !/[^0-9]/.test(token);
}
function tokensEqual(expected: string, token: string): boolean {
  return timingSafeEqual(Buffer.from(expected, "ascii"), Buffer.from(token, "ascii"));
}
/** Check previous/current/next periods by default; skip counters before the epoch. */
export function verifyTOTP(
  key: string, token: string, options: VerifyTOTPOptions = {}, timestamp = Date.now(),
): boolean {
  return verifyTOTPWithResult(key, token, options, timestamp) !== null;
}
/** Return the closest matching counter and drift; ties prefer the past. */
export function verifyTOTPWithResult(
  key: string, token: string, options: VerifyTOTPOptions = {}, timestamp = Date.now(),
): TOTPMatch | null {
  const { window = 1, period = 30, digits = 6, algorithm = "SHA-1", encoding = "utf8" } = options;
  validateWindow(window);
  validateOtpOptions(options);
  const counter = timeCounter(timestamp, period);
  validateCounter(counter + window);
  const hex = keyToHex(key, encoding);
  if (!validToken(token, digits)) return null;
  let result: TOTPMatch | null = null;
  for (let offset = -window; offset <= window; offset += 1) {
    if (counter + offset < 0) continue;
    const equal = tokensEqual(hotpFromHex(hex, counter + offset, algorithm, digits), token);
    if (equal && (result === null || Math.abs(offset) < Math.abs(result.delta))) {
      result = { counter: counter + offset, delta: offset === 0 ? 0 : offset };
    }
  }
  return result;
}
/** Return the next counter to persist atomically, or null when verification fails. */
export function verifyHOTP(
  key: string, token: string, counter: number, options: VerifyHOTPOptions = {},
): { newCounter: number } | null {
  const { window = 10, digits = 6, algorithm = "SHA-1", encoding = "utf8" } = options;
  validateWindow(window);
  validateOtpOptions(options);
  validateCounter(counter);
  validateCounter(counter + window + 1);
  const hex = keyToHex(key, encoding);
  if (!validToken(token, digits)) return null;
  let result: { newCounter: number } | null = null;
  for (let offset = 0; offset <= window; offset += 1) {
    const equal = tokensEqual(hotpFromHex(hex, counter + offset, algorithm, digits), token);
    if (equal && result === null) result = { newCounter: counter + offset + 1 };
  }
  return result;
}
/** Build an authenticator URI from a canonical Base32 secret. */
export function generateOtpAuthUri(key: string, options: OtpAuthUriOptions): string {
  const { accountName, issuer, period = 30, algorithm = "SHA-1", digits = 6 } = options;
  try { keyToHex(key, "base32"); }
  catch { throw new Error("Invalid base32 key for otpauth URI"); }
  validateOtpOptions({ algorithm, digits });
  validatePeriod(period);
  if (!["SHA-1", "SHA-256", "SHA-512"].includes(algorithm)) {
    throw new Error("Unsupported otpauth algorithm; use SHA-1, SHA-256, or SHA-512");
  }
  if (digits !== 6 && digits !== 8) throw new Error("Invalid otpauth digits; must be 6 or 8");
  if (!Number.isInteger(period)) throw new Error("Invalid otpauth period; must be a positive integer");
  if (typeof accountName !== "string" || accountName.trim().length === 0 || accountName.includes(":")) {
    throw new Error("Invalid account name; must be non-empty and contain no colon");
  }
  if (typeof issuer !== "string" || issuer.trim().length === 0 || issuer.includes(":")) {
    throw new Error("Invalid issuer; must be non-empty and contain no colon");
  }
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}`;
  const query = new URLSearchParams({
    secret: key.toUpperCase().replace(/=+$/, ""), issuer,
    algorithm: algorithm.replace("SHA-", "SHA"), digits: digits.toString(), period: period.toString(),
  });
  return `otpauth://totp/${label}?${query.toString()}`;
}
export function bytesToBase32(bytes: Uint8Array): string {
  let buffer = 0;
  let bitCount = 0;
  let output = "";
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bitCount += 8;
    while (bitCount >= 5) {
      bitCount -= 5;
      output += BASE32_CHARS[(buffer >>> bitCount) & 31];
      buffer &= (1 << bitCount) - 1;
    }
  }
  if (bitCount > 0) output += BASE32_CHARS[(buffer << (5 - bitCount)) & 31];
  return output;
}
/** Generate a random secret; length is measured in bytes. */
export function generateSecretKey(length = 20): string {
  if (!Number.isSafeInteger(length) || length < 1) {
    throw new Error("Invalid secret length; must be a positive safe integer");
  }
  return bytesToBase32(randomBytes(length));
}
export default genTOTP;
