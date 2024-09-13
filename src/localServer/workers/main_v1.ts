const databaseName = "conet";

//	******************************************************************
const cCNTP_new_Addr =
  "0xa4b389994A591735332A67f3561D60ce96409347".toLocaleLowerCase();
const faucet_addr =
  "0x04CD419cb93FD4f70059cAeEe34f175459Ae1b6a".toLocaleLowerCase();
const ticket_addr =
  "0x92a033A02fA92169046B91232195D0E82b8017AB".toLocaleLowerCase();
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
const ReferralsAddressV3 =
  "0x1b104BCBa6870D518bC57B5AF97904fBD1030681".toLowerCase();
//	******************************************************************

let miningConn;
let cCNTPcurrentTotal = 0;
let miningProfile: profile | null = null;
let miningStatus: "STOP" | "RESTART" | "MINING" = "STOP";
const api_endpoint = `https://api.conet.network/api/`;
const apiv2_endpoint = `https://apiv2.conet.network/api/`;
const apiv3_endpoint = `https://apiv3.conet.network/api/`;
const ipfsEndpoint = `https://ipfs.conet.network/api/`;
const conet_rpc = "https://rpc.conet.network";
let authorization_key = "";
const provideCONET = new ethers.JsonRpcProvider(conet_rpc);
let CoNET_Data: encrypt_keys_object | null = null;
let leaderboards: any;
let passObj: passInit | null = null;
let preferences: any = null;
let epoch = 0;
let needUpgradeVer = 0;
let listeningBlock = false;
let checkcheckUpdateLock = false;
let getFaucetRoop = 0;
const blast_mainnet_CNTP = "0x0f43685B2cB08b9FB8Ca1D981fF078C22Fec84c5";
const leaderboardUpdateInterval = 1000 * 60 * 60 * 3;
let isFetchingLeaderboard = false;

const conet_storageAbi = [
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
        indexed: true,
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "data",
        type: "string",
      },
    ],
    name: "FragmentsStorage",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "count",
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
        internalType: "string",
        name: "data",
        type: "string",
      },
    ],
    name: "versionUp",
    outputs: [
      {
        internalType: "uint256",
        name: "ver",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

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

const CONET_ReferralsAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "referrer",
        type: "address",
      },
    ],
    name: "addReferrer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "refere",
        type: "address",
      },
      {
        internalType: "address[]",
        name: "referees",
        type: "address[]",
      },
    ],
    name: "checkReferees",
    outputs: [
      {
        internalType: "bool",
        name: "hasAddress",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "referrer",
        type: "address",
      },
    ],
    name: "getReferees",
    outputs: [
      {
        internalType: "address[]",
        name: "referees",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "referee",
        type: "address",
      },
    ],
    name: "getReferrer",
    outputs: [
      {
        internalType: "address",
        name: "referrer",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const faucetAbi = [
  {
    inputs: [],
    stateMutability: "payable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "Sender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "Value",
        type: "uint256",
      },
    ],
    name: "Received",
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
        internalType: "uint256",
        name: "times",
        type: "uint256",
      },
    ],
    name: "e_changeMaxIPTimes",
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
        indexed: true,
        internalType: "bytes32",
        name: "ipaddress",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "e_getFaucet",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "adminList",
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
    name: "changeAddressInAdminlist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "changeFaucetAmount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "_wallets",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
      },
    ],
    name: "changeInit_batch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "max",
        type: "uint256",
      },
    ],
    name: "changeMaxIPTimes",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "wallet",
        type: "address",
      },
    ],
    name: "checkInit",
    outputs: [
      {
        internalType: "bool",
        name: "status",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getBalance",
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
    inputs: [],
    name: "getBlockTimestamp",
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
    inputs: [],
    name: "getFaucet",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "string",
        name: "ipaddress",
        type: "string",
      },
    ],
    name: "getFaucet",
    outputs: [],
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
    name: "initCONET",
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
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "lastFaucet",
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
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "lastIpaddress",
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
    stateMutability: "payable",
    type: "receive",
  },
];

const ticketAbi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
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
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "ERC1155InsufficientBalance",
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
    name: "ERC1155InvalidApprover",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "idsLength",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "valuesLength",
        type: "uint256",
      },
    ],
    name: "ERC1155InvalidArrayLength",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "ERC1155InvalidOperator",
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
    name: "ERC1155InvalidReceiver",
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
    name: "ERC1155InvalidSender",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "ERC1155MissingApprovalForAll",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "ApprovalForAll",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
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
        internalType: "uint256[]",
        name: "ids",
        type: "uint256[]",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "values",
        type: "uint256[]",
      },
    ],
    name: "TransferBatch",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
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
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "TransferSingle",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "value",
        type: "string",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "URI",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "NFTsymbol",
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
    inputs: [
      {
        internalType: "uint256",
        name: "nodeId",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "_metadata",
        type: "string",
      },
    ],
    name: "_changeNodeMetadata",
    outputs: [],
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
    name: "adminList",
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
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
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
        internalType: "address[]",
        name: "accounts",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "ids",
        type: "uint256[]",
      },
    ],
    name: "balanceOfBatch",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
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
        name: "id",
        type: "uint256",
      },
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
        internalType: "uint256[]",
        name: "ids",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "values",
        type: "uint256[]",
      },
    ],
    name: "burnBatch",
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
    name: "changeAddressInAdminlist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "NFT_symbol",
        type: "string",
      },
    ],
    name: "changeNFT_symbol",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "exists",
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
    inputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "getNFTsymbol",
    outputs: [
      {
        internalType: "string",
        name: "NFT_symbol",
        type: "string",
      },
    ],
    stateMutability: "view",
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
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "isApprovedForAll",
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
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "metadata",
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
    inputs: [
      {
        internalType: "address[]",
        name: "_to",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "_ids",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "values",
        type: "uint256[]",
      },
    ],
    name: "mintBatch",
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
        internalType: "uint256[]",
        name: "ids",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "values",
        type: "uint256[]",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "safeBatchTransferFrom",
    outputs: [],
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
        name: "id",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "url",
        type: "string",
      },
    ],
    name: "setNFTUrl",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
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
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
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
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "uri",
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
];

const initV2 = async (profile) => {
  const url = `${apiv3_endpoint}initV2`;
  const result = await postToEndpoint(url, true, {
    walletAddress: profile.keyID,
  });
  logger(result);
};

const getAllReferrer = async () => {
  if (!CoNET_Data?.profiles) {
    return null;
  }

  const provideNewCONET = new ethers.JsonRpcProvider(conet_rpc);
  const CNTP_Referrals = new ethers.Contract(
    ReferralsAddressV3,
    CONET_ReferralsAbi,
    provideNewCONET
  );

  for (let i of CoNET_Data?.profiles) {
    const result = await getReferrer(i.keyID, CNTP_Referrals);
    if (!result || result === "0x0000000000000000000000000000000000000000") {
      delete i.referrer;
      continue;
    }
    i.referrer = result;
  }
};

const getReferrer = async (walletAddress: string, CNTP_Referrals) => {
  let result: string;
  try {
    result = await CNTP_Referrals.getReferrer(walletAddress);
  } catch (ex) {
    logger(`getReferees [${walletAddress}] Error! try again!`);
    return null;
  }
  return result;
};

const checkLeaderboardNeedsUpdate = async (localLeaderboardsTimeStamp) => {
  try {
    if (localLeaderboardsTimeStamp) {
      const currentTimestamp = Date.now();
      const diff = currentTimestamp - parseInt(localLeaderboardsTimeStamp);

      if (diff < leaderboardUpdateInterval) {
        return false;
      }
    }

    return true;
  } catch (ex) {
    return true;
  }
};

const getLeaderboardsFromLocal = async () => {
  const database = new PouchDB(databaseName, { auto_compaction: true });

  try {
    const doc = await database.get("leaderboards", {
      latest: true,
    });
    const _leaderboards = JSON.parse(
      buffer.Buffer.from(doc.title, "base64").toString()
    );
    return _leaderboards;
  } catch (ex) {
    logger(
      `getLeaderboardsFromLocal has no leaderboard timestamp data in IndexDB, INIT leaderboard timestamp`
    );

    return null;
  }
};

const listenProfileVer = async () => {
  listeningBlock = true;

  provideCONET.on("block", async (block) => {
    if (block === epoch + 1) {
      epoch++;

      const profiles = CoNET_Data?.profiles;
      if (!profiles) {
        return;
      }

      await getAllProfileAssetsBalance();
      await getAllProfileTicketsBalance();
      await getAllReferrer();
      leaderboards = await getLeaderboards();

      const cmd: channelWroker = {
        cmd: "profileVer",
        data: [profiles[0], leaderboards || null],
      };

      sendState("toFrontEnd", cmd);

      if (needUpgradeVer === epoch && profiles) {
        const [nonce, _ver] = await checkProfileVersion(profiles[0].keyID);
        await updateProfilesToRemote(_ver, CoNET_Data, profiles);
      }

      storeSystemData();
    }
  });

  epoch = await provideCONET.getBlockNumber();
};

const updateFragmentsToIPFS = (
  encryptData: string,
  hash: string,
  keyID: string,
  privateKeyArmor: string
) =>
  new Promise(async (resolve) => {
    const url = `${ipfsEndpoint}storageFragment`;

    const message = JSON.stringify({
      walletAddress: keyID,
      data: encryptData,
      hash,
    });
    const messageHash = ethers.id(message);

    const signMessage = CoNETModule.EthCrypto.sign(
      privateKeyArmor,
      messageHash
    );

    const sendData = {
      message,
      signMessage,
    };

    try {
      await postToEndpoint(url, true, sendData);
    } catch (ex) {
      return resolve(false);
    }
    return resolve(true);
  });

const storagePieceToIPFS = (
  mnemonicPhrasePassword: string,
  fragment: string,
  index: number,
  totalFragment: number,
  targetFileLength: number,
  ver: number,
  privateArmor: string,
  keyID: string
) =>
  new Promise(async (resolve) => {
    const fileName = createFragmentFileName(ver, mnemonicPhrasePassword, index);

    const text = await getFragmentsFromPublic(fileName);
    if (text) {
      return resolve(true);
    }

    const _dummylength =
      targetFileLength - fragment.length > 1024 * 5
        ? targetFileLength - totalFragment
        : 0;
    const dummylength =
      totalFragment === 2 && _dummylength
        ? Math.round((targetFileLength - fragment.length) * Math.random())
        : 0;
    const dummyData = buffer.Buffer.allocUnsafeSlow(dummylength);
    const partEncryptPassword = encryptPasswordIssue(
      ver,
      mnemonicPhrasePassword,
      index
    );
    const localData = {
      data: fragment,
      totalFragment: totalFragment,
      index,
    };
    const IPFSData = {
      data: fragment,
      totalFragment: totalFragment,
      index,
      dummyData: dummyData,
    };

    const piece: fragmentsObj = {
      localEncryptedText: await CoNETModule.aesGcmEncrypt(
        JSON.stringify(localData),
        partEncryptPassword
      ),
      remoteEncryptedText: await CoNETModule.aesGcmEncrypt(
        JSON.stringify(IPFSData),
        partEncryptPassword
      ),
      fileName,
    };

    const result = await updateFragmentsToIPFS(
      piece.remoteEncryptedText,
      piece.fileName,
      keyID,
      privateArmor
    );
    resolve(result);
  });

const updateProfilesVersionToIPFS: () => Promise<boolean> = () =>
  new Promise(async (resolve) => {
    if (!CoNET_Data?.profiles || !passObj) {
      logger(
        `updateProfilesVersion !CoNET_Data[${!CoNET_Data}] || !passObj[${!passObj}] === true Error! Stop process.`
      );
      return resolve(false);
    }

    const profile = CoNET_Data.profiles[0];
    const privateKeyArmor = profile.privateKeyArmor || "";

    if (!profile || !privateKeyArmor) {
      logger(`updateProfilesVersion Error! profile empty Error! `);
      return resolve(false);
    }
    const constBalance = profile.tokens.conet.balance;

    let chainVer;

    try {
      [, chainVer] = await checkProfileVersion(profile.keyID);
      const health = await getCONET_api_health();
      if (!health) {
        logger(`CONET api server hasn't health`);
        return resolve(false);
      }
    } catch (ex: any) {
      logger(
        `updateProfilesVersion checkProfileVersion or getCONET_api_health had Error!`,
        ex.message
      );
      return resolve(false);
    }

    const passward = ethers.id(ethers.id(CoNET_Data.mnemonicPhrase));
    const profilesClearText = JSON.stringify(CoNET_Data.profiles);
    const fileLength = Math.round(1024 * (10 + Math.random() * 20));
    const chearTextFragments = splitTextLimitLength(
      profilesClearText,
      fileLength
    );
    const series: any[] = [];

    sendState("beforeunload", true);
    chearTextFragments.forEach((n, index) => {
      series.push(
        storagePieceToIPFS(
          passward,
          n,
          index,
          chearTextFragments.length,
          fileLength,
          chainVer,
          privateKeyArmor,
          profile.keyID
        )
      );
    });

    try {
      await Promise.all([...series]);

      const cloud = await checkIPFSFragmenReadyOrNot(chainVer, CoNET_Data);
      if (!cloud) {
        logger(`updateProfilesVersionToIPFS has failed!`);
        return resolve(false);
      }
    } catch (ex) {
      sendState("beforeunload", false);
      logger(`updateProfilesVersion Error!`);
      return resolve(false);
    }

    resolve(true);
  });

const getCONET_api_health = async () => {
  const url = `${apiv3_endpoint}health`;
  try {
    const result: any = await postToEndpoint(url, false, null);
    return result?.health;
  } catch (ex) {
    return null;
  }
};

const getFragmentsFromPublic: (hash: string) => Promise<string> = (hash) => {
  const fileUrl = ipfsEndpoint + `getFragment/${hash}`;
  return new Promise((resolve) => {
    fetchWithTimeout(fileUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        Connection: "close",
      },
      cache: "no-store",
      referrerPolicy: "no-referrer",
    })
      .then((res) => {
        if (res.status !== 200) {
          logger(`getFragmentsFromPublic can't get hash ${hash} Error!`);
          return "";
        }
        return res.text();
      })
      .then(async (text) => {
        return resolve(text);
      });
  });
};

const checkIPFSFragmenReadyOrNot: (
  ver: number,
  CoNET_data: encrypt_keys_object
) => Promise<boolean> = (ver: number, CoNET_data: encrypt_keys_object) =>
  new Promise(async (resolve) => {
    let _chainVer = ver;

    const passward = ethers.id(ethers.id(CoNET_data.mnemonicPhrase));
    const partEncryptPassword = encryptPasswordIssue(_chainVer, passward, 0);
    const firstFragmentName = createFragmentFileName(_chainVer, passward, 0);
    if (!CoNET_data?.fragmentClass) {
      CoNET_data.fragmentClass = {
        mainFragmentName: firstFragmentName,
        failures: 0,
      };
    } else {
      CoNET_data.fragmentClass.mainFragmentName = firstFragmentName;
    }

    const firstFragmentEncrypted = await getFragmentsFromPublic(
      firstFragmentName
    );
    if (!firstFragmentEncrypted) {
      return resolve(false);
    }

    let firstFragmentObj;

    try {
      const firstFragmentdecrypted = await CoNETModule.aesGcmDecrypt(
        firstFragmentEncrypted,
        partEncryptPassword
      );
      firstFragmentObj = JSON.parse(firstFragmentdecrypted);
    } catch (ex) {
      return resolve(false);
    }

    const totalFragment: number[] = [];
    for (let i = 0; i < firstFragmentObj.totalFragment; i++) {
      totalFragment.push(i);
    }

    let clearData: string = firstFragmentObj.data;
    const series: any[] = [];
    let success = false;
    await async.mapLimit(totalFragment, 3, async (n, next) => {
      const cleartext = await getNextFragmentIPFS(_chainVer, passward, n);
      if (cleartext) {
        success = true;
      }
    });

    return resolve(success);
  });

const getNextFragmentIPFS = async (ver: number, passObjPassword: string, i) => {
  const nextEncryptPassword = encryptPasswordIssue(ver, passObjPassword, i);
  const nextFragmentHash = createFragmentFileName(ver, passObjPassword, i);
  const nextFragmentText = await getFragmentsFromPublic(nextFragmentHash);
  logger(
    `getNextFragmentIPFS [${nextFragmentHash}] length = ${nextFragmentText.length}`
  );
  if (!nextFragmentText) {
    logger(
      `getNextFragmentIPFS Fetch [${nextFragmentHash}] got remote null Error!`
    );
    return "";
  }
  try {
    const decryptedText = await CoNETModule.aesGcmDecrypt(
      nextFragmentText,
      nextEncryptPassword
    );
    const decryptedFragment = JSON.parse(decryptedText);
    return decryptedFragment.data;
  } catch (ex) {
    logger(
      `getNextFragmentIPFS aesGcmDecrypt [${nextFragmentText}] error!`,
      ex
    );
    return "";
  }
};

const updateChainVersion: (profile: profile) => Promise<string> = async (
  profile: profile
) => {
  const wallet = new ethers.Wallet(profile.privateKeyArmor, provideCONET);
  const conet_storage = new ethers.Contract(
    profile_ver_addr,
    conet_storageAbi,
    wallet
  );
  try {
    const tx = await conet_storage.versionUp("0x0");
    await tx.wait();
    const ver = await conet_storage.count(profile.keyID);
    return ver.toString();
  } catch (ex) {
    logger(`updateChainVersion error! try again`, ex);
    return "-1";
  }
};

const updateProfilesToRemote = (_ver, CoNET_Data, profiles) =>
  new Promise(async (resolve) => {
    const result = await updateProfilesVersionToIPFS();
    if (!result) {
      return resolve(false);
    }

    const result1 = await checkIPFSFragmenReadyOrNot(_ver, CoNET_Data);
    if (!result1) {
      return resolve(false);
    }

    const ver = await updateChainVersion(profiles[0]);
    if (ver < "0") {
      return resolve(false);
    }

    await storagePieceToLocal(ver);
    await storeSystemData();

    checkcheckUpdateLock = false;
    return resolve(true);
  });

const checkProfileVersion = async (wallet: string) => {
  const conet_storage = new ethers.Contract(
    profile_ver_addr,
    conet_storageAbi,
    provideCONET
  );
  const [count, nonce] = await Promise.all([
    conet_storage.count(wallet),
    provideCONET.getTransactionCount(wallet),
  ]);

  return [parseInt(count.toString()), parseInt(nonce.toString())];
};

const checkUpdateAccount = () =>
  new Promise(async (resolve) => {
    if (!CoNET_Data || !CoNET_Data?.profiles) {
      logger(`checkUpdateAccount CoNET_Data?.profiles hasn't ready!`);
      return resolve(false);
    }

    const profiles = CoNET_Data.profiles;

    if (checkcheckUpdateLock) {
      return resolve(false);
    }

    checkcheckUpdateLock = true;

    const [nonce, _ver] = await checkProfileVersion(profiles[0].keyID);

    CoNET_Data.nonce = nonce;

    if (_ver === CoNET_Data.ver) {
      return resolve(true);
    }

    //	Local version bigger than remote
    if (_ver < CoNET_Data.ver) {
      const result = await updateProfilesToRemote(_ver, CoNET_Data, profiles);
      return resolve(result);
    }

    await getDetermineVersionProfile(_ver, CoNET_Data);

    checkcheckUpdateLock = false;
    return resolve(true);
  });

const getDetermineVersionProfile = (ver: number, CoNET_Data) =>
  new Promise(async (resolve) => {
    let _chainVer = ver;

    const passward = ethers.id(ethers.id(CoNET_Data.mnemonicPhrase));
    const partEncryptPassword = encryptPasswordIssue(_chainVer, passward, 0);
    const firstFragmentName = createFragmentFileName(_chainVer, passward, 0);
    if (!CoNET_Data.fragmentClass) {
      CoNET_Data.fragmentClass = {
        mainFragmentName: firstFragmentName,
      };
    }
    CoNET_Data.fragmentClass.mainFragmentName = firstFragmentName;

    const firstFragmentEncrypted = await getFragmentsFromPublic(
      firstFragmentName
    );

    if (!firstFragmentEncrypted) {
      //	try to get Previous bersion
      if (ver > 2) {
        return resolve(await getDetermineVersionProfile(ver - 1, CoNET_Data));
      }
      return resolve(false);
    }

    logger(
      `checkUpdateAccount fetch ${_chainVer} first Fragment [${firstFragmentName}] with passward [${partEncryptPassword}]`
    );

    let firstFragmentObj;

    try {
      const firstFragmentdecrypted = await CoNETModule.aesGcmDecrypt(
        firstFragmentEncrypted,
        partEncryptPassword
      );
      firstFragmentObj = JSON.parse(firstFragmentdecrypted);
    } catch (ex) {
      return resolve(false);
    }

    const totalFragment = firstFragmentObj.totalFragment;
    let clearData: string = firstFragmentObj.data;
    const series: any[] = [];

    for (let i = 1; i < totalFragment; i++) {
      const stage = (next) => {
        getNextFragmentIPFS(_chainVer, passward, i).then((text) => {
          if (!text) {
            return next(`getNextFragment [${i}] return NULL Error`);
          }
          clearData += text;
          return next(null);
        });
      };
      series.push(stage);
    }

    return async
      .series(series)
      .then(async () => {
        let profile;

        profile = JSON.parse(clearData);

        if (CoNET_Data) {
          CoNET_Data.profiles = profile;
          CoNET_Data.ver = _chainVer;
          CoNET_Data.fragmentClass.failures = 0;
        }

        await storagePieceToLocal();

        await storeSystemData();

        const cmd: channelWroker = {
          cmd: "profileVer",
          data: [_chainVer],
        };
        sendState("toFrontEnd", cmd);
        return resolve(true);
      })
      .catch((ex) => {
        return resolve(false);
      });
  });

const getAllProfileAssetsBalance = () =>
  new Promise(async (resolve) => {
    if (!CoNET_Data?.profiles) {
      logger(`getAllProfileAssetsBalance Error! CoNET_Data.profiles empty!`);
      return resolve(false);
    }

    const profiles = CoNET_Data.profiles;

    const runningList: any = [];

    for (let profile of CoNET_Data.profiles) {
      runningList.push(getProfileAssets_CONET_Balance(profile));
    }

    await Promise.all(runningList);
    const constBalance = profiles[0].tokens.conet.balance;

    if (constBalance > "0.0001") {
      await checkUpdateAccount();
    } else {
      const health = await getCONET_api_health();

      if (!health) {
        return logger(`getAllProfileAssetsBalance getCONET_api_health Err`);
      }

      await getFaucet(profiles[0].keyID, profiles[0].privateKeyArmor);
    }

    return resolve(true);
  });

const getAllProfileTicketsBalance = () =>
  new Promise(async (resolve) => {
    if (!CoNET_Data?.profiles) {
      logger(`getAllProfileTicketsBalance Error! CoNET_Data.profiles empty!`);
      return resolve(false);
    }

    const runningList: any = [];

    for (let profile of CoNET_Data.profiles) {
      runningList.push(getProfileTicketsBalance(profile));
    }

    await Promise.all(runningList);

    return resolve(true);
  });

const getProfileTicketsBalance = async (profile: profile) => {
  const provide = new ethers.JsonRpcProvider(conet_rpc);
  const wallet = new ethers.Wallet(profile.privateKeyArmor, provide);
  const ticketSmartContract = new ethers.Contract(
    ticket_addr,
    ticketAbi,
    wallet
  );

  try {
    const ticketBalance = await ticketSmartContract.balanceOf(profile.keyID, 1);
    console.log(`ticket balance = ${ticketBalance}`);
    profile.tickets = { balance: ticketBalance.toString() };
  } catch (ex) {
    console.log(ex);
  }
};

const getFaucet = async (keyId, privateKey: string) => {
  if (CoNET_Data?.profiles[0].tokens.conet.balance === "0") {
    if (++getFaucetRoop > 6) {
      getFaucetRoop = 0;
      logger(`getFaucet Roop > 6 STOP process!`);
      return null;
    }
    const url = `${apiv3_endpoint}conet-faucet`;
    let result;
    try {
      result = await postToEndpoint(url, true, { walletAddr: keyId });
    } catch (ex) {
      logger(`getFaucet postToEndpoint [${url}] error! `, ex);
      return null;
    }
    getFaucetRoop = 0;

    if (result) {
      return true;
    }

    return null;
  } else {
    const provide = new ethers.JsonRpcProvider(conet_rpc);
    const wallet = new ethers.Wallet(privateKey, provide);
    const faucetSmartContract = new ethers.Contract(
      faucet_addr,
      faucetAbi,
      wallet
    );

    try {
      const tx = await faucetSmartContract.getFaucet();
      console.log(`success hash = ${tx.hash}`);
      return true;
    } catch (ex) {
      console.log(ex);
      return null;
    }
  }
};

const checkTokenStructure = (token: any) => {
  if (!token?.cCNTP) {
    token.cCNTP = {
      balance: "0",
      history: [],
      network: "CONET Holesky",
      decimal: 18,
      contract: cCNTP_new_Addr,
      name: "cCNTP",
    };
  } else {
    token.cCNTP.name = "cCNTP";
  }

  if (!token?.CNTP) {
    token.CNTP = {
      balance: "0",
      history: [],
      network: "Blast Mainnet",
      decimal: 18,
      contract: blast_mainnet_CNTP,
      name: "CNTP",
    };
  } else {
    token.CNTP.name = "CNTP";
  }

  if (!token?.conet) {
    token.conet = {
      balance: "0",
      history: [],
      network: "CONET Holesky",
      decimal: 18,
      contract: "",
      name: "conet",
    };
  } else {
    token.conet.name = "conet";
  }
};

const getProfileAssets_CONET_Balance = async (profile: profile) => {
  const key = profile.keyID;

  if (key) {
    const current = profile.tokens;
    checkTokenStructure(current);

    const provideCONET = new ethers.JsonRpcProvider(conet_rpc);

    const [balanceCCNTP, conet_Holesky] = await Promise.all([
      scanCCNTP(key, provideCONET),
      scanCONETHolesky(key, provideCONET),
    ]);

    current.cCNTP.balance = balanceCCNTP;
    parseFloat(ethers.formatEther(balanceCCNTP)).toFixed(6);

    current.conet.balance =
      conet_Holesky === BigInt(0)
        ? "0"
        : typeof conet_Holesky !== "boolean"
        ? parseFloat(ethers.formatEther(conet_Holesky)).toFixed(6)
        : "";
  }

  return true;
};

const scan_natureBalance = (
  provide: any,
  walletAddr: string,
  provideUrl = ""
) =>
  new Promise(async (resolve) => {
    try {
      const result = await provide.getBalance(walletAddr);
      return resolve(result);
    } catch (ex) {
      logger(`scan_natureBalance Error!`, ex);
      return resolve(false);
    }
  });

const scanCONETHolesky = async (walletAddr: string, privideCONET: any) => {
  return await scan_natureBalance(privideCONET, walletAddr);
};

const scanCCNTP = async (walletAddr: string, privide: any) => {
  return await scan_erc20_balance(walletAddr, privide, cCNTP_new_Addr);
};

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

  CoNET_Data.encryptedString = encryptIterate3;

  if (!CoNET_Data.encryptedString) {
    return logger(`encryptStoreData aesGcmEncrypt Error!`);
  }

  try {
    await storageHashData(
      "init",
      buffer.Buffer.from(customJsonStringify(CoNET_Data)).toString("base64")
    );
  } catch (ex) {
    logger(`storeSystemData storageHashData Error!`, ex);
  }
};

const storageHashData = async (docId: string, data: string) => {
  const database = new PouchDB(databaseName, { auto_compaction: true });

  let doc: any;
  try {
    doc = await database.get(docId, { latest: true });

    try {
      await database.put({ _id: docId, title: data, _rev: doc._rev });
    } catch (ex) {
      logger(`put doc storageHashData Error!`, ex);
    }
  } catch (ex: any) {
    if (/^not_found/.test(ex.name)) {
      try {
        await database.post({ _id: docId, title: data });
      } catch (ex) {
        logger(`create new doc storageHashData Error!`, ex);
      }
    } else {
      logger(`get doc storageHashData Error!`, ex);
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

const splitTextLimitLength: (test: string, limitLength: number) => string[] = (
  test,
  limitLength
) => {
  const ret: string[] = [];
  let start = 0;
  let _limitLength = test.length > limitLength ? limitLength : test.length / 2;
  const split = () => {
    const price = test.substring(start, _limitLength + start);
    if (price.length) {
      ret.push(price);

      start += _limitLength;
    }
    if (start < test.length) {
      return split();
    }
    return ret;
  };
  return split();
};

const encryptPasswordIssue = (ver: number, passcode: string, part: number) => {
  const password = ethers.id(
    "0x" +
      (
        BigInt(ethers.id(ver.toString())) + BigInt(ethers.id(passcode))
      ).toString(16)
  );
  let _pass = ethers.id(password);
  for (let i = 0; i < part; i++) {
    _pass = ethers.id(_pass);
  }
  return _pass.substring(2);
};

const createFragmentFileName = (
  ver: number,
  password: string,
  part: number
) => {
  return ethers.id(
    ethers.id(
      ethers.id(
        ethers.id(ver.toString()) +
          ethers.id(password) +
          ethers.id(part.toString())
      )
    )
  );
};

const _storagePieceToLocal = (
  mnemonicPhrasePassword: string,
  fragment: string,
  index: number,
  totalFragment: number,
  targetFileLength: number,
  ver: number,
  privateArmor: string,
  keyID: string
) =>
  new Promise(async (resolve) => {
    const partEncryptPassword = encryptPasswordIssue(
      ver,
      mnemonicPhrasePassword,
      index
    );
    const localData = {
      data: fragment,
      totalFragment: totalFragment,
      index,
    };
    const piece = {
      localEncryptedText: await CoNETModule.aesGcmEncrypt(
        JSON.stringify(localData),
        partEncryptPassword
      ),
      fileName: createFragmentFileName(ver, mnemonicPhrasePassword, index),
    };
    storageHashData(piece.fileName, piece.localEncryptedText).then(() => {
      resolve(true);
    });
  });

const storagePieceToLocal = (newVer = "-1") => {
  return new Promise((resolve) => {
    if (!CoNET_Data || !CoNET_Data.profiles) {
      logger(`storagePieceToLocal empty CoNET_Data Error!`);
      return resolve(false);
    }
    const profile = CoNET_Data.profiles[0];
    const fileLength = Math.round(1024 * (10 + Math.random() * 20));

    let firstProfilePgpKey = { publicKeyArmor: "", privateKeyArmor: "" };
    if (CoNET_Data.profiles[0].pgpKey) {
      firstProfilePgpKey = {
        publicKeyArmor: CoNET_Data.profiles[0].pgpKey.publicKeyArmor,
        privateKeyArmor: CoNET_Data.profiles[0].pgpKey.privateKeyArmor,
      };
      CoNET_Data.profiles[0].pgpKey = firstProfilePgpKey;
    }

    const profilesClearText = JSON.stringify(CoNET_Data.profiles);
    const chearTextFragments = splitTextLimitLength(
      profilesClearText,
      fileLength
    );
    const passward = ethers.id(ethers.id(CoNET_Data.mnemonicPhrase));
    const privateKeyArmor = profile.privateKeyArmor || "";
    const ver = (CoNET_Data.ver =
      newVer < "0" ? CoNET_Data.ver + 1 : parseInt(newVer));

    let index = 0;

    return async.mapLimit(
      chearTextFragments,
      1,
      async (n: any, next: any) => {
        await _storagePieceToLocal(
          passward,
          n,
          index++,
          chearTextFragments.length,
          fileLength,
          ver,
          privateKeyArmor,
          profile.keyID
        );
      },
      () => {
        logger(`async.series finished`);
        resolve(true);
      }
    );
  });
};

const getLeaderboards = async () => {
  let allLeaderboards = leaderboards;

  if (!allLeaderboards) {
    allLeaderboards = await getLeaderboardsFromLocal();
  }

  const leaderboardNeedsUpdate = await checkLeaderboardNeedsUpdate(
    allLeaderboards?.timestamp || null
  );

  if (leaderboardNeedsUpdate) {
    if (isFetchingLeaderboard) {
      return allLeaderboards;
    }

    isFetchingLeaderboard = true;

    // leaderboard url
    const url = `${ipfsEndpoint}getFragment/gaem_LeaderBoard`;

    // post request
    const response = await fetchWithTimeout(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        Connection: "close",
      },
      cache: "no-store",
      referrerPolicy: "no-referrer",
    });

    isFetchingLeaderboard = false;

    // Error!
    if (response.status !== 200) {
      return null;
    }

    allLeaderboards = await response.json();
    allLeaderboards.timestamp = Date.now();

    // save leaderboards
    storageHashData(
      "leaderboards",
      buffer.Buffer.from(JSON.stringify(allLeaderboards))
    );
  }

  return {
    allTime: allLeaderboards.totally,
    monthly: allLeaderboards.monthly,
    weekly: allLeaderboards.weekly,
    daily: allLeaderboards.daliy,
    timestamp: allLeaderboards.timestamp,
  };
};

/**
 * Create a new wallet if no wallet exists yet in the local storage or get the wallet from the local storage if it exists.
 *
 * @param cmd - empty data
 * @returns
 */
const createOrGetWallet = async () => {
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
      tickets: { balance: "0" },
    };

    CoNET_Data = {
      mnemonicPhrase: acc.mnemonic.phrase,
      profiles: [profile],
      isReady: true,
      ver: 0,
      nonce: 0,
    };
  }

  CoNET_Data.profiles.forEach(async (n) => {
    n.keyID = n.keyID.toLocaleLowerCase();
    await initV2(n);
    n.tokens.cCNTP.unlocked = false;
  });

  await getFaucet(
    CoNET_Data.profiles[0].keyID,
    CoNET_Data.profiles[0].privateKeyArmor
  );

  await getAllReferrer();

  await storeSystemData();

  const profile = CoNET_Data.profiles[0];

  const leaderboards = await getLeaderboards();

  const cmd: channelWroker = {
    cmd: "profileVer",
    data: [profile, leaderboards],
  };

  sendState("toFrontEnd", cmd);
};

const importWallet = async (cmd: worker_command) => {
  const privateKey = cmd.data[0];

  cmd.data = [];

  if (!CoNET_Data || !CoNET_Data?.profiles) {
    cmd.err = "FAILURE";
    return returnUUIDChannel(cmd);
  }

  let wallet;
  try {
    wallet = new ethers.Wallet(privateKey);
  } catch (ex) {
    cmd.err = "FAILURE";
    return returnUUIDChannel(cmd);
  }

  const profiles = CoNET_Data.profiles;
  const checkIndex = profiles.findIndex(
    (n) => n.keyID.toLowerCase() === wallet.address.toLowerCase()
  );
  if (checkIndex > -1) {
    cmd.data[0] = CoNET_Data.profiles;
    cmd.err = "FAILURE";
    return returnUUIDChannel(cmd);
  }

  const key = await createGPGKey("", "", "");

  const profile: profile = {
    isPrimary: false,
    keyID: wallet.address,
    privateKeyArmor: privateKey,
    hdPath: "",
    index: -1,
    isNode: false,
    pgpKey: {
      privateKeyArmor: key.privateKey,
      publicKeyArmor: key.publicKey,
    },
    referrer: null,
    tokens: initProfileTokens(),
    tickets: { balance: "0" },
  };

  CoNET_Data.profiles = [profile];

  await getFaucet(
    CoNET_Data.profiles[0].keyID,
    CoNET_Data.profiles[0].privateKeyArmor
  );

  CoNET_Data.profiles.forEach(async (n) => {
    n.keyID = n.keyID.toLocaleLowerCase();
    await initV2(n);
    n.tokens.cCNTP.unlocked = false;
  });

  await getAllReferrer();

  cmd.data[0] = CoNET_Data.profiles[0];
  returnUUIDChannel(cmd);

  await storagePieceToLocal();
  await storeSystemData();
  needUpgradeVer = epoch + 25;
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
    data = customJsonStringify(value);
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
    clearTimeout(timeCount);
  };

  xhr.upload.onerror = (err) => {
    logger(`xhr.upload.onerror`, err);
    clearTimeout(timeCount);
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

      if (CoNET_Data) {
        const newBalance = await scan_erc20_balance(
          CoNET_Data.profiles[0].keyID,
          provideCONET,
          cCNTP_new_Addr
        );
        CoNET_Data.profiles[0].tokens.cCNTP.balance = newBalance;
        profile = CoNET_Data.profiles[0];
        storeSystemData();
      }

      kk.rate =
        typeof kk.rate === "number"
          ? kk.rate.toFixed(10)
          : parseFloat(kk.rate).toFixed(10);
      kk["currentCCNTP"] = (
        parseFloat(profile.tokens.cCNTP.balance || "0") - cCNTPcurrentTotal
      ).toFixed(8);

      const cmd2: channelWroker = {
        cmd: "miningStatus",
        data: [JSON.stringify(kk)],
      };

      sendState("toFrontEnd", cmd2);
    }
  ));
};

/**
 * Start mining. Keeps sending mining status to the frontend.
 * @param cmd - data[0] is a conet profile
 * @returns
 */
const startMining = async (cmd: worker_command) => {
  if (!CoNET_Data) {
    cmd.err = "FAILURE";
    cmd.data[0] = "CoNET_Data not found";
    return returnUUIDChannel(cmd);
  }

  const profileKeyID = cmd.data[0];

  if (!profileKeyID) {
    cmd.err = "FAILURE";
    cmd.data[0] = "ProfileKeyID parameter not received from frontend";
    return returnUUIDChannel(cmd);
  }

  let _profile = CoNET_Data?.profiles?.find((p) => p.keyID === profileKeyID);

  if (!_profile) {
    cmd.err = "FAILURE";
    cmd.data[0] = "Profile not found in CoNET_Data";
    return returnUUIDChannel(cmd);
  }

  const newBalance = await scan_erc20_balance(
    _profile.keyID,
    provideCONET,
    cCNTP_new_Addr
  );
  CoNET_Data.profiles[0].tokens.cCNTP.balance = newBalance;
  _profile = CoNET_Data.profiles[0];
  storeSystemData();

  miningStatus = "MINING";
  return await _startMining(_profile, cmd);
};

const scan_erc20_balance = (
  walletAddr: string,
  _provideCONET: any,
  _erc20Address: string
): Promise<string> =>
  new Promise(async (resolve) => {
    const erc20 = new ethers.Contract(
      _erc20Address,
      blast_CNTPAbi,
      _provideCONET
    );

    try {
      const result = await erc20.balanceOf(walletAddr);
      return resolve(result);
    } catch (ex) {
      logger(`scan_erc20_balance Error!`);
      return resolve("");
    }
  });

const fetchRouletteResult = async (_profile: profile): Promise<any> => {
  //		api server health check
  const health = await getCONET_api_health();
  if (!health) {
    return null;
  }

  //		make post obj
  const message = JSON.stringify({ walletAddress: _profile.keyID });

  //		use private key to sign post obj
  const messageHash = ethers.id(message);
  const signMessage = CoNETModule.EthCrypto.sign(
    _profile.privateKeyArmor,
    messageHash
  );

  const sendData = {
    message,
    signMessage,
  };

  //		lottery url
  const url = `${apiv3_endpoint}ticket-lottery`;

  try {
    const result = await postToEndpoint(url, true, sendData);
    return result;
  } catch (ex) {
    logger(`fetchRouletteResult postToEndpoint [${url}] error! `, ex);
    return null;
  }
};

const getRouletteResult = async (cmd: worker_command) => {
  if (!CoNET_Data) {
    cmd.err = "FAILURE";
    cmd.data[0] = "CoNET_Data not found";
    return returnUUIDChannel(cmd);
  }

  const profileKeyID = cmd.data[0];

  if (!profileKeyID) {
    cmd.err = "FAILURE";
    cmd.data[0] = "ProfileKeyID parameter not received from frontend";
    return returnUUIDChannel(cmd);
  }

  let _profile = CoNET_Data?.profiles?.find(
    (p) => p.keyID.toLowerCase() === profileKeyID.toLowerCase()
  );

  if (!_profile) {
    cmd.err = "FAILURE";
    cmd.data[0] = "Profile not found in CoNET_Data";
    return returnUUIDChannel(cmd);
  }

  await getFaucet(_profile.keyID, _profile.privateKeyArmor);

  let rouletteResult = null;

  if (await isApprovedForAll(_profile.privateKeyArmor)) {
    rouletteResult = await fetchRouletteResult(_profile);
  } else if (await setApprovalForAll(_profile.privateKeyArmor)) {
    rouletteResult = await fetchRouletteResult(_profile);
  }

  if (!rouletteResult) {
    cmd.err = "FAILURE";
    return returnUUIDChannel(cmd);
  }

  logger(`testLottery got response ${rouletteResult}`);

  cmd.data[0] = rouletteResult;
  returnUUIDChannel(cmd);

  return rouletteResult;
};

const setApprovalForAll = async (privateKey: string) => {
  const CONET_manager_Wallet = "0x068759bCfd929fb17258aF372c30eE6CD277B872";
  const rpcProvider = new ethers.JsonRpcProvider(conet_rpc);
  const wallet = new ethers.Wallet(privateKey, rpcProvider);
  const ticketContract = new ethers.Contract(ticket_addr, ticketAbi, wallet);

  try {
    const tx = await ticketContract.setApprovalForAll(
      CONET_manager_Wallet,
      true
    );

    if (!tx) {
      console.debug(`Transfer Error!`);
      return null;
    }

    return tx;
  } catch (ex) {
    console.debug(`Transfer Error!`);
    return null;
  }
};

const isApprovedForAll = async (privateKey: string) => {
  const CONET_manager_Wallet = "0x068759bcfd929fb17258af372c30ee6cd277b872";
  const rpcProvider = new ethers.JsonRpcProvider(conet_rpc);
  const wallet = new ethers.Wallet(privateKey, rpcProvider);
  const ticketContract = new ethers.Contract(ticket_addr, ticketAbi, wallet);

  try {
    const isApproved = await ticketContract.isApprovedForAll(
      wallet.address,
      CONET_manager_Wallet
    );

    return isApproved;
  } catch (ex) {
    console.debug(`Transfer Error!`);
    return null;
  }
};

const registerReferrer = async (cmd: worker_command) => {
  const referrer = cmd.data[0];

  if (!referrer) {
    cmd.err = "FAILURE";
    returnUUIDChannel(cmd);
  }

  if (!CoNET_Data?.profiles) {
    logger(`registerReferrer CoNET_Data?.profiles Empty error!`);
    cmd.err = "FAILURE";
    return returnUUIDChannel(cmd);
  }

  const profile = CoNET_Data.profiles[0];

  if (!profile || !referrer) {
    cmd.err = "FAILURE";
    return returnUUIDChannel(cmd);
  }

  if (referrer.toLowerCase() === profile.keyID.toLowerCase()) {
    cmd.err = "FAILURE";
    return returnUUIDChannel(cmd);
  }

  const provideNewCONET = new ethers.JsonRpcProvider(conet_rpc);
  const wallet = new ethers.Wallet(profile.privateKeyArmor, provideNewCONET);
  const CNTP_Referrals = new ethers.Contract(
    ReferralsAddressV3,
    CONET_ReferralsAbi,
    wallet
  );

  try {
    const ref = await CNTP_Referrals.getReferrer(profile.keyID);
    if (ref === "0x0000000000000000000000000000000000000000") {
      await CNTP_Referrals.addReferrer(referrer);
      profile.referrer = referrer;
    }
  } catch (ex: any) {
    cmd.err = "FAILURE";
    return returnUUIDChannel(cmd);
  }

  storeSystemData();

  cmd.data[0] = profile;
  returnUUIDChannel(cmd);

  return referrer;
};

const clearStorage = async (cmd: worker_command) => {
  const database = new PouchDB(databaseName, { auto_compaction: true });
  await database.destroy((err, response) => {
    if (err) {
      return console.log(err);
    } else {
      console.log("Database Deleted");
      CoNET_Data = null;
      createOrGetWallet();
    }
  });
  returnUUIDChannel(cmd);
};

const fetchTicketResult = async (_profile: profile) => {
  //		api server health check
  const health = await getCONET_api_health();
  if (!health) {
    return null;
  }

  //		make post obj
  const message = JSON.stringify({ walletAddress: _profile.keyID });

  //		use private key to sign post obj
  const messageHash = ethers.id(message);
  const signMessage = CoNETModule.EthCrypto.sign(
    _profile.privateKeyArmor,
    messageHash
  );

  const sendData = {
    message,
    signMessage,
  };

  //		lottery url
  const url = `${apiv3_endpoint}ticket`;

  try {
    const result = await postToEndpoint(url, true, sendData);
    return result;
  } catch (ex) {
    logger(`fetchTicketResult postToEndpoint [${url}] error! `, ex);
    return null;
  }
};

const getTicketResult = async (cmd: worker_command) => {
  if (!CoNET_Data) {
    cmd.err = "FAILURE";
    cmd.data[0] = "CoNET_Data not found";
    return returnUUIDChannel(cmd);
  }

  const profileKeyID = cmd.data[0];

  if (!profileKeyID) {
    cmd.err = "FAILURE";
    cmd.data[0] = "ProfileKeyID parameter not received from frontend";
    return returnUUIDChannel(cmd);
  }

  let _profile = CoNET_Data?.profiles?.find(
    (p) => p.keyID.toLowerCase() === profileKeyID.toLowerCase()
  );

  if (!_profile) {
    cmd.err = "FAILURE";
    cmd.data[0] = "Profile not found in CoNET_Data";
    return returnUUIDChannel(cmd);
  }

  const result = await fetchTicketResult(_profile);

  if (!result) {
    cmd.err = "FAILURE";
    return returnUUIDChannel(cmd);
  }

  // log lottery result
  logger(`testTicket got response ${result}`);

  cmd.data[0] = result;
  returnUUIDChannel(cmd);

  return result;
};

/**
 * Function used only for testing. It's started by the initEncryptWorker in encrypt.ts.
 * DO NOT USE IN PRODUCTION.
 */
const testFunction = async () => {
  //   -------- startMining --------
  // const cmd3: worker_command = {
  //   cmd: "startMining",
  //   data: [profileKeyID],
  //   uuid: "6ddc2676-7982-4b96-8533-52bcb59c2ed6",
  // };
  // await startMining(cmd3);
  // -------- getFirstRouletteResult --------
  // const cmd4: worker_command = {
  //   cmd: "getRouletteResult",
  //   data: ["0xFaA48180274083D394ce4be2174CC41d72cD1164"],
  //   uuid: "6ddc2676-7982-4b96-8533-52bcb59c2ed6",
  // };
  // await getRouletteResult(cmd4);
  // -------- importWallet --------
  // const cmd5: worker_command = {
  //   cmd: "importWallet",
  //   data: [
  //     "0x822cc521850cb0a3fa0cb38961c3c4eec142aecc5b40b255a4021e8dbeea754a",
  //   ],
  //   uuid: "6ddc2676-7982-4b96-8533-52bcb59c2ed6",
  // };
  // await importWallet(cmd5);
};
