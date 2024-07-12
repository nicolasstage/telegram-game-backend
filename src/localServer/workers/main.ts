const databaseName = "conet";
//	******************************************************************
const cCNTP_new_Addr =
  "0x530cf1B598D716eC79aa916DD2F05ae8A0cE8ee2".toLocaleLowerCase();
const profile_ver_addr =
  "0x556bB96fC4C1316B2e5CEaA133f5D4157Eb05681".toLowerCase();
const CONET_Guardian_NodeInfoV4 = "0x264ea87162463165101A500a6Bf8755b91220350";
const CONET_Guardian_NodesV3 =
  "0x453701b80324C44366B34d167D40bcE2d67D6047".toLowerCase();
const CONET_OpenPGP_REG = "0xBDAdAB47eEa9546fda345a4B29CFFeea7027d4aa";
const Claimable_ETHUSDTv3 =
  "0xfE75074C273b5e33Fe268B1d5AC700d5b715DA2f".toLowerCase();
const Claimable_BNBUSDTv3 =
  "0xAE752B49385812AF323240b26A49070bB839b10D".toLowerCase();
const Claimable_BlastUSDBv3 =
  "0x3258e9631ca4992F6674b114bd17c83CA30F734B".toLowerCase();
//	******************************************************************

let miningConn;
let cCNTPcurrentTotal = 0;
let miningProfile: profile | null = null;
let miningStatus: "STOP" | "RESTART" | "MINING" = "STOP";
const api_endpoint = `https://api.conet.network/api/`;
let authorization_key = "";
const conet_rpc = "https://rpc.conet.network";
const provideCONET = new ethers.JsonRpcProvider(conet_rpc);
let CoNET_Data: encrypt_keys_object | null = null;
let passObj: passInit | null = null;
let preferences: any = null;

const blast_CNTPAbi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "allowance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "needed",
        type: "uint256",
      },
    ],
    name: "ERC20InsufficientAllowance",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "balance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "needed",
        type: "uint256",
      },
    ],
    name: "ERC20InsufficientBalance",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "approver",
        type: "address",
      },
    ],
    name: "ERC20InvalidApprover",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
    ],
    name: "ERC20InvalidReceiver",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "ERC20InvalidSender",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "ERC20InvalidSpender",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "burnFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "addr",
        type: "address",
      },
      {
        internalType: "bool",
        name: "status",
        type: "bool",
      },
    ],
    name: "changeAddressInWhitelist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "_rule",
        type: "bool",
      },
    ],
    name: "changeWhitelistRule",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "_addresses",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "_amounts",
        type: "uint256[]",
      },
    ],
    name: "multiTransferToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_value",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "success",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "whiteList",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "whitelistRule",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const storeSystemData = async () => {
  if (!CoNET_Data) {
    return;
  }

  const password = "conet123";

  const data = {
    mnemonicPhrase: CoNET_Data.mnemonicPhrase,
    fx168Order: CoNET_Data.fx168Order || [],
    dammy: buffer.Buffer.allocUnsafeSlow(1024 * (20 + Math.random() * 20)),
    ver: CoNET_Data.ver || 1,
    upgradev2: CoNET_Data.upgradev2,
  };

  const waitEntryptData = buffer.Buffer.from(JSON.stringify(data));

  const filenameIterate1 = ethers.id(password);
  const filenameIterate2 = ethers.id(filenameIterate1);
  const filenameIterate3 = ethers.id(ethers.id(ethers.id(filenameIterate2)));

  const encryptIterate1 = await CoNETModule.aesGcmEncrypt(
    waitEntryptData,
    password
  );
  const encryptIterate2 = await CoNETModule.aesGcmEncrypt(
    encryptIterate1,
    filenameIterate1
  );
  const encryptIterate3 = await CoNETModule.aesGcmEncrypt(
    encryptIterate2,
    filenameIterate2
  );

  const filename = filenameIterate3;

  CoNET_Data.encryptedString = encryptIterate3;

  if (!CoNET_Data.encryptedString) {
    return logger(`encryptStoreData aesGcmEncrypt Error!`);
  }

  try {
    await storageHashData(
      "init",
      buffer.Buffer.from(JSON.stringify(CoNET_Data)).toString("base64")
    );
    await storageHashData(filename, CoNET_Data.encryptedString);
  } catch (ex) {
    logger(`storeSystemData storageHashData Error!`, ex);
  }
};

const storageHashData = async (hash: string, data: string) => {
  const database = new PouchDB(databaseName, { auto_compaction: true });
  const putData = {
    _id: hash,
    title: data,
  };
  try {
    const doc = await database.get(hash, { latest: true });
    putData["_rev"] = doc._rev;
    await database.post(putData);
  } catch (ex: any) {
    if (/^not_found/.test(ex.name)) {
      await database.post(putData);
    } else {
      logger(`storageHashData Error!`, ex);
    }
  }
};

const checkStorage = async () => {
  const database = new PouchDB(databaseName, { auto_compaction: true });

  try {
    const doc = await database.get("init", { latest: true });
    CoNET_Data = JSON.parse(buffer.Buffer.from(doc.title, "base64").toString());
  } catch (ex) {
    return logger(
      `checkStorage have no CoNET data in IndexDB, INIT CoNET data`
    );
  }
};

const createOrGetWallet = async (cmd: worker_command) => {
  if (!CoNET_Data?.profiles) {
    const acc = createKeyHDWallets();
    const profile: profile = {
      tokens: initProfileTokens(),
      publicKeyArmor: acc.publicKey,
      keyID: acc.address,
      isPrimary: true,
      referrer: null,
      isNode: false,
      privateKeyArmor: acc.signingKey.privateKey,
      hdPath: acc.path,
      index: acc.index,
    };

    CoNET_Data = {
      mnemonicPhrase: acc.mnemonic.phrase,
      profiles: [profile],
      isReady: true,
      ver: 0,
      nonce: 0,
    };
  }

  await storeSystemData();

  const profile = CoNET_Data.profiles[0];
  cmd.data[0] = profile.keyID;
  return returnUUIDChannel(cmd);
};

const createKeyHDWallets = () => {
  try {
    const root = ethers.Wallet.createRandom();
    return root;
  } catch (ex) {
    return null;
  }
};

const initProfileTokens = () => {
  const ret: conet_tokens = {
    CGPNs: {
      balance: "0",
      history: [],
      network: "CONET Guardian Nodes (CGPNs)",
      decimal: 1,
      contract: CONET_Guardian_NodesV3,
      name: "CGPNs",
    },
    CGPN2s: {
      balance: "0",
      history: [],
      network: "CONET Guardian Nodes (CGPN2s)",
      decimal: 1,
      contract: CONET_Guardian_NodesV3,
      name: "CGPN2s",
    },
    cCNTP: {
      balance: "0",
      history: [],
      network: "CONET Holesky",
      decimal: 18,
      contract: cCNTP_new_Addr,
      name: "cCNTP",
    },
    cBNBUSDT: {
      balance: "0",
      history: [],
      network: "CONET Holesky",
      decimal: 18,
      contract: Claimable_BNBUSDTv3,
      name: "cBNBUSDT",
    },
    cUSDB: {
      balance: "0",
      history: [],
      network: "CONET Holesky",
      decimal: 18,
      contract: Claimable_BlastUSDBv3,
      name: "cUSDB",
    },
    cUSDT: {
      balance: "0",
      history: [],
      network: "CONET Holesky",
      decimal: 18,
      contract: Claimable_ETHUSDTv3,
      name: "cUSDT",
    },
    conet: {
      balance: "0",
      history: [],
      network: "CONET Holesky",
      decimal: 18,
      contract: "",
      name: "conet",
    },
  };
  return ret;
};

const sendState = (state: listenState, value: any) => {
  const sendChannel = new BroadcastChannel(state);
  let data = "";
  try {
    data = JSON.stringify(value);
  } catch (ex) {
    logger(`sendState JSON.stringify(value) Error`);
  }
  sendChannel.postMessage(data);
  sendChannel.close();
};

const postToEndpointSSE = (
  url: string,
  post: boolean,
  jsonData,
  CallBack: (err: WorkerCommandError | null, data: string) => void
) => {
  const xhr = new XMLHttpRequest();

  let chunk = 0;
  xhr.onprogress = async (e) => {
    const data = await xhr.responseText;
    clearTimeout(timeCount);
    if (e.eventPhase < 2) {
      return logger(
        `xhr.status = ${xhr.status} e.eventPhase [${e.eventPhase}]`,
        data
      );
    }

    if (xhr.status === 401) {
      return CallBack("Err_Multiple_IP", "");
    }
    if (xhr.status === 402) {
      return CallBack("Err_Existed", "");
    }
    if (xhr.status !== 200) {
      return CallBack("FAILURE", "");
    }

    const currentData = data.substring(chunk);
    const responseText = data.split("\r\n\r\n");
    chunk = data.length;
    CallBack(null, currentData);
  };

  xhr.upload.onabort = () => {
    logger(`xhr.upload.onabort`);
  };

  xhr.upload.onerror = (err) => {
    clearTimeout(timeCount);
    // CallBack('NOT_INTERNET', '')
    logger(`xhr.upload.onerror`, err);
  };

  xhr.open(post ? "POST" : "GET", url, true);
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhr.send(typeof jsonData !== "string" ? JSON.stringify(jsonData) : jsonData);

  xhr.onerror = (err) => {
    logger(`xhr.onerror`, err);
    clearTimeout(timeCount);
    CallBack("NOT_INTERNET", "");
  };
  const timeCount = setTimeout(() => {
    const Err = `postToEndpoint Timeout!`;
    logger(`postToEndpoint Error`, Err);
    CallBack("TIMEOUT", "");
  }, 1000 * 45);

  return xhr;
};

const _startMining = async (
  profile: profile,
  cmd: worker_command | null = null
) => {
  const message = JSON.stringify({ walletAddress: profile.keyID });
  const messageHash = ethers.id(message);
  const signMessage = CoNETModule.EthCrypto.sign(
    profile.privateKeyArmor,
    messageHash
  );
  const sendData = {
    message,
    signMessage,
  };

  const url = `${api_endpoint}startMining`;

  logger(url);
  let first = true;

  return (miningConn = postToEndpointSSE(
    url,
    true,
    JSON.stringify(sendData),
    async (err, _data) => {
      switch (miningStatus) {
        case "RESTART": {
          miningConn.abort();
          miningStatus = "MINING";
          return _startMining(profile);
        }

        case "STOP": {
          miningConn.abort();
          return;
        }
      }

      if (err) {
        logger(err);
        if (cmd) {
          cmd.err = err;
          return returnUUIDChannel(cmd);
        }
        return;
      }

      logger("success", _data);
      const kk = JSON.parse(_data);

      if (first) {
        miningProfile = profile;
        first = false;
        if (cmd) {
          cCNTPcurrentTotal = parseFloat(profile.tokens.cCNTP.balance || "0");

          kk["currentCCNTP"] = "0";
          cmd.data = ["success", JSON.stringify(kk)];
          return returnUUIDChannel(cmd);
        }
        return;
      }

      kk.rate =
        typeof kk.rate === "number"
          ? kk.rate.toFixed(10)
          : parseFloat(kk.rate).toFixed(10);
      kk["currentCCNTP"] = (
        parseFloat(profile.tokens.cCNTP.balance || "0") - cCNTPcurrentTotal
      ).toFixed(8);

      const cmdd: channelWroker = {
        cmd: "miningStatus",
        data: [JSON.stringify(kk)],
      };

      sendState("toFrontEnd", cmdd);
    }
  ));
};

const startMining = async (cmd: worker_command) => {
  const _profile: profile = cmd.data[1];
  if (!_profile) {
    cmd.err = "FAILURE";
    return returnUUIDChannel(cmd);
  }

  miningStatus = "MINING";
  return await _startMining(_profile, cmd);
};

const getWalletBalance = (cmd: worker_command) =>
  new Promise(async (resolve) => {
    const walletAddr: string = cmd.data[0];

    const erc20 = new ethers.Contract(
      cCNTP_new_Addr,
      blast_CNTPAbi,
      provideCONET
    );

    try {
      const result = await erc20.balanceOf(walletAddr);
      return resolve(result);
    } catch (ex) {
      logger(`getWalletBalance Error!`);
      return resolve(false);
    }
  });

const testFunction = async () => {
  const profile = {
    tokens: {
      CGPNs: {
        balance: "0",
        history: [],
        network: "CONET Guardian Nodes (CGPNs)",
        decimal: 1,
        contract: "0x453701b80324c44366b34d167d40bce2d67d6047",
        name: "CGPNs",
      },
      CGPN2s: {
        balance: "0",
        history: [],
        network: "CONET Guardian Nodes (CGPN2s)",
        decimal: 1,
        contract: "0x453701b80324c44366b34d167d40bce2d67d6047",
        name: "CGPN2s",
      },
      cCNTP: {
        balance: "931.150707",
        history: [
          {
            status: "Confirmed",
            Nonce: 299,
            to: "0x530cf1B598D716eC79aa916DD2F05ae8A0cE8ee2",
            transactionFee: "0.00012462910",
            gasUsed: "3114092618",
            isSend: true,
            value: "1000000000000000000",
            time: "2024-07-08T12:35:36.082Z",
            transactionHash:
              "0x5f732da3e6c1b5aed4c6fd929d5290d2092febfd36c999b4aaf1ca53653870de",
          },
          {
            status: "Confirmed",
            Nonce: 301,
            to: "0x530cf1B598D716eC79aa916DD2F05ae8A0cE8ee2",
            transactionFee: "0.00010084926",
            gasUsed: "2670796118",
            isSend: true,
            value: "1000000000000000000",
            time: "2024-07-08T21:30:46.462Z",
            transactionHash:
              "0x2794af9722440bb3d3928cc863cfe26ea55a3b8c16de5819c985c80e869a2384",
          },
          {
            status: "Confirmed",
            Nonce: 303,
            to: "0x530cf1B598D716eC79aa916DD2F05ae8A0cE8ee2",
            transactionFee: "0.00010732800",
            gasUsed: "2842372896",
            isSend: true,
            value: "2000000000000000000",
            time: "2024-07-08T22:24:46.841Z",
            transactionHash:
              "0xf799ff2aff9fed88997ecd09132239b65719fd1af72e215ddfa02ec61d6a9e2d",
          },
          {
            status: "Confirmed",
            Nonce: 304,
            to: "0x530cf1B598D716eC79aa916DD2F05ae8A0cE8ee2",
            transactionFee: "0.00012093294",
            gasUsed: "3202673362",
            isSend: true,
            value: "1000000000000000000",
            time: "2024-07-08T22:27:33.093Z",
            transactionHash:
              "0xb8b876df6bb94a8ed152836aec9872c8b1555deec4235635b1f9a7c36b6e7498",
          },
          {
            status: "Confirmed",
            Nonce: 305,
            to: "0x530cf1B598D716eC79aa916DD2F05ae8A0cE8ee2",
            transactionFee: "0.00013303696",
            gasUsed: "3523224738",
            isSend: true,
            value: "2000000000000000000",
            time: "2024-07-08T22:29:47.707Z",
            transactionHash:
              "0x548653408a1014411d3ee970871043660fe62c6b36d9cdf346d879198b4cc657",
          },
          {
            status: "Confirmed",
            Nonce: 307,
            to: "0x530cf1B598D716eC79aa916DD2F05ae8A0cE8ee2",
            transactionFee: "0.00011117932",
            gasUsed: "2944367798",
            isSend: true,
            value: "200000000000000000",
            time: "2024-07-08T23:57:45.715Z",
            transactionHash:
              "0x353803d285e533e546c35fac3c997fe9af53066c1c78539bc2f6f0d0db7eea5e",
          },
          {
            status: "Confirmed",
            Nonce: 310,
            to: "0x530cf1B598D716eC79aa916DD2F05ae8A0cE8ee2",
            transactionFee: "0.00011964400",
            gasUsed: "3168538192",
            isSend: true,
            value: "1000000000000000000",
            time: "2024-07-11T00:17:23.344Z",
            transactionHash:
              "0x806d1699b9d04ed2d6c8fadf007059b89d5df6e46a42af72aeffac159c5efdbf",
          },
        ],
        network: "CONET Holesky",
        decimal: 18,
        contract: "0x530cf1b598d716ec79aa916dd2f05ae8a0ce8ee2",
        name: "cCNTP",
        unlocked: true,
      },
      cBNBUSDT: {
        balance: "0",
        history: [],
        network: "CONET Holesky",
        decimal: 18,
        contract: "0xae752b49385812af323240b26a49070bb839b10d",
        name: "cBNBUSDT",
      },
      cUSDB: {
        balance: "0",
        history: [],
        network: "CONET Holesky",
        decimal: 18,
        contract: "0x3258e9631ca4992f6674b114bd17c83ca30f734b",
        name: "cUSDB",
      },
      CNTP: {
        balance: "0",
        history: [],
        network: "Blast Mainnet",
        decimal: 18,
        contract: "0x0f43685B2cB08b9FB8Ca1D981fF078C22Fec84c5",
        name: "CNTP",
      },
      cUSDT: {
        balance: "0",
        history: [],
        network: "CONET Holesky",
        decimal: 18,
        contract: "0xfe75074c273b5e33fe268b1d5ac700d5b715da2f",
        name: "cUSDT",
      },
      dWETH: {
        balance: "0",
        history: [],
        network: "CONET Holesky",
        decimal: 18,
        contract: "0x84b6d6A6675F830c8385f022Aefc9e3846A89D3B",
        name: "dWETH",
      },
      dUSDT: {
        balance: "0",
        history: [],
        network: "CONET Holesky",
        decimal: 18,
        contract: "0x0eD55798a8b9647f7908c72a0Ce844ad47274422",
        name: "dUSDT",
      },
      dWBNB: {
        balance: "0",
        history: [],
        network: "CONET Holesky",
        decimal: 18,
        contract: "0xd8b094E91c552c623bc054085871F6c1CA3E5cAd",
        name: "dWBNB",
      },
      conet: {
        balance: "100.005919",
        history: [],
        network: "CONET Holesky",
        decimal: 18,
        contract: "",
        name: "conet",
      },
      CNTPV1: {
        balance: "0",
        history: [],
        network: "CONET Holesky",
        decimal: 18,
        contract: "0x1a73e00ce25e5d56db1b5dd7b2dcdf8ec9f208d2",
        name: "CNTPV1",
      },
      usdt: {
        balance: "0",
        history: [],
        network: "ETH",
        decimal: 6,
        contract: "0xdac17f958d2ee523a2206206994597c13d831ec7",
        name: "usdt",
      },
      usdb: {
        balance: "0",
        history: [],
        network: "Blast Mainnet",
        decimal: 18,
        contract: "0xdac17f958d2ee523a2206206994597c13d831ec7",
        name: "usdb",
      },
      eth: {
        balance: "0",
        history: [],
        network: "ETH",
        decimal: 18,
        contract: "",
        name: "eth",
      },
      blastETH: {
        balance: "0",
        history: [],
        network: "Blast Mainnet",
        decimal: 18,
        contract: "",
        name: "blastETH",
      },
      wbnb: {
        balance: "0",
        history: [],
        network: "BSC",
        decimal: 18,
        contract: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
        name: "wbnb",
      },
      bnb: {
        balance: "0",
        history: [],
        network: "BSC",
        decimal: 18,
        contract: "",
        name: "bnb",
      },
      wusdt: {
        balance: "0",
        history: [],
        network: "BSC",
        decimal: 18,
        contract: "0x55d398326f99059fF775485246999027B3197955",
        name: "wusdt",
      },
    },
    publicKeyArmor:
      "0x03d883eb5bc6efc876024bf799c873f8791f5978111d4173bb04b7fb24d99cef0c",
    keyID: "0xaafa3ea81a2514d8bb69e1a9d279616e145eedbf",
    isPrimary: true,
    isNode: false,
    pgpKey: {
      publicKeyArmor:
        "-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nxjMEZoonaBYJKwYBBAHaRw8BAQdAUcnMi/mvzCwXXsO+rGpZH1dSMfSkFSLT\ngF7Qt0fp1nnNAMKMBBAWCgA+BYJmiidoBAsJBwgJkAZwe6g8WC3tAxUICgQW\nAAIBAhkBApsDAh4BFiEEGanvxyi0hgn+gB6rBnB7qDxYLe0AADXBAQDNolHJ\n2YIanH4UlPzSJjipn+/w1L2/AMWJCedRj7n2xgEAgHh9/dIiK1kqUW23paoH\nl8SrIT+jJLEZR5ebCHoM1QHOOARmiidoEgorBgEEAZdVAQUBAQdAos5kOdA4\nTkrQcuRqbAjcJBqULvt3NtOLj8dVIAqaDCQDAQgHwngEGBYKACoFgmaKJ2gJ\nkAZwe6g8WC3tApsMFiEEGanvxyi0hgn+gB6rBnB7qDxYLe0AAM0cAQCQUob/\nMbw8ijesPm/+98VjyrWZcl5d78YmuTQFxXM4GgEAoSMgWNh8ZNZeRYaaHxZQ\nHSFCZW7kj9r8IQAWcudJNQY=\n=dKnB\n-----END PGP PUBLIC KEY BLOCK-----\n",
      privateKeyArmor:
        "-----BEGIN PGP PRIVATE KEY BLOCK-----\n\nxVgEZoonaBYJKwYBBAHaRw8BAQdAUcnMi/mvzCwXXsO+rGpZH1dSMfSkFSLT\ngF7Qt0fp1nkAAQCbaZOG+JZArx0OAQrbwyWvYV+AjTwTpt+7n33E2PM4fA/+\nzQDCjAQQFgoAPgWCZoonaAQLCQcICZAGcHuoPFgt7QMVCAoEFgACAQIZAQKb\nAwIeARYhBBmp78cotIYJ/oAeqwZwe6g8WC3tAAA1wQEAzaJRydmCGpx+FJT8\n0iY4qZ/v8NS9vwDFiQnnUY+59sYBAIB4ff3SIitZKlFtt6WqB5fEqyE/oySx\nGUeXmwh6DNUBx10EZoonaBIKKwYBBAGXVQEFAQEHQKLOZDnQOE5K0HLkamwI\n3CQalC77dzbTi4/HVSAKmgwkAwEIBwAA/1scsLJm/lulpGRyqgsmCN1a5Q3M\nwaB+b+pidgR0o/kIELrCeAQYFgoAKgWCZoonaAmQBnB7qDxYLe0CmwwWIQQZ\nqe/HKLSGCf6AHqsGcHuoPFgt7QAAzRwBAJBShv8xvDyKN6w+b/73xWPKtZly\nXl3vxia5NAXFczgaAQChIyBY2Hxk1l5FhpofFlAdIUJlbuSP2vwhABZy50k1\nBg==\n=d27s\n-----END PGP PRIVATE KEY BLOCK-----\n",
    },
    privateKeyArmor:
      "0xeaec6d164aa24754ac672d3669fd0282c8dc4749175168a071de66213c27627c",
    hdPath: "m/44'/60'/0'/0/0",
    index: 0,
  };

  // -------- createOrGetWallet --------
  //   const cmd: worker_command = {
  //     cmd: "createOrGetWallet",
  //     data: [],
  //     uuid: "6ddc2676-7982-4b96-8533-52bcb59c2ed6",
  //   };
  //   const result = await createOrGetWallet(cmd);

  // -------- getWalletBalance --------
  //   const cmd: worker_command = {
  //     cmd: "getWalletBalance",
  //     data: ["0xFaA48180274083D394ce4be2174CC41d72cD1164"],
  //     uuid: "6ddc2676-7982-4b96-8533-52bcb59c2ed6",
  //   };
  //   const result = await getWalletBalance(cmd);

  // -------- startMining --------
  //   const cmd: worker_command = {
  //     cmd: "startMining",
  //     data: ["95719168-4819-40ec-86e2-74811e9418bb", profile],
  //     uuid: "6ddc2676-7982-4b96-8533-52bcb59c2ed6",
  //   };
  //   const result = await startMining(cmd);
};
