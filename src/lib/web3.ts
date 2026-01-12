import { ethers } from 'ethers';

// Contract ABI for AcademicCredentialNFT (eduverify-2.sol)
export const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "recipient", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "CertificateMinted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }
    ],
    "name": "OwnershipUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "address", "name": "owner", "type": "address" }
    ],
    "name": "EmergencyStopActivated",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "recipient", "type": "address" },
      { "internalType": "string", "name": "studentName", "type": "string" },
      { "internalType": "string", "name": "degree", "type": "string" },
      { "internalType": "string", "name": "university", "type": "string" },
      { "internalType": "string", "name": "certificateURI", "type": "string" }
    ],
    "name": "mintCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "getCertificateDetails",
    "outputs": [
      { "internalType": "string", "name": "studentName", "type": "string" },
      { "internalType": "string", "name": "degree", "type": "string" },
      { "internalType": "string", "name": "university", "type": "string" },
      { "internalType": "string", "name": "ipfsHash", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "verifyCertificate",
    "outputs": [
      { "internalType": "string", "name": "studentName", "type": "string" },
      { "internalType": "string", "name": "degree", "type": "string" },
      { "internalType": "string", "name": "university", "type": "string" },
      { "internalType": "string", "name": "ipfsHash", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "emergencyStop",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "resumeContract",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }],
    "name": "updateOwner",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "tokenURI",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes4", "name": "interfaceId", "type": "bytes4" }],
    "name": "supportsInterface",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract address on Flow EVM Testnet
export const CONTRACT_ADDRESS = "0x3CD26d8d57f0e1d9143153ba7DbC27f372229682";

// Flow EVM Testnet chain configuration
export const FLOW_EVM_TESTNET = {
  chainId: 545,
  chainIdHex: '0x221',
  chainName: 'Flow EVM Testnet',
  rpcUrls: ['https://testnet.evm.nodes.onflow.org'],
  nativeCurrency: {
    name: 'FLOW',
    symbol: 'FLOW',
    decimals: 18,
  },
  blockExplorerUrls: ['https://evm-testnet.flowscan.io'],
};

// Check if contract is properly configured
export const isContractConfigured = (): boolean => {
  return CONTRACT_ADDRESS.length === 42 && CONTRACT_ADDRESS.startsWith('0x');
};

// Switch to Flow EVM Testnet
export const switchToFlowTestnet = async (): Promise<void> => {
  if (!window.ethereum) {
    throw new Error('No ethereum provider found');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: FLOW_EVM_TESTNET.chainIdHex }],
    });
  } catch (error: any) {
    // Chain not added, add it
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: FLOW_EVM_TESTNET.chainIdHex,
            chainName: FLOW_EVM_TESTNET.chainName,
            rpcUrls: FLOW_EVM_TESTNET.rpcUrls,
            nativeCurrency: FLOW_EVM_TESTNET.nativeCurrency,
            blockExplorerUrls: FLOW_EVM_TESTNET.blockExplorerUrls,
          },
        ],
      });
    } else {
      throw error;
    }
  }
};

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  balance: string | null;
}

export interface CertificateDetails {
  studentName: string;
  degree: string;
  university: string;
  ipfsHash: string;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && Boolean(window.ethereum?.isMetaMask);
};

export const connectWallet = async (): Promise<WalletState> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }

  try {
    const accounts = await window.ethereum!.request({
      method: 'eth_requestAccounts',
    }) as string[];

    const chainId = await window.ethereum!.request({
      method: 'eth_chainId',
    }) as string;

    const provider = new ethers.BrowserProvider(window.ethereum!);
    const balance = await provider.getBalance(accounts[0]);

    return {
      address: accounts[0],
      isConnected: true,
      chainId: parseInt(chainId, 16),
      balance: ethers.formatEther(balance),
    };
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw error;
  }
};

export const disconnectWallet = (): WalletState => {
  return {
    address: null,
    isConnected: false,
    chainId: null,
    balance: null,
  };
};

export const getContract = async (withSigner = false) => {
  if (!window.ethereum) {
    throw new Error('No ethereum provider found');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  
  if (withSigner) {
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }
  
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
};

export const verifyCertificate = async (tokenId: number): Promise<CertificateDetails> => {
  const contract = await getContract(false);
  const result = await contract.verifyCertificate(tokenId);
  
  return {
    studentName: result[0],
    degree: result[1],
    university: result[2],
    ipfsHash: result[3],
  };
};

export const mintCertificate = async (
  recipient: string,
  studentName: string,
  degree: string,
  university: string,
  certificateURI: string
): Promise<string> => {
  const contract = await getContract(true);
  const tx = await contract.mintCertificate(
    recipient,
    studentName,
    degree,
    university,
    certificateURI
  );
  
  await tx.wait();
  return tx.hash;
};

export const emergencyStop = async (): Promise<string> => {
  const contract = await getContract(true);
  const tx = await contract.emergencyStop();
  await tx.wait();
  return tx.hash;
};

export const resumeContract = async (): Promise<string> => {
  const contract = await getContract(true);
  const tx = await contract.resumeContract();
  await tx.wait();
  return tx.hash;
};

export const updateOwner = async (newOwner: string): Promise<string> => {
  const contract = await getContract(true);
  const tx = await contract.updateOwner(newOwner);
  await tx.wait();
  return tx.hash;
};

export const getContractOwner = async (): Promise<string> => {
  const contract = await getContract(false);
  return await contract.owner();
};

export const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatBalance = (balance: string): string => {
  return parseFloat(balance).toFixed(4);
};