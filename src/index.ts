import JsSHA from "jssha";

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
export function genTOTP(key: string, options: GenTOTPOptions = {}): string {
  const {
    period = 30,
    algorithm = "SHA-1",
    digits = 6,
    encoding = "utf8",
  } = options;

  const epoch = Math.floor(Date.now() / 1000);
  const timeHex = leftPad(decToHex(Math.floor(epoch / period)), 16, "0");

  let hexKey: string;

  if (encoding === "hex") {
    hexKey = key.toLowerCase();
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

export default genTOTP;
