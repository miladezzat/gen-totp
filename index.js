const JsSHA = require('jssha');

/**
 *
 * @param {String} str
 * @param {Number} len
 * @param {*} pad
 * @returns
 */
function leftpad(str, len, pad) {
  let newStr = '';

  if (len + 1 >= str.length) {
    newStr = Array(len + 1 - str.length).join(pad) + str;
  }

  return newStr;
}

/**
 *
 * @param {String} base32
 * @returns {String}
 */
function base32tohex(base32) {
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let bits = '';
  let hex = '';

  for (let i = 0; i < base32.length; i += 1) {
    const val = base32chars.indexOf(base32.charAt(i).toUpperCase());
    if (val === -1) throw new Error('Invalid base32 character in key');
    bits += leftpad(val.toString(2), 5, '0');
  }

  for (let i = 0; i + 8 <= bits.length; i += 8) {
    const chunk = bits.substr(i, 8);
    hex += leftpad(parseInt(chunk, 2).toString(16), 2, '0');
  }

  return hex;
}

/**
 *
 * @param {String} s
 * @returns {Number}
 */
function hex2dec(s) {
  return parseInt(s, 16);
}

/**
 *
 * @param {Number} s
 * @returns {String}
 */
function dec2hex(s) {
  return (s < 15.5 ? '0' : '') + Math.round(s).toString(16);
}

/**
 *
 * @param {String} key
 * @param {Object} options
 * @param {Number} options.period
 * @param {String} options.algorithm
 * @param {Number} options.digits
 * @returns {Number} otp
 */
function getTOTP(key, options = {}) {
  const { period = 30, algorithm = 'SHA-1', digits = 6 } = options;

  const base32key = base32tohex(key);
  const epoch = Math.round(Date.now() / 1000.0);
  const time = leftpad(dec2hex(Math.floor(epoch / period)), 16, '0');

  const shaObj = new JsSHA(algorithm, 'HEX');
  shaObj.setHMACKey(base32key, 'HEX');
  shaObj.update(time);

  const hmac = shaObj.getHMAC('HEX');
  const offset = hex2dec(hmac.substring(hmac.length - 1));
  let otp = `${hex2dec(hmac.substr(offset * 2, 8)) & hex2dec('7fffffff')}`;
  otp = otp.substr(otp.length - digits, digits);

  return otp;
}

module.exports = getTOTP;
