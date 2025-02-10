const databaseName = "conet";

//	******************************************************************
const cCNTP_new_Addr =
  "0xa4b389994A591735332A67f3561D60ce96409347".toLocaleLowerCase();
const cCNTP_cancun_Addr =
  "0x6C7C575010F86A311673432319299F3D68e4b522".toLocaleLowerCase();
const faucet_addr =
  "0x04CD419cb93FD4f70059cAeEe34f175459Ae1b6a".toLocaleLowerCase();
const ticket_addr =
  "0x92a033A02fA92169046B91232195D0E82b8017AB".toLocaleLowerCase();
const profile_ver_addr =
  "0x20f8B4De2922d2e9d83B73f4561221d9278Af181".toLowerCase();
const CONET_Guardian_PlanV7 =
  "0x35c6f84C5337e110C9190A5efbaC8B850E960384".toLowerCase();
const CONET_Guardian_Nodes_V6_cancou =
  "0x312c96DbcCF9aa277999b3a11b7ea6956DdF5c61".toLowerCase();
const CONET_Guardian_NodeInfoV6 = "0x9e213e8B155eF24B466eFC09Bcde706ED23C537a";
const CONET_Guardian_NodeInfoV6_cancou =
  "0x88cBCc093344F2e1A6c2790A537574949D711E9d";
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
const ReferralsAddress_cancun =
  "0xbd67716ab31fc9691482a839117004497761D0b9".toLowerCase();
const socialMediaAddress =
  "0x9f2d92da19beA5B2aBc51e69841a2dD7077EAD8f".toLowerCase();
const profileContractAddress =
  "0x9f2d92da19beA5B2aBc51e69841a2dD7077EAD8f".toLowerCase();
const dailyCheckInContractAddress =
  "0xDCe3FAE41Eb95eA3Be59Ca334f340bdd1799aA29".toLowerCase();
const assetOracle_contract_addr =
  "0x0Ac28e301FeE0f60439675594141BEB53853f7b9".toLowerCase();
//	******************************************************************

let miningConn;
let cCNTPcurrentTotal = 0;
let miningProfile: profile | null = null;
let miningStatus: "STOP" | "RESTART" | "MINING" = "STOP";
const api_endpoint = `https://api.conet.network/api/`;
const apiv2_endpoint = `https://apiv2.conet.network/api/`;
const apiv3_endpoint = `https://apiv3.conet.network/api/`;
const apiv4_endpoint = `https://apiv4.conet.network/api/`;
const ipfsEndpoint = `https://ipfs.conet.network/api/`;
const conet_rpc = "https://rpc.conet.network";
const conet_cancun_rpc = "https://cancun-rpc.conet.network";
let authorization_key = "";
const provideCONET = new ethers.JsonRpcProvider(conet_cancun_rpc);
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
let assetOracle: assetOracle | null = null;

let provideBlastMainChain = null;
let provideETH: any = null;
let provideBNB = null;

const nfts = {
  ticket: {
    id: 1,
    name: "ticket",
    contractAddress: ticket_addr,
    contractAbi: ticketAbi,
  },
  conetian: {
    id: 0,
    name: "conetian",
    contractAddress: CONETianPlanAddr_cancun,
    contractAbi: conetianPlanAbi,
    maximumSupply: 30000,
  },
  conetianReferrer: {
    id: 10,
    name: "conetianReferrer",
    contractAddress: CONETianPlanAddr_cancun,
    contractAbi: conetianPlanAbi,
  },
};

const initV2 = async (profile) => {
  const url = `${apiv3_endpoint}initV3`;
  const result = await postToEndpoint(url, true, {
    walletAddress: profile.keyID,
  });
  logger(result);
};

const getTodayDayOfWeek = async () => {
  const result = new Date().getUTCDay();

  // contract returns number counting 0 as Sunday
  // subtract 1 to get Monday as the first day of the week
  return result === 0 ? 6 : result - 1;
};

const getTodayAsset = async () => {
  if (!CoNET_Data?.profiles) {
    return null;
  }

  const provideNewCONET = new ethers.JsonRpcProvider(conet_cancun_rpc);
  const CNTP_Referrals = new ethers.Contract(
    dailyCheckInContractAddress,
    dailyCheckInAbi,
    provideNewCONET
  );

  const result = await CNTP_Referrals.getTodaysAsset();

  return result;
};

const getAllProfilesCurrentWeek = async () => {
  if (!CoNET_Data?.profiles) {
    return null;
  }

  // TODO: modify to do it for all profiles in Conet_Data
  const result = await getProfileCurrentWeek(CoNET_Data.profiles[0].keyID);

  // contract returns values counting 0 as Sunday and the first element of the array
  // move Sunday to the end of the array
  const removedItem = result.shift();
  result.push(removedItem);

  CoNET_Data.profiles[0].dailyClaimWeek = result;

  return CoNET_Data.profiles;
};

const getProfileCurrentWeek = async (keyID) => {
  if (!CoNET_Data?.profiles) {
    return null;
  }

  const provideNewCONET = new ethers.JsonRpcProvider(conet_cancun_rpc);
  const dailyCheckInContract = new ethers.Contract(
    dailyCheckInContractAddress,
    dailyCheckInAbi,
    provideNewCONET
  );

  const result = await dailyCheckInContract.getUserCurrentWeek(keyID);

  return result.toArray();
};

const claimDailyReward = async (cmd: worker_command) => {
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

  const message = JSON.stringify({
    walletAddress: _profile.keyID.toLowerCase(),
  });

  const messageHash = ethers.id(message);
  const signMessage = CoNETModule.EthCrypto.sign(
    _profile.privateKeyArmor,
    messageHash
  );

  const sendData = {
    message,
    signMessage,
  };

  const url = apiv3_endpoint + "dailyClick";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sendData),
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status} - ${response.statusText}`);
    }

    const dailyRewardResult = await response.json();

    cmd.data[0] = dailyRewardResult;

    return returnUUIDChannel(cmd);
  } catch (error) {
    console.error("Request error:", error);
    cmd.err = "FAILURE";

    return returnUUIDChannel(cmd);
  }
};

const getAllReferrer = async () => {
  if (!CoNET_Data?.profiles) {
    return null;
  }

  const provideNewCONET = new ethers.JsonRpcProvider(conet_cancun_rpc);
  const CNTP_Referrals = new ethers.Contract(
    ReferralsAddress_cancun,
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

      const runningList: any[] = [];

      for (let profile of profiles) {
        runningList.push(getProfileAssets_CONET_Balance(profile));
      }

      // runningList.push(getAllProfileTicketsBalance());
      runningList.push(getAllReferrer());
      // runningList.push(getAllGameProfileInfo());
      // runningList.push(getAllProfilesCurrentWeek());
      runningList.push(getassetOracle());

      await Promise.all(runningList);

      // const dailyClaimInfo = await getDailyClaimInfo();

      // leaderboards = await getLeaderboards();

      const isTicketUnlocked = await isApprovedForAll(
        profiles[0].privateKeyArmor
      );

      profiles[0].isTicketUnlocked = isTicketUnlocked;

      const cmd: channelWroker = {
        cmd: "profileVer",
        data: [profiles[0], null, null, assetOracle],
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

const getDailyClaimInfo = async () => {
  const dailyClaimInfo: { todayAsset: any; todayDayOfWeek: number | null } = {
    todayAsset: {},
    todayDayOfWeek: null,
  };

  try {
    let assetName = "";

    const todayAsset = await getTodayAsset();

    if (todayAsset[0].toLowerCase() === cCNTP_cancun_Addr.toLowerCase())
      assetName = "cntp";
    else if (todayAsset[0].toLowerCase() === ticket_addr.toLowerCase())
      assetName = "ticket";

    const formattedTodayAssetQuantity = parseInt(todayAsset[1]);
    const formattedNftNumber = parseInt(todayAsset[2]);

    dailyClaimInfo.todayAsset = {
      asset: assetName,
      quantity: formattedTodayAssetQuantity,
      nft_number: formattedNftNumber,
    };

    const todayDayOfWeek = await getTodayDayOfWeek();

    if (todayDayOfWeek?.toString())
      dailyClaimInfo.todayDayOfWeek = todayDayOfWeek;
  } catch (ex) {
    console.log(ex);
  }

  return dailyClaimInfo;
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
  const provide = new ethers.JsonRpcProvider(conet_cancun_rpc);
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

const getFaucet: (profile: profile) => Promise<boolean | any> = async (
  profile
) =>
  new Promise(async (resolve) => {
    const conet = profile?.tokens?.conet;

    const health = await getCONET_api_health();
    if (!health) {
      return resolve(false);
    }

    const url = `${apiv4_endpoint}conet-faucet`;
    let result;
    try {
      result = await postToEndpoint(url, true, { walletAddr: profile.keyID });
    } catch (ex) {
      logger(`getFaucet postToEndpoint [${url}] error! `, ex);
      return resolve(false);
    }
    setTimeout(() => {
      return resolve(true);
    }, 1000);
  });

const checkTokenStructure = (token: any) => {
  if (!token?.cCNTP) {
    token.cCNTP = {
      balance: "0",
      history: [],
      network: "CONET Holesky",
      decimal: 18,
      contract: cCNTP_cancun_Addr,
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

    const provideCONET = new ethers.JsonRpcProvider(conet_cancun_rpc);

    if (!provideBNB) {
      provideBNB = new ethers.JsonRpcProvider(bsc_mainchain);
    }

    const [
      balanceCCNTP,
      conet_Holesky,
      balanceBnb,
      balanceWUSDT,
      _CONETianPlan,
    ] = await Promise.all([
      scanCCNTP(key, provideCONET),
      scanCONETHolesky(key, provideCONET),
      scanBNB(key),
      scanWUSDT(key),
      scan_CONETianPlanAddr(key),
    ]);

    current.cCNTP.balance = balanceCCNTP;
    parseFloat(ethers.formatEther(balanceCCNTP)).toFixed(6);

    current.conet.balance =
      conet_Holesky === BigInt(0)
        ? "0"
        : typeof conet_Holesky !== "boolean"
        ? parseFloat(ethers.formatEther(conet_Holesky)).toFixed(6)
        : "";

    if (current.wusdt) {
      current.wusdt.balance =
        balanceWUSDT === "" ? "" : ethers.formatEther(balanceWUSDT);
    } else {
      current.wusdt = {
        balance: balanceWUSDT === "" ? "" : ethers.formatEther(balanceWUSDT),
        history: [],
        network: "BSC",
        decimal: 18,
        contract: bnb_usdt_contract,
        name: "wusdt",
      };
    }

    if (current.bnb) {
      current.bnb.balance =
        balanceBnb === false ? "" : ethers.formatEther(balanceBnb);
    } else {
      current.bnb = {
        balance: balanceBnb === false ? "" : ethers.formatEther(balanceBnb),
        history: [],
        network: "BSC",
        decimal: 18,
        contract: "",
        name: "bnb",
      };
    }

    const CONETianData:
      | {
          balanceGuardian: BigInt;
          balanceReferrer: BigInt;
          availableBalance: BigInt;
        }
      | false = _CONETianPlan;

    if (CONETianData !== false) {
      if (current.ConetianNFT) {
        current.ConetianNFT.balance = CONETianData.balanceGuardian.toString();
        current.ConetianNFT.totalSupply = parseInt(
          CONETianData.availableBalance.toString()
        ).toFixed(0);
      } else {
        current.ConetianNFT = {
          isNft: true,
          balance: CONETianData.balanceGuardian.toString(),
          history: [],
          network: "CONET Holesky",
          decimal: nfts.conetian.id,
          contract: nfts.conetian.contractAddress,
          name: "ConetianNFT",
          supplyMaximum: nfts.conetian.maximumSupply.toString(),
          totalSupply: parseInt(
            CONETianData.availableBalance.toString()
          ).toFixed(0),
        };
      }

      if (current.ConetianAgentNFT) {
        current.ConetianAgentNFT.balance =
          CONETianData.balanceReferrer.toString();
      } else {
        current.ConetianAgentNFT = {
          isNft: true,
          balance: CONETianData.balanceReferrer.toString(),
          history: [],
          network: "CONET Holesky",
          decimal: nfts.conetianReferrer.id,
          contract: nfts.conetianReferrer.contractAddress,
          name: "ConetianAgentNFT",
        };
      }
    }
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

const scanCONETHolesky = async (walletAddr: string, providerCONET: any) => {
  return await scan_natureBalance(providerCONET, walletAddr);
};

const scanCCNTP = async (walletAddr: string, provider: any) => {
  return await scan_erc20_balance(walletAddr, provider, cCNTP_cancun_Addr);
};

const scanBNB = async (walletAddr) => {
  return await scan_natureBalance(provideBNB, walletAddr);
};

const scanWUSDT = async (walletAddr: string) => {
  return await scan_erc20_balance(walletAddr, provideBNB, bnb_usdt_contract);
};

const scan_CONETianPlanAddr: any = async (walletAddr) =>
  new Promise(async (resolve) => {
    const CONETianPlanContract = new ethers.Contract(
      nfts.conetian.contractAddress,
      nfts.conetian.contractAbi,
      provideCONET
    );
    try {
      const [balanceGuardian, balanceReferrer, availableBalance] =
        await Promise.all([
          CONETianPlanContract.balanceOf(walletAddr, nfts.conetian.id),
          CONETianPlanContract.balanceOf(walletAddr, nfts.conetianReferrer.id),
          CONETianPlanContract.getAvailableBalance(),
        ]);

      return resolve({ balanceGuardian, balanceReferrer, availableBalance });
    } catch (ex) {
      resolve(false);
    }
  });

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

    const profilesClearText = JSON.stringify(CoNET_Data.profiles[0]);
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

const getWallet = async () => {
  if (!CoNET_Data?.profiles) {
    const cmd: channelWroker = {
      cmd: "profileVer",
      data: [],
    };

    sendState("toFrontEnd", cmd);

    return;
  }

  CoNET_Data.profiles.forEach(async (n) => {
    n.keyID = n.keyID.toLocaleLowerCase();
    await initV2(n);
    n.tokens.cCNTP.unlocked = false;
  });

  CoNET_Data.profiles.forEach(async (n) => {
    if (!n.tokens.wusdt) {
      n.tokens.wusdt = {
        balance: "0",
        history: [],
        network: "BSC",
        decimal: 18,
        contract: bnb_usdt_contract,
        name: "wusdt",
      };
    }

    if (!n.tokens.bnb) {
      n.tokens.bnb = {
        balance: "0",
        history: [],
        network: "BSC",
        decimal: 18,
        contract: "",
        name: "bnb",
      };
    }
  });

  await getFaucet(CoNET_Data.profiles[0]);

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

const createWallet = async (cmd: worker_command) => {
  const acc = createKeyHDWallets();

  const key = await createGPGKey("", "", "");

  let profile: profile = {
    tokens: initProfileTokens(),
    publicKeyArmor: acc.publicKey,
    keyID: acc.address,
    isPrimary: true,
    referrer: null,
    isNode: false,
    pgpKey: {
      privateKeyArmor: key.privateKey,
      publicKeyArmor: key.publicKey,
    },
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

  CoNET_Data.profiles.forEach(async (n) => {
    n.keyID = n.keyID.toLocaleLowerCase();
    await initV2(n);
    n.tokens.cCNTP.unlocked = false;
  });

  CoNET_Data.profiles.forEach(async (n) => {
    if (!n.tokens.wusdt) {
      n.tokens.wusdt = {
        balance: "0",
        history: [],
        network: "BSC",
        decimal: 18,
        contract: bnb_usdt_contract,
        name: "wusdt",
      };
    }

    if (!n.tokens.bnb) {
      n.tokens.bnb = {
        balance: "0",
        history: [],
        network: "BSC",
        decimal: 18,
        contract: "",
        name: "bnb",
      };
    }
  });

  await getFaucet(
    CoNET_Data.profiles[0].keyID,
    CoNET_Data.profiles[0].privateKeyArmor
  );

  await getAllReferrer();

  await storeSystemData();

  profile = CoNET_Data.profiles[0];

  cmd.data[0] = profile;
  returnUUIDChannel(cmd);
};

const importWallet = async (cmd: worker_command) => {
  const privateKey = cmd.data[0];

  cmd.data = [];

  if (!CoNET_Data) {
    CoNET_Data = {
      mnemonicPhrase: "",
      profiles: [],
      isReady: true,
      ver: 0,
      nonce: 0,
    };
  }

  if (!CoNET_Data?.profiles) {
    CoNET_Data.profiles = [];
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

  await getFaucet(CoNET_Data.profiles[0]);

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
      contract: cCNTP_cancun_Addr,
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
    wusdt: {
      balance: "0",
      history: [],
      network: "BSC",
      decimal: 18,
      contract: bnb_usdt_contract,
      name: "wusdt",
    },
    bnb: {
      balance: "0",
      history: [],
      network: "BSC",
      decimal: 18,
      contract: "",
      name: "bnb",
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

const checkSocialMedias = async (cmd: worker_command) => {
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
  const providerConet = new ethers.JsonRpcProvider(conet_cancun_rpc);
  const signer = new ethers.Wallet(_profile.privateKeyArmor, providerConet);
  const tokenContract = new ethers.Contract(
    socialMediaAddress,
    socialMediaAbi,
    signer
  );

  try {
    const socialMedias = await tokenContract.getSocialUser(_profile.keyID);
    cmd.data[0] = socialMedias;
  } catch (ex) {
    cmd.err = "FAILURE";
    cmd.data[0] = "Error calling the contract method getSocialUser";
  }

  return returnUUIDChannel(cmd);
};

const checkPartner = async (cmd: worker_command) => {
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

  //		api server health check
  const health = await getCONET_api_health();
  if (!health) {
    return null;
  }

  //		make post obj
  const message = JSON.stringify({
    walletAddress: _profile.keyID,
    data: [cmd.data[1]],
  });

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

  const url = `${apiv3_endpoint}socialTask`;

  let result: any = null;

  try {
    result = await postToEndpoint(url, true, sendData);
  } catch (ex) {
    logger(`checkPartner postToEndpoint [${url}] error! `, ex);
  }

  if (!result) {
    cmd.err = "FAILURE";
    return returnUUIDChannel(cmd);
  }

  logger(`dailyTask got response ${result}`);

  cmd.data[0] = result;
  returnUUIDChannel(cmd);

  return result;
};

const checkTwitter = async (cmd: worker_command) => {
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

  const twitterUserName = cmd.data[1];
  const message = JSON.stringify({
    walletAddress: _profile.keyID.toLowerCase(),
    data: [twitterUserName],
  });

  const messageHash = ethers.id(message);
  const signMessage = CoNETModule.EthCrypto.sign(
    _profile.privateKeyArmor,
    messageHash
  );

  const sendData = {
    message,
    signMessage,
  };

  const url = "https://apiv3.conet.network/api/twitter-check-follow";

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sendData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Erro: ${response.status} - ${response.statusText}`);
      }
      return response.json();
    })
    .then((checkedTwitter) => {
      cmd.data[0] = checkedTwitter;
      return returnUUIDChannel(cmd);
    })
    .catch((err) => {
      console.error("Request error:", err);
      cmd.err = "FAILURE";
      return returnUUIDChannel(cmd);
    });
};

const checkTelegram = async (cmd: worker_command) => {
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
  const telegramID = cmd.data[1];
  const message = JSON.stringify({
    walletAddress: _profile.keyID.toLowerCase(),
    data: [telegramID],
  });

  const messageHash = ethers.id(message);
  const signMessage = CoNETModule.EthCrypto.sign(
    _profile.privateKeyArmor,
    messageHash
  );

  const sendData = {
    message,
    signMessage,
  };
  const url = "https://apiv3.conet.network/api/tg-check-follow";

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sendData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Erro: ${response.status} - ${response.statusText}`);
      }
      return response.json();
    })
    .then((checkedTelegram) => {
      cmd.data[0] = checkedTelegram;
      return returnUUIDChannel(cmd);
    })
    .catch((err) => {
      console.error("Request error:", err);
      cmd.err = "FAILURE";
      return returnUUIDChannel(cmd);
    });
};

const stopMiningV1 = async (cmd: worker_command) => {
  miningConn.abort();
  miningStatus = "STOP";
  return returnUUIDChannel(cmd);
};

const _startMiningV1 = async (
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
          return _startMiningV1(profile);
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
          cCNTP_cancun_Addr
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
const startMiningV1 = async (cmd: worker_command) => {
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
    cCNTP_cancun_Addr
  );
  CoNET_Data.profiles[0].tokens.cCNTP.balance = newBalance;
  _profile = CoNET_Data.profiles[0];
  storeSystemData();

  miningStatus = "MINING";
  return await _startMiningV1(_profile, cmd);
};

/**
 * Start mining. Keeps sending mining status to the frontend.
 * @param cmd - data[0] is a conet profile
 * @returns
 */
const startMiningV2 = async (cmd: worker_command) => {
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
    cCNTP_cancun_Addr
  );
  CoNET_Data.profiles[0].tokens.cCNTP.balance = newBalance;
  _profile = CoNET_Data.profiles[0];
  storeSystemData();

  miningStatus = "MINING";
  return await _startMiningV2(_profile, cmd);
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

  await getFaucet(_profile);

  let rouletteResult = null;

  if (_profile?.isTicketUnlocked) {
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

const unlockTicket = async (cmd: worker_command) => {
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

  const isUnlockProcessStarted = await _unlockTicket(_profile);

  logger(`unlockticket got response ${isUnlockProcessStarted}`);

  cmd.data[0] = isUnlockProcessStarted;
  returnUUIDChannel(cmd);

  return isUnlockProcessStarted;
};

const _unlockTicket = async (_profile: profile) => {
  try {
    const isUnlockProcessStarted = await setApprovalForAll(
      _profile.privateKeyArmor
    );

    if (!isUnlockProcessStarted) {
      setTimeout(() => {
        return _unlockTicket(_profile);
      }, 5000);
    }

    return true;
  } catch (ex) {
    setTimeout(() => {
      return _unlockTicket(_profile);
    }, 5000);
  }
};

const setApprovalForAll = async (privateKey: string) => {
  const CONET_manager_Wallet = "0x068759bCfd929fb17258aF372c30eE6CD277B872";
  const rpcProvider = new ethers.JsonRpcProvider(conet_cancun_rpc);
  const wallet = new ethers.Wallet(privateKey, rpcProvider);
  const ticketContract = new ethers.Contract(ticket_addr, ticketAbi, wallet);

  try {
    const tx = await ticketContract.setApprovalForAll(
      CONET_manager_Wallet,
      true
    );

    if (!tx) {
      console.debug(`Error in setting NFT approval`);
      return null;
    }

    return tx;
  } catch (ex) {
    console.debug(`Error in setting NFT approval`);
    return null;
  }
};

const isApprovedForAll = async (privateKey: string) => {
  const CONET_manager_Wallet = "0x068759bcfd929fb17258af372c30ee6cd277b872";
  const rpcProvider = new ethers.JsonRpcProvider(conet_cancun_rpc);
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

  const provideNewCONET = new ethers.JsonRpcProvider(conet_cancun_rpc);
  const wallet = new ethers.Wallet(profile.privateKeyArmor, provideNewCONET);
  const CNTP_Referrals = new ethers.Contract(
    ReferralsAddress_cancun,
    CONET_ReferralsAbi,
    wallet
  );

  try {
    const ref = await CNTP_Referrals.getReferrer(profile.keyID);
    if (ref === "0x0000000000000000000000000000000000000000") {
      const result = await _registerReferrer(CNTP_Referrals, profile, referrer);

      if (result) profile.referrer = referrer;
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

const _registerReferrer = async (CNTP_Referrals, profile, referrer) => {
  try {
    await CNTP_Referrals.addReferrer(referrer);

    return true;
  } catch (ex: any) {
    setTimeout(() => {
      return _registerReferrer(CNTP_Referrals, profile, referrer);
    }, 5000);
  }
};

const clearStorage = async (cmd: worker_command) => {
  const database = new PouchDB(databaseName, { auto_compaction: true });
  await database.destroy((err, response) => {
    if (err) {
      return console.log(err);
    } else {
      console.log("Database Deleted");
      CoNET_Data = null;
      getWallet();
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

const saveGameProfileInfo = async (cmd: worker_command) => {
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

  const gameProfileData = cmd.data[1];

  if (!gameProfileData) {
    cmd.err = "FAILURE";
    cmd.data[0] = "gameProfileData parameter not received from frontend";
    return returnUUIDChannel(cmd);
  }

  const provideNewCONET = new ethers.JsonRpcProvider(conet_cancun_rpc);
  const wallet = new ethers.Wallet(_profile.privateKeyArmor, provideNewCONET);
  const profileContract = new ethers.Contract(
    profileContractAddress,
    profileContractAbi,
    wallet
  );

  try {
    await profileContract.addProfile(
      gameProfileData?.nickname || "",
      gameProfileData?.bio || "",
      gameProfileData?.imageUrl || "",
      gameProfileData?.gateway || ""
    );
  } catch (ex: any) {
    cmd.err = "FAILURE";
    return returnUUIDChannel(cmd);
  }

  cmd.data[0] = true;
  returnUUIDChannel(cmd);

  return true;
};

const getGameProfileInfo = async (
  profileKeyID: string,
  addressToSearch: string
) => {
  if (!CoNET_Data) {
    return null;
  }

  if (!profileKeyID) {
    return null;
  }

  let _profile = CoNET_Data?.profiles?.find(
    (p) => p.keyID.toLowerCase() === profileKeyID.toLowerCase()
  );

  if (!_profile) {
    return null;
  }

  const provideNewCONET = new ethers.JsonRpcProvider(conet_cancun_rpc);
  const wallet = new ethers.Wallet(_profile.privateKeyArmor, provideNewCONET);
  const profileContract = new ethers.Contract(
    profileContractAddress,
    profileContractAbi,
    wallet
  );

  let gameProfile = null;
  try {
    gameProfile = await profileContract.getProfile(addressToSearch);
  } catch (ex: any) {
    return null;
  }

  if (!gameProfile) return null;

  return {
    username: gameProfile[0],
    bio: gameProfile[1],
    imageUrl: gameProfile[2],
    gateway: gameProfile[3],
  };
};

const getAllGameProfileInfo = async () => {
  if (!CoNET_Data) {
    logger(`getAllProfileGameData Error! CoNET_Data empty Error!`);
    return null;
  }

  const profiles = CoNET_Data.profiles;

  profiles.forEach(async (profile) => {
    profile.game = await getGameProfileInfo(profile.keyID, profile.keyID);
  });

  return profiles;
};

const transferToken = async (cmd: worker_command) => {
  const [amount, sourceProfileKeyID, assetName, toAddress] = cmd.data;
  if (!assetName || !toAddress || !amount || !sourceProfileKeyID) {
    cmd.err = "INVALID_DATA";
    return returnUUIDChannel(cmd);
  }
  if (!getAddress(toAddress) && !getAddress(sourceProfileKeyID)) {
    cmd.err = "INVALID_DATA";
    return returnUUIDChannel(cmd);
  }
  const profiles = CoNET_Data?.profiles;
  if (!profiles) {
    cmd.err = "NOT_READY";
    return returnUUIDChannel(cmd);
  }
  const profileIndex = profiles.findIndex(
    (n) => n.keyID.toLowerCase() === sourceProfileKeyID.toLowerCase()
  );
  if (profileIndex < 0) {
    cmd.err = "INVALID_DATA";
    return returnUUIDChannel(cmd);
  }

  const sourceProfile = profiles[profileIndex];
  sendState("beforeunload", true);
  const kk = await CONET_transfer_token(
    sourceProfile,
    toAddress,
    amount,
    assetName
  );
  sendState("beforeunload", false);

  if (!!kk !== true) {
    cmd.err = "INVALID_DATA";
    return returnUUIDChannel(cmd);
  }

  if (sourceProfile.keyID.toLowerCase() == miningAddress) {
    cCNTPcurrentTotal -= amount;
  }

  const cmd1 = {
    cmd: "tokenTransferStatus",
    data: [4, kk],
  };
  sendState("toFrontEnd", cmd1);
  return returnUUIDChannel(cmd);
};

const estimateGas = async (cmd: worker_command) => {
  const [amount, sourceProfileKeyID, assetName, toAddress] = cmd.data;

  if (!assetName || !toAddress || !amount || !sourceProfileKeyID) {
    cmd.err = "INVALID_DATA";
    return returnUUIDChannel(cmd);
  }

  const profiles = CoNET_Data?.profiles;

  if (!profiles) {
    cmd.err = "FAILURE";
    return returnUUIDChannel(cmd);
  }

  const profile = getProfileFromKeyID(sourceProfileKeyID);

  if (!profile || !profile?.tokens) {
    cmd.err = "INVALID_DATA";
    return returnUUIDChannel(cmd);
  }

  const asset = profile.tokens[assetName];

  if (!profile.privateKeyArmor || !asset) {
    cmd.err = "INVALID_DATA";
    return returnUUIDChannel(cmd);
  }

  const data: any = await getEstimateGasForTokenTransfer(
    profile.privateKeyArmor,
    assetName,
    amount,
    toAddress
  );

  cmd.data = [data.gasPrice, data.fee, true, 5000];
  return returnUUIDChannel(cmd);
};

const estimateGasForNftContract = async (cmd: worker_command) => {
  const [amount, sourceProfileKeyID, assetName, toAddress] = cmd.data;

  if (!assetName || !toAddress || !amount || !sourceProfileKeyID) {
    cmd.err = "INVALID_DATA";
    return returnUUIDChannel(cmd);
  }

  const profiles = CoNET_Data?.profiles;

  if (!profiles) {
    cmd.err = "FAILURE";
    return returnUUIDChannel(cmd);
  }

  const profile = getProfileFromKeyID(sourceProfileKeyID);

  if (!profile || !profile?.tokens) {
    cmd.err = "INVALID_DATA";
    return returnUUIDChannel(cmd);
  }

  const asset = profile.tickets;

  if (!profile.privateKeyArmor || !asset) {
    cmd.err = "INVALID_DATA";
    return returnUUIDChannel(cmd);
  }

  const data: any = await getEstimateGasForNftTransfer(
    profile.privateKeyArmor,
    nfts?.[assetName.toLowerCase()],
    amount,
    toAddress
  );

  cmd.data = [data.gasPrice, data.fee, true, 5000];
  return returnUUIDChannel(cmd);
};

const getNativeBalance = async (cmd: worker_command) => {
  const [sourceProfileKeyID] = cmd.data;

  if (!sourceProfileKeyID) {
    cmd.err = "INVALID_DATA";
    return returnUUIDChannel(cmd);
  }

  const provideCONET = new ethers.JsonRpcProvider(conet_cancun_rpc);

  cmd.data[0] = await scanCONETHolesky(sourceProfileKeyID, provideCONET);

  return returnUUIDChannel(cmd);
};

const getAddress = (addr) => {
  let ret = "";
  try {
    ret = ethers.getAddress(addr);
  } catch (ex) {
    return ret;
  }
  return ret;
};

const isAddress = (cmd: worker_command) => {
  console.log("isAddress backend called");
  const address = cmd.data[0];
  const ret = getAddress(address);
  cmd.data = [ret === "" ? false : true];
  return returnUUIDChannel(cmd);
};

const getNftBalance = async (profile, assetName) => {
  let cryptoAsset: any = null;
  switch (assetName.toLowerCase()) {
    case "ticket":
      cryptoAsset = profile?.tickets;
      if (!cryptoAsset) {
        return null;
      }
      return parseFloat(cryptoAsset?.balance);
    case "conetian":
      cryptoAsset = profile?.tokens?.ConetianNFT;
      if (!cryptoAsset) {
        return null;
      }
      return parseFloat(cryptoAsset?.balance);
    case "conetianreferrer":
      cryptoAsset = profile?.tokens?.ConetianAgentNFT;
      if (!cryptoAsset) {
        return null;
      }
      return parseFloat(cryptoAsset?.balance);
    default:
      return null;
  }
};

const transferNft = async (cmd) => {
  const [amount, sourceProfileKeyID, assetName, toAddress] = cmd.data;

  if (!assetName || !toAddress || !amount || !sourceProfileKeyID) {
    cmd.err = "INVALID_DATA";
    return returnUUIDChannel(cmd);
  }

  if (!Object.keys(nfts).includes(assetName.toLowerCase())) {
    cmd.err = "INVALID_DATA";
    return returnUUIDChannel(cmd);
  }

  if (!getAddress(toAddress) && !getAddress(sourceProfileKeyID)) {
    cmd.err = "INVALID_DATA";
    return returnUUIDChannel(cmd);
  }

  const profiles = CoNET_Data?.profiles;
  if (!profiles) {
    cmd.err = "NOT_READY";
    return returnUUIDChannel(cmd);
  }

  const profileIndex = profiles.findIndex(
    (n) => n.keyID.toLowerCase() === sourceProfileKeyID.toLowerCase()
  );

  if (profileIndex < 0) {
    cmd.err = "INVALID_DATA";
    return returnUUIDChannel(cmd);
  }

  const sourceProfile = profiles[profileIndex];
  sendState("beforeunload", true);

  const nftBalance = await getNftBalance(sourceProfile, assetName);

  if (
    !nftBalance ||
    !CoNET_Data?.profiles ||
    nftBalance - amount < 0 ||
    !sourceProfile.privateKeyArmor
  ) {
    const cmd1 = {
      cmd: "nftTransferStatus",
      data: [-1],
    };
    sendState("toFrontEnd", cmd1);
    return false;
  }

  const cmd1 = {
    cmd: "nftTransferStatus",
    data: [1],
  };
  sendState("toFrontEnd", cmd1);

  const wallet = new ethers.Wallet(sourceProfile.privateKeyArmor, provideCONET);
  const contract = new ethers.Contract(
    nfts?.[assetName.toLowerCase()].contractAddress,
    nfts?.[assetName.toLowerCase()].contractAbi,
    wallet
  );

  try {
    const pendingTx = await contract.safeTransferFrom(
      wallet.address,
      toAddress,
      nfts?.[assetName.toLowerCase()].id,
      amount,
      "0x00"
    );

    const completedTx = await pendingTx.wait();

    sendState("beforeunload", false);

    const cmd2 = {
      cmd: "nftTransferStatus",
      data: [2],
    };
    sendState("toFrontEnd", cmd2);

    const cmd4 = {
      cmd: "nftTransferStatus",
      data: [4, completedTx],
    };
    sendState("toFrontEnd", cmd4);

    return returnUUIDChannel(cmd);
  } catch (ex) {
    const cmd1 = {
      cmd: "nftTransferStatus",
      data: [-1],
    };
    sendState("toFrontEnd", cmd1);

    return logger(ex);
  }
};

const isWalletAgent = async (cmd) => {
  const [walletKeyId] = cmd.data;

  if (!walletKeyId || !ethers.isAddress(walletKeyId)) {
    cmd.err = "INVALID DATA";
    return returnUUIDChannel(cmd);
  }

  const provideNewCONET = new ethers.JsonRpcProvider(conet_cancun_rpc);

  const ConetianContract = new ethers.Contract(
    CONETianPlanAddr_cancun,
    conetianPlanAbi,
    provideNewCONET
  );

  try {
    const isWalletAgent = await ConetianContract.isReferrer(walletKeyId);
    cmd.data = [isWalletAgent];
  } catch (err) {
    logger(`isWalletAgent error`, err);
    cmd.err = "FAILURE";
  }

  return returnUUIDChannel(cmd);
};

const CONET_guardian_purchase_Receiving_Address = (networkName) => {
  switch (networkName) {
    case "eth":
    case "usdc":
    case "dai":
    case "usdt": {
      return `0x4875bbae10b74F9D824d75281B5A4B5802b147f5`;
    }
    case "bnb":
    case "wusdt": {
      return `0xaFFb573f6a5F0C9b491775FD3F932b52ccf4eAfF`;
    }
    case "arb_eth":
    case "arb_usdt": {
      return "0x97E96Cc8Ee4f6373e87C77E98fAF1A6FfA8548f2";
    }
    default: {
      return ``;
    }
  }
};

const prePurchase = async (cmd) => {
  const [walletAddress, total, payAssetName] = cmd.data;
  if (!total || !walletAddress || !payAssetName) {
    cmd.err = "INVALID_DATA";
    return returnUUIDChannel(cmd);
  }
  const profiles = CoNET_Data?.profiles;
  if (!profiles) {
    cmd.err = "FAILURE";
    return returnUUIDChannel(cmd);
  }
  const profileIndex = profiles.findIndex(
    (n) => n.keyID.toLowerCase() === walletAddress.toLowerCase()
  );
  if (profileIndex < 0) {
    cmd.err = "INVALID_DATA";
    return returnUUIDChannel(cmd);
  }

  const profile = profiles[profileIndex];

  if (!profile.tokens) {
    cmd.err = "INVALID_DATA";
    return returnUUIDChannel(cmd);
  }

  const asset = profile.tokens[payAssetName];

  if (!profile.privateKeyArmor || !asset) {
    cmd.err = "INVALID_DATA";
    return returnUUIDChannel(cmd);
  }

  const toAddr = CONET_guardian_purchase_Receiving_Address(asset.name);

  const data: any = await getEstimateGasForTokenTransfer(
    profile.privateKeyArmor,
    asset.name,
    total,
    toAddr
  );
  if (data === false) {
    if (!profile.privateKeyArmor || !asset) {
      cmd.err = "INVALID_DATA";
      return returnUUIDChannel(cmd);
    }
  }

  cmd.data = [data.gasPrice, data.fee, true, 5000];
  return returnUUIDChannel(cmd);
};

const purchaseConetian = async (cmd) => {
  const [walletAddress, amount, payAssetName, total, agentWallet] = cmd.data;

  if (!walletAddress || !amount || !payAssetName || !total) {
    const cmd1 = {
      cmd: "purchaseStatus",
      data: [-1],
    };
    return sendState("toFrontEnd", cmd1);
  }

  const profiles = CoNET_Data?.profiles;
  if (!profiles) {
    const cmd1 = {
      cmd: "purchaseStatus",
      data: [-1],
    };
    return sendState("toFrontEnd", cmd1);
  }

  const profileIndex = profiles.findIndex(
    (n) => n.keyID.toLowerCase() === walletAddress.toLowerCase()
  );
  if (profileIndex < 0) {
    const cmd1 = {
      cmd: "purchaseStatus",
      data: [-1],
    };
    return sendState("toFrontEnd", cmd1);
  }

  const profile = profiles[profileIndex];

  const health = await getCONET_api_health();
  if (!health) {
    const cmd1 = {
      cmd: "purchaseStatus",
      data: [-1],
    };
    return sendState("toFrontEnd", cmd1);
  }

  const cmd2 = {
    cmd: "purchaseStatus",
    data: [1],
  };

  sendState("toFrontEnd", cmd2);

  sendState("beforeunload", true);
  const kk = await CONETianPlan_purchase(
    agentWallet,
    profile,
    amount,
    payAssetName
  );
  sendState("beforeunload", false);

  if (kk !== true) {
    const cmd1 = {
      cmd: "purchaseStatus",
      data: [-1],
    };

    return sendState("toFrontEnd", cmd1);
  }

  const cmd1 = {
    cmd: "purchaseStatus",
    data: [4],
  };

  returnUUIDChannel(cmd);
  return sendState("toFrontEnd", cmd1);
};

const CONETianPlan_purchase = async (
  referrer: string,
  profile: profile,
  amount: number,
  tokenName: string
) =>
  new Promise(async (resolve) => {
    let cryptoAsset: CryptoAsset;

    if (
      !amount ||
      !profile?.tokens ||
      !(cryptoAsset = profile.tokens[tokenName])
    ) {
      return resolve(false);
    }

    const ntfs = amount;
    const totalUSDT = ntfs * getGuardianPrice(0);

    const total = convertUSDTToCurrency(tokenName, totalUSDT);

    if (total < 0.00001) {
      return resolve(false);
    }

    if (
      parseFloat(cryptoAsset.balance) - total < 0 ||
      !profile.privateKeyArmor
    ) {
      const cmd1 = {
        cmd: "purchaseStatus",
        data: [-1],
      };
      sendState("toFrontEnd", cmd1);
      return false;
    }

    const toAddr = CONET_guardian_purchase_Receiving_Address(tokenName);

    let receiptTx: any = await transferAssetToCONET_wallet(
      profile.privateKeyArmor,
      cryptoAsset,
      total.toFixed(8),
      toAddr
    );

    if (typeof receiptTx === "boolean") {
      const cmd1 = {
        cmd: "purchaseStatus",
        data: [-1],
      };
      sendState("toFrontEnd", cmd1);
      return false;
    }

    const cmd2 = {
      cmd: "purchaseStatus",
      data: [2],
    };

    sendState("toFrontEnd", cmd2);

    getProfileAssets_allOthers_Balance(profile);

    const data = {
      receiptTx: receiptTx.hash,
      tokenName,
      amount: parseEther(total.toFixed(8), cryptoAsset.name).toString(),
      ntfs,
      referrer,
    };

    const message = JSON.stringify({ walletAddress: profile.keyID, data });
    const wallet = new ethers.Wallet(profile.privateKeyArmor);
    const signMessage = await wallet.signMessage(message);

    const sendData = {
      message,
      signMessage,
    };

    const cmd3 = {
      cmd: "purchaseStatus",
      data: [3],
    };
    sendState("toFrontEnd", cmd3);

    const url = `${apiv4_endpoint}PurchaseCONETianPlan`;

    try {
      await postToEndpoint(url, true, sendData);
    } catch (ex) {
      return resolve(false);
    }
    return resolve(true);
  });

const getGuardianPrice = (nftNumber: number) => {
  switch (nftNumber) {
    case 0: {
      return 100;
    }
    default: {
      return 0;
    }
  }
};

const convertUSDTToCurrency = (currencyName: string, usdtAmount: number) => {
  if (/usdt/.test(currencyName)) {
    return usdtAmount;
  }
  const rate = /bnb/.test(currencyName)
    ? getOracleAssets("bnb")
    : getOracleAssets("eth");
  if (!rate) {
    return 0;
  }

  return usdtAmount / rate;
};

const getOracleAssets = (tokenName: string) => {
  if (!assetOracle) {
    return 0;
  }
  const index = assetOracle.assets.findIndex((n) => n.name == tokenName);
  if (index < 0) {
    return 0;
  }
  const rate = parseFloat(assetOracle.assets[index].price.toString());
  return rate;
};

const getassetOracle = async () => {
  if (!provideCONET) {
    return logger(`getassetOracle Error! provideCONET = null`);
  }
  if (assetOracle) {
    const now = new Date().getTime();
    if (now - assetOracle.lastUpdate < 1000 * 60 * 10) {
      return;
    }
  }

  const oracle_SC = new ethers.Contract(
    assetOracle_contract_addr,
    assetOracle_ABI,
    provideCONET
  );
  const assets = ["bnb", "eth", "usdt", "usdc", "dai"];
  const process: any[] = [];
  assets.forEach((n) => {
    process.push(oracle_SC.GuardianPrice(n));
  });

  const [bnb, eth, usdt, usdc, dai] = await Promise.all(process);
  assetOracle = {
    lastUpdate: new Date().getTime(),
    assets: [
      {
        name: "bnb",
        price: ethers.formatEther(bnb),
      },
      {
        name: "eth",
        price: ethers.formatEther(eth),
      },
      {
        name: "usdt",
        price: ethers.formatEther(usdt),
      },
      {
        name: "usdc",
        price: ethers.formatEther(usdc),
      },
      {
        name: "dai",
        price: ethers.formatEther(dai),
      },
    ],
  };
};

const getProfileAssets_allOthers_Balance = async (profile: profile) => {
  const key = profile.keyID;

  if (key) {
    if (!provideBlastMainChain) {
      provideBlastMainChain = new ethers.JsonRpcProvider(blast_mainnet());
    }

    if (!provideETH) {
      provideETH = new ethers.JsonRpcProvider(ethRpc());
    }

    if (!provideBNB) {
      provideBNB = new ethers.JsonRpcProvider(bsc_mainchain);
    }

    if (!profile.tokens) {
      profile.tokens = initProfileTokens();
    }

    const current: conet_tokens = profile.tokens;

    const [wusdt, bnb] = await Promise.all([scanWUSDT(key), scanBNB(key)]);

    if (current.wusdt) {
      current.wusdt.balance = wusdt === "" ? "" : ethers.formatEther(wusdt);
    } else {
      current.wusdt = {
        balance: wusdt === "" ? "" : ethers.formatEther(wusdt),
        history: [],
        network: "BSC",
        decimal: 18,
        contract: bnb_usdt_contract,
        name: "wusdt",
      };
    }

    if (current.bnb) {
      current.bnb.balance = bnb === false ? "" : ethers.formatEther(bnb);
    } else {
      current.bnb = {
        balance: bnb === false ? "" : ethers.formatEther(bnb),
        history: [],
        network: "BSC",
        decimal: 18,
        contract: "",
        name: "bnb",
      };
    }
  }
  return true;
};

/**
 * Function used only for testing. It's started by the initEncryptWorker in encrypt.ts.
 * DO NOT USE IN PRODUCTION.
 */
const testFunction = async () => {
  //   -------- transferNft --------
  // const cmd5: worker_command = {
  //   cmd: "transferNft",
  //   data: [1, "ORIGIN_WALLET_ADDRESS", "ticket", "DESTINATION_WALLET_ADDRESS"],
  //   uuid: "6ddc2676-7982-4b96-8533-52bcb59c2ed6",
  // };
  // await transferNft(cmd5);
};
