// Contract Addresses
const blast_usdb_contract = "0x4300000000000000000000000000000000000003";
const bnb_usdt_contract = "0x55d398326f99059fF775485246999027B3197955";
const eth_usdt_contract = "0xdac17f958d2ee523a2206206994597c13d831ec7";
const Arbitrum_USDT = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9";
const conet_dWETH = "0x84b6d6A6675F830c8385f022Aefc9e3846A89D3B";
const conet_dUSDT = "0x0eD55798a8b9647f7908c72a0Ce844ad47274422";
const conet_dWBNB = "0xd8b094E91c552c623bc054085871F6c1CA3E5cAd";
const bsc_mainchain = "https://bsc-dataseed.binance.org/";
const Arbitrum_One_RPC = "https://arb1.arbitrum.io/rpc";

const _ethRpc = [
  "https://rpc.ankr.com/eth",
  "https://eth.llamarpc.com",
  "https://ethereum-rpc.publicnode.com",
];

const ethRpc = () => _ethRpc[Math.round(Math.random() * (_ethRpc.length - 1))];

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

const CONET_transfer_token = async (profile, to, _total, tokenName) => {
  const cryptoAsset = profile.tokens[tokenName];
  if (!cryptoAsset || !CoNET_Data?.profiles) {
    const cmd1 = {
      cmd: "tokenTransferStatus",
      data: [-1],
    };
    sendState("toFrontEnd", cmd1);
    return false;
  }
  if (
    parseFloat(cryptoAsset.balance) - _total < 0 ||
    !profile.privateKeyArmor
  ) {
    const cmd1 = {
      cmd: "tokenTransferStatus",
      data: [-1],
    };
    sendState("toFrontEnd", cmd1);
    return false;
  }
  const cmd1 = {
    cmd: "tokenTransferStatus",
    data: [1],
  };
  sendState("toFrontEnd", cmd1);
  const tx: any = await transferAssetToCONET_wallet(
    profile.privateKeyArmor,
    cryptoAsset,
    _total.toString(),
    to
  );
  if (typeof tx === "boolean") {
    const cmd1 = {
      cmd: "tokenTransferStatus",
      data: [-1],
    };

    sendState("toFrontEnd", cmd1);
    return false;
  }

  const cmd2 = {
    cmd: "tokenTransferStatus",
    data: [2],
  };
  sendState("toFrontEnd", cmd2);

  const kk1 = {
    status: "Confirmed",
    Nonce: tx.nonce,
    to: tx.to,
    transactionFee: stringFix(
      ethers.formatEther(parseFloat(tx.gasUsed) * parseFloat(tx.gasPrice))
    ),
    gasUsed: tx.gasUsed.toString(),
    isSend: true,
    value: parseEther(_total.toString(), cryptoAsset.name).toString(),
    time: new Date().toISOString(),
    transactionHash: tx.hash,
  };

  cryptoAsset.history.push(kk1);
  // await storagePieceToLocal();
  await storeSystemData();
  needUpgradeVer = epoch + 25;
  return tx;
};

const transferAssetToCONET_wallet = (
  privateKey,
  token,
  transferNumber,
  toAddr
) =>
  new Promise(async (resolve) => {
    const provide = new ethers.JsonRpcProvider(getNetwork(token.name));
    const wallet = new ethers.Wallet(privateKey, provide);
    const smartContractAddr = getAssetERC20Address(token.name);
    if (smartContractAddr) {
      const transferObj = new ethers.Contract(
        smartContractAddr,
        blast_CNTPAbi,
        wallet
      );
      const amount = parseEther(transferNumber, token.name);
      try {
        // const k1 = await transferObj.approve(toAddr, amount)
        const k2 = await transferObj.transfer(toAddr, amount);
        const k3 = await k2.wait();
        return resolve(k3);
      } catch (ex) {
        return resolve(false);
      }
    } else {
      const tx = {
        to: toAddr,
        value: ethers.parseEther(transferNumber),
      };
      try {
        return resolve(await wallet.sendTransaction(tx));
      } catch (ex) {
        return resolve(false);
      }
    }
  });

const getAssetERC20Address = (assetName) => {
  switch (assetName) {
    case "usdt": {
      return eth_usdt_contract;
    }
    case "wusdt": {
      return bnb_usdt_contract;
    }
    case "usdb": {
      return blast_usdb_contract;
    }
    case "dWBNB": {
      return conet_dWBNB;
    }
    case "dUSDT": {
      return conet_dUSDT;
    }
    case "dWETH": {
      return conet_dWETH;
    }
    case "cCNTP": {
      return cCNTP_new_Addr;
    }
    case "arb_usdt": {
      return Arbitrum_USDT;
    }
    default: {
      return ``;
    }
  }
};

const parseEther = (ether, tokenName) => {
  switch (tokenName) {
    case "arb_usdt":
    case "usdt": {
      return ethers.parseUnits(ether, 6);
    }

    default: {
      return ethers.parseEther(ether);
    }
  }
};

const getNetwork = (networkName) => {
  switch (networkName) {
    // case 'usdb':
    // case 'blastETH':
    //     {
    //         return blast_mainnet()
    //     }
    case "cCNTP":
    case "cUSDB":
    case "cCNTP":
    case "cUSDT":
    case "cBNBUSDT":
    case "conet":
    case "cntpb": {
      return conet_rpc;
    }
    case "usdt":
    case "eth": {
      return ethRpc();
    }
    case "wusdt":
    case "bnb": {
      return bsc_mainchain;
    }
    case "arb_eth":
    case "arb_usdt": {
      return Arbitrum_One_RPC;
    }
    // case 'cntp':
    //     {
    //         return blast_sepoliaRpc
    //     }
    default: {
      return "";
    }
  }
};

const stringFix = (num) => {
  const index = num.indexOf(".");
  if (index < 0) {
    return num;
  }
  return num.substring(0, index + 12);
};

const getProfileFromKeyID = (keyID: string) => {
  if (!CoNET_Data?.profiles) {
    return null;
  }
  const profileIndex = CoNET_Data.profiles.findIndex((n) => n.keyID === keyID);
  if (profileIndex < 0) {
    return null;
  }
  return CoNET_Data.profiles[profileIndex];
};

const getEstimateGasForTokenTransfer = (
  privateKey,
  asset,
  _transferNumber,
  toAddr
) =>
  new Promise(async (resolve) => {
    const provide = new ethers.JsonRpcProvider(getNetwork(asset));
    const wallet = new ethers.Wallet(privateKey, provide);
    let _fee;
    const transferNumber = parseEther(_transferNumber, asset);
    const smartContractAddr = getAssetERC20Address(asset);
    if (smartContractAddr) {
      const estGas = new ethers.Contract(
        smartContractAddr,
        blast_CNTPAbi,
        wallet
      );
      try {
        _fee = await estGas.transfer.estimateGas(toAddr, transferNumber);
      } catch (ex) {
        return resolve(false);
      }
    } else {
      const tx = {
        to: toAddr,
        value: transferNumber,
      };
      try {
        _fee = await wallet.estimateGas(tx);
      } catch (ex) {
        return resolve(false);
      }
    }
    try {
      const Fee = await provide.getFeeData();
      const gasPrice = ethers.formatUnits(Fee.gasPrice, "gwei");
      const fee = parseFloat(ethers.formatEther(_fee * Fee.gasPrice));

      const roundedUpFee = Math.ceil(fee * 100000000) / 100000000;
      let roundedUpFeeStr = roundedUpFee.toFixed(8).toString();

      if (parseFloat(roundedUpFeeStr) === 0) {
        roundedUpFeeStr = roundedUpFeeStr.slice(0, -1) + "1";
      }

      return resolve({ gasPrice, fee: roundedUpFeeStr });
    } catch (ex) {
      return resolve(false);
    }
  });

const getEstimateGasForTicketNftTransfer = (
  privateKey,
  asset,
  nftId,
  transferAmount,
  toAddr
) =>
  new Promise(async (resolve) => {
    const provide = new ethers.JsonRpcProvider(conet_rpc);
    const wallet = new ethers.Wallet(privateKey, provide);
    let _fee;
    const smartContractAddr = ticket_addr;

    if (smartContractAddr) {
      const estGas = new ethers.Contract(smartContractAddr, ticketAbi, wallet);
      try {
        _fee = await estGas.safeTransferFrom.estimateGas(
          wallet.address,
          toAddr,
          nftId,
          transferAmount,
          "0x"
        );
      } catch (ex) {
        return resolve(false);
      }
    } else {
      const tx = {
        to: toAddr,
        value: transferAmount,
      };
      try {
        _fee = await wallet.estimateGas(tx);
      } catch (ex) {
        return resolve(false);
      }
    }

    try {
      const Fee = await provide.getFeeData();
      const gasPrice = ethers.formatUnits(Fee.gasPrice, "gwei");
      const fee = parseFloat(ethers.formatEther(_fee * Fee.gasPrice));

      const roundedUpFee = Math.ceil(fee * 100000000) / 100000000;
      let roundedUpFeeStr = roundedUpFee.toFixed(8).toString();

      if (parseFloat(roundedUpFeeStr) === 0) {
        roundedUpFeeStr = roundedUpFeeStr.slice(0, -1) + "1";
      }

      return resolve({ gasPrice, fee: roundedUpFeeStr });
    } catch (ex) {
      return resolve(false);
    }
  });
