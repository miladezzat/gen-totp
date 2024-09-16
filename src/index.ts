import JsSHA from "jssha";

/**
 * Left pads a string to a specified length.
 * @param {string} str - The string to pad.
 * @param {number} len - The length to pad to.
 * @param {string} pad - The padding character.
 * @returns {string} The padded string.
 */
function leftPad(str: string, len: number, pad: string): string {
  return str.length >= len ? str : pad.repeat(len - str.length) + str;
}

/**
 * Converts a base32-encoded string to hexadecimal.
 * @param {string} base32 - The base32-encoded string.
 * @returns {string} The hexadecimal representation.
 * @throws {Error} Throws an error if an invalid base32 character is found.
 */
function base32ToHex(base32: string): string {
  let bits = "";
  let hex = "";

  // Use TextEncoder to handle multi-byte characters
  const encoder = new TextEncoder();
  const encoded = encoder.encode(base32); // Convert string to Uint8Array of bytes

  // Convert each byte to its binary representation
  for (const byte of encoded) {
    bits += leftPad(byte.toString(2), 8, "0"); // Convert byte to 8-bit binary
  }

  // Convert the binary string to hexadecimal
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    const chunk = bits.slice(i, i + 8); // Take each 8-bit chunk
    hex += leftPad(parseInt(chunk, 2).toString(16), 2, "0"); // Convert to hex
  }

  return hex;
}

/**
 * Converts a hexadecimal string to a decimal number.
 * @param {string} hex - The hexadecimal string.
 * @returns {number} The decimal number.
 */
function hexToDec(hex: string): number {
  return parseInt(hex, 16);
}

/**
 * Converts a decimal number to a hexadecimal string.
 * @param {number} dec - The decimal number.
 * @returns {string} The hexadecimal string.
 */
function decToHex(dec: number): string {
  return (dec < 15.5 ? "0" : "") + Math.round(dec).toString(16);
}

type FixedLengthVariantType =
  | "SHA-1"
  | "SHA-224"
  | "SHA-256"
  | "SHA-384"
  | "SHA-512"
  | "SHA3-224"
  | "SHA3-256"
  | "SHA3-384"
  | "SHA3-512";

/**
 * Generates a TOTP (Time-based One-Time Password).
 * @param {string} key - The base32-encoded secret key.
 * @param {GenTOTPOptions} [options={}] - Options for generating the TOTP.
 * @param {number} [options.period=30] - The period in seconds.
 * @param {string} [options.algorithm='SHA-1'] - The hashing algorithm.
 * @param {number} [options.digits=6] - The number of digits in the OTP.
 * @returns {string} The generated OTP.
 */
interface GenTOTPOptions {
  period?: number;
  algorithm?: FixedLengthVariantType;
  digits?: number;
}

function genTOTP(key: string, options: GenTOTPOptions = {}): string {
  const { period = 30, algorithm = "SHA-1", digits = 6 } = options;

  const base32Key = base32ToHex(key);
  const epoch = Math.floor(Date.now() / 1000);
  const time = leftPad(decToHex(Math.floor(epoch / period)), 16, "0");

  const shaObj = new JsSHA(algorithm, "HEX");
  shaObj.setHMACKey(base32Key, "HEX");
  shaObj.update(time);

  const hmac = shaObj.getHMAC("HEX");
  const offset = hexToDec(hmac[hmac.length - 1]);
  let otp = `${hexToDec(hmac.slice(offset * 2, offset * 2 + 8)) & hexToDec("7fffffff")}`;
  otp = otp.slice(-digits);

  return otp;
}

export default genTOTP;
