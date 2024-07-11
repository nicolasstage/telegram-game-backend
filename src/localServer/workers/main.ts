const databaseName = 'conet'
//	******************************************************************
const cCNTP_new_Addr = '0x530cf1B598D716eC79aa916DD2F05ae8A0cE8ee2'.toLocaleLowerCase()
const profile_ver_addr = '0x556bB96fC4C1316B2e5CEaA133f5D4157Eb05681'.toLowerCase()
const CONET_Guardian_NodeInfoV4 = '0x264ea87162463165101A500a6Bf8755b91220350'
const CONET_Guardian_NodesV3 = '0x453701b80324C44366B34d167D40bcE2d67D6047'.toLowerCase()
const CONET_OpenPGP_REG = '0xBDAdAB47eEa9546fda345a4B29CFFeea7027d4aa'
const Claimable_ETHUSDTv3 = '0xfE75074C273b5e33Fe268B1d5AC700d5b715DA2f'.toLowerCase()
const Claimable_BNBUSDTv3 = '0xAE752B49385812AF323240b26A49070bB839b10D'.toLowerCase()
const Claimable_BlastUSDBv3 = '0x3258e9631ca4992F6674b114bd17c83CA30F734B'.toLowerCase()
//	******************************************************************

let CoNET_Data: encrypt_keys_object|null = null

const checkStorage = async () => {
    const database = new PouchDB( databaseName, { auto_compaction: true })

    try {
		const doc = await database.get ('init', {latest: true})
		CoNET_Data = JSON.parse ( buffer.Buffer.from (doc.title,'base64').toString ())
		
	} catch (ex) {
        return logger (`checkStorage have no CoNET data in IndexDB, INIT CoNET data`)
	}
}


const getWallet = async (cmd: worker_command) => {
	if (!CoNET_Data?.profiles) {
		const acc = createKeyHDWallets()
		const profile: profile = {
			tokens: initProfileTokens(),
			publicKeyArmor: acc.publicKey,
			keyID: acc.address,
			isPrimary: true,
			referrer: null,
			isNode: false,
			privateKeyArmor: acc.signingKey.privateKey,
			hdPath: acc.path,
			index: acc.index
		}

		CoNET_Data = {
			mnemonicPhrase: acc.mnemonic.phrase,
			profiles:[profile],
			isReady: true,
			ver: 0,
			nonce: 0
		}
	}

	const profile = CoNET_Data.profiles[0]
	cmd.data[0] = profile.keyID
	return returnUUIDChannel (cmd)
}


const createKeyHDWallets = () => {

	try {
		const root = ethers.Wallet.createRandom()
		return root
	} catch (ex) {
		return null
	}
	
}

const initProfileTokens = () => {
	const ret: conet_tokens = {
		CGPNs: {
			balance: '0',
			history: [],
			network: 'CONET Guardian Nodes (CGPNs)',
			decimal: 1,
			contract: CONET_Guardian_NodesV3,
			name: 'CGPNs'
		},
		CGPN2s: {
			balance: '0',
			history: [],
			network: 'CONET Guardian Nodes (CGPN2s)',
			decimal: 1,
			contract: CONET_Guardian_NodesV3,
			name: 'CGPN2s'
		},
		cCNTP: {
			balance: '0',
			history: [],
			network: 'CONET Holesky',
			decimal: 18,
			contract: cCNTP_new_Addr,
			name: 'cCNTP'
		},
		cBNBUSDT:{
			balance: '0',
			history: [],
			network: 'CONET Holesky',
			decimal: 18,
			contract: Claimable_BNBUSDTv3,
			name: 'cBNBUSDT'
		},
		cUSDB:{
			balance: '0',
			history: [],
			network: 'CONET Holesky',
			decimal: 18,
			contract: Claimable_BlastUSDBv3,
			name: 'cUSDB'
		},
		cUSDT :{
			balance: '0',
			history: [],
			network: 'CONET Holesky',
			decimal: 18,
			contract: Claimable_ETHUSDTv3,
			name: 'cUSDT'
		},
		conet: {
			balance: '0',
			history: [],
			network: 'CONET Holesky',
			decimal: 18,
			contract: '',
			name: 'conet'
		}
	}
	return ret
}

let miningConn;
let cCNTPcurrentTotal = 0;
let miningProfile: profile | null = null;
let miningStatus: "STOP" | "RESTART" | "MINING" = "STOP";
const api_endpoint = `https://api.conet.network/api/`;
let authorization_key = "";
const conet_rpc = 'https://rpc.conet.network'
const provideCONET = new ethers.JsonRpcProvider(conet_rpc)

const blast_CNTPAbi = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "allowance",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "needed",
                "type": "uint256"
            }
        ],
        "name": "ERC20InsufficientAllowance",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "balance",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "needed",
                "type": "uint256"
            }
        ],
        "name": "ERC20InsufficientBalance",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "approver",
                "type": "address"
            }
        ],
        "name": "ERC20InvalidApprover",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "receiver",
                "type": "address"
            }
        ],
        "name": "ERC20InvalidReceiver",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "sender",
                "type": "address"
            }
        ],
        "name": "ERC20InvalidSender",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            }
        ],
        "name": "ERC20InvalidSpender",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "burn",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "burnFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "addr",
                "type": "address"
            },
            {
                "internalType": "bool",
                "name": "status",
                "type": "bool"
            }
        ],
        "name": "changeAddressInWhitelist",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bool",
                "name": "_rule",
                "type": "bool"
            }
        ],
        "name": "changeWhitelistRule",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address[]",
                "name": "_addresses",
                "type": "address[]"
            },
            {
                "internalType": "uint256[]",
                "name": "_amounts",
                "type": "uint256[]"
            }
        ],
        "name": "multiTransferToken",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "internalType": "bool",
                "name": "success",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "whiteList",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "whitelistRule",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

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
  const _authorization_key: string = cmd.data[0];
  const _profile: profile = cmd.data[1];
  if (
    !CoNET_Data ||
    !CoNET_Data?.profiles ||
    authorization_key !== _authorization_key ||
    !_profile
  ) {
    cmd.err = "FAILURE";
    return returnUUIDChannel(cmd);
  }
  const index = CoNET_Data.profiles.findIndex(
    (n) => n.keyID.toLowerCase() === _profile.keyID.toLowerCase()
  );

  if (index < 0) {
    cmd.err = "FAILURE";
    return returnUUIDChannel(cmd);
  }
  miningStatus = "MINING";
  const profile = CoNET_Data.profiles[index];
  return await _startMining(profile, cmd);
};

const scan_erc20_balance = (cmd: worker_command) => new Promise (async resolve => {
    const walletAddr: string = cmd.data[0];

	const erc20 = new ethers.Contract(cCNTP_new_Addr, blast_CNTPAbi, provideCONET)

	try {
		const result = await erc20.balanceOf(walletAddr)
		return resolve(result)
	} catch (ex) {
		logger(`scan_erc20_balance Error!`)
		return resolve (false)
	}
})

const testFunction = async () => {}

testFunction()