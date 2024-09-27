const XMLHttpRequestTimeout = 30 * 1000;

const CoNETModule: CoNET_Module = {
  EthCrypto: null,
  Web3Providers: null,
  Web3EthAccounts: null,
  Web3Eth: null,
  Web3Utils: null,
  forge: null,

  aesGcmEncrypt: async (plaintext: string, password: string) => {
    const pwUtf8 = new TextEncoder().encode(password); // encode password as UTF-8
    const pwHash = await crypto.subtle.digest("SHA-256", pwUtf8); // hash the password

    const iv = crypto.getRandomValues(new Uint8Array(12)); // get 96-bit random iv
    const ivStr = Array.from(iv)
      .map((b) => String.fromCharCode(b))
      .join(""); // iv as utf-8 string

    const alg = { name: "AES-GCM", iv: iv }; // specify algorithm to use

    const key = await crypto.subtle.importKey("raw", pwHash, alg, false, [
      "encrypt",
    ]); // generate key from pw

    const ptUint8 = new TextEncoder().encode(plaintext); // encode plaintext as UTF-8
    const ctBuffer = await crypto.subtle.encrypt(alg, key, ptUint8); // encrypt plaintext using key

    const ctArray = Array.from(new Uint8Array(ctBuffer)); // ciphertext as byte array
    const ctStr = ctArray.map((byte) => String.fromCharCode(byte)).join(""); // ciphertext as string

    return btoa(ivStr + ctStr);
  },

  aesGcmDecrypt: async (ciphertext: string, password: string) => {
    const pwUtf8 = new TextEncoder().encode(password); // encode password as UTF-8
    const pwHash = await crypto.subtle.digest("SHA-256", pwUtf8); // hash the password

    const ivStr = atob(ciphertext).slice(0, 12); // decode base64 iv
    const iv = new Uint8Array(Array.from(ivStr).map((ch) => ch.charCodeAt(0))); // iv as Uint8Array

    const alg = { name: "AES-GCM", iv: iv }; // specify algorithm to use

    const key = await crypto.subtle.importKey("raw", pwHash, alg, false, [
      "decrypt",
    ]); // generate key from pw

    const ctStr = atob(ciphertext).slice(12); // decode base64 ciphertext
    const ctUint8 = new Uint8Array(
      Array.from(ctStr).map((ch) => ch.charCodeAt(0))
    ); // ciphertext as Uint8Array
    // note: why doesn't ctUint8 = new TextEncoder().encode(ctStr) work?

    try {
      const plainBuffer = await crypto.subtle.decrypt(alg, key, ctUint8); // decrypt ciphertext using key
      const plaintext = new TextDecoder().decode(plainBuffer); // plaintext from ArrayBuffer
      return plaintext; // return the plaintext
    } catch (e) {
      throw new Error("Decrypt failed");
    }
  },
};

const customJsonStringify = (item) => {
  const result = JSON.stringify(
    item,
    (key, value) => (typeof value === "bigint" ? value.toString() : value) // return everything else unchanged
  );
  return result;
};

//	@ts-ignore
const logger = (...argv: any) => {
  const date = new Date();
  const dateStrang = `%c [Seguro-worker INFO ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}]`;

  return console.log(dateStrang, "color: #dcde56", ...argv);
};

const createGPGKey = async (passwd: string, name: string, email: string) => {
  const userId = {
    name: name,
    email: email,
  };
  const option = {
    type: "ecc",
    passphrase: passwd,
    userIDs: [userId],
    curve: "curve25519",
    format: "armored",
  };

  return await openpgp.generateKey(option);
};

const postToEndpoint = (url: string, post: boolean, jsonData) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      clearTimeout(timeCount);

      if (xhr.status === 200) {
        if (!xhr.responseText.length) {
          return resolve("");
        }

        let ret;

        try {
          ret = JSON.parse(xhr.responseText);
        } catch (ex) {
          if (post) {
            return resolve("");
          }

          return resolve(xhr.responseText);
        }

        return resolve(ret);
      }

      logger(
        `postToEndpoint [${url}] xhr.status [${
          xhr.status === 200
        }] !== 200 Error`
      );

      return resolve(false);
    };

    xhr.onerror = (err) => {
      logger(`xhr.onerror`, err);
      clearTimeout(timeCount);
      return reject(err);
    };

    xhr.open(post ? "POST" : "GET", url, true);

    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    xhr.send(jsonData ? JSON.stringify(jsonData) : "");

    const timeCount = setTimeout(() => {
      const Err = `Timeout!`;
      logger(`postToEndpoint ${url} Timeout Error`, Err);
      reject(new Error(Err));
    }, XMLHttpRequestTimeout);
  });
};

const fetchWithTimeout = async (resource, options: any) => {
  const { timeout = 80000 } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
  });

  clearTimeout(id);

  return response;
};

const formatToken = (token: number) => {
  return (token * Math.pow(10, -18)).toFixed(6);
};
