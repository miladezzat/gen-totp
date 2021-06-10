const { expect } = require('./chai');
const getTOTP = require('../index');

describe('TOTP Class', () => {
  describe('get / add house slug', async () => {
    it('get TOTP', () => {
      const key = Math.random();
      const totp = getTOTP(key, { digits: 6 });
      expect(totp).to.be.a('string').with.length(6);
    });
  });
});
