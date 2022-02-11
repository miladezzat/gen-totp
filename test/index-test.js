const { expect } = require('./chai');
const getTOTP = require('../index');

describe('TOTP Class', () => {
  describe('get / add house slug', async () => {
    it('get TOTP successfully', () => {
      const key = Math.random();
      const totp = getTOTP(key, { digits: 6 });
      expect(totp).to.be.a('string').with.length(6);
    });

    it('success to get TOTP', () => {
      const key = Math.random();
      const totp = getTOTP(key);
      expect(totp).to.be.a('string').with.length(6);
    });

    it('success to get TOTP', () => {
      const totp = getTOTP('dsfkkldsfnwhefkjdfhjksdfhkjdsfhlkdjf', { period: 1 });
      expect(totp).to.be.a('string').with.length(6);
    });

    it('success to get TOTP', () => {
      const totp = getTOTP('milad@gmail.com', { period: 1 });
      expect(totp).to.be.a('string').with.length(6);
    });

    it('fail to get TOTP', () => {
      try {
        getTOTP('sdf&*', { digits: 6 });
      } catch (error) {
        expect(error.message).to.be.a('string').to.be.equal('Invalid base32 character in key');
      }
    });
  });
});
