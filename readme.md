# Generate TOTP

1. Installation 

```bach
   npm i gen-totp
   // or
   yarn add gen-totp
```

2. Usage

```js
  const genTOTP = require('gen-totp');
  
  const otp = genTOTP('test-key');
  // that will return otp with length 6 numbers
```

```js
  const genTOTP = require('gen-totp');
  
  const otp = genTOTP('test-key', { digits: 4 });
  // that will return otp with length 4 numbers
```

### Options
 > genTOTP take two parameters

 1. `key` this is a string that contains numbers, characters, `_` and `-`
 2. `options` this an Object
    - `digits` this is the number of digits will return
    - `period` this is the time to generate new otp after it (this by seconds)
    - `algorithm` this is algorithm to pure hash numbers 
      > the complete Secure Hash Standard (SHA) family (SHA-1, SHA-224/256/384/512, SHA3-224/256/384/512, SHAKE128/256, cSHAKE128/256, and KMAC128/256) with HMAC. [jssha](https://www.npmjs.com/package/jssha)