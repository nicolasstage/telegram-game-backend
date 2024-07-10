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