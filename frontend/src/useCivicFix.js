import { useState, useCallback, useEffect } from 'react';
import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

let _readClient = null;

function getReadClient() {
  if (!_readClient) {
    _readClient = createClient({ chain: studionet });
  }
  return _readClient;
}

function getWriteClient(account) {
  return createClient({ chain: studionet, account });
}

// Convert Wei (u256) to human readable GEN string
export function formatGen(weiVal) {
  if (!weiVal) return '0';
  try {
    const big = BigInt(weiVal);
    const integerPart = big / 10n**18n;
    const fractionalPart = big % 10n**18n;
    let fractionStr = fractionalPart.toString().padStart(18, '0');
    fractionStr = fractionStr.replace(/0+$/, ''); // Trim trailing zeros
    if (fractionStr === '') {
      return integerPart.toString();
    }
    return `${integerPart}.${fractionStr.slice(0, 4)}`;
  } catch (e) {
    return '0';
  }
}

// Convert human readable GEN input to Wei (u256 BigInt)
export function parseGen(genVal) {
  if (!genVal || genVal.toString().trim() === '') return 0n;
  try {
    const parts = genVal.toString().split('.');
    let integerPart = parts[0] || '0';
    let fractionalPart = parts[1] || '';
    fractionalPart = fractionalPart.slice(0, 18).padEnd(18, '0');
    return BigInt(integerPart) * 10n**18n + BigInt(fractionalPart);
  } catch (e) {
    return 0n;
  }
}

export function useCivicFix() {
  const [address, setAddress] = useState('');
  const [glAccount, setGlAccount] = useState(null);
  const [projects, setProjects] = useState([]);
  const [contractBalance, setContractBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [txStatus, setTxStatus] = useState('');

  // Connect Wallet (MetaMask/ethereum provider or fallback ephemeral account)
  const connectWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const addr = accounts[0].toLowerCase();
        setAddress(addr);
        setGlAccount(addr);
      } else {
        // Ephemeral account fallback
        let savedKey = localStorage.getItem('__civicfix_sk');
        let acct;
        if (savedKey) {
          acct = createAccount(savedKey);
        } else {
          acct = createAccount();
          localStorage.setItem('__civicfix_sk', acct.privateKey);
        }
        const addr = acct.address.toLowerCase();
        setAddress(addr);
        setGlAccount(acct);
      }
    } catch (err) {
      console.error('Wallet connection failed:', err);
      setError('Wallet connection failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all projects and contract balance
  const fetchProjectsState = useCallback(async () => {
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') return;
    setLoading(true);
    try {
      const client = getReadClient();
      
      // Get projects count
      const rawCount = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: 'get_projects_count',
        args: [],
      });
      const count = Number(rawCount);
      
      const fetchedProjects = [];
      for (let i = 0; i < count; i++) {
        const rawProj = await client.readContract({
          address: CONTRACT_ADDRESS,
          functionName: 'get_project',
          args: [i],
        });
        if (rawProj && rawProj !== '{}') {
          const projObj = JSON.parse(rawProj);
          fetchedProjects.push(projObj);
        }
      }
      
      // Get balance of contract (escrow pool balance)
      const rawBalance = await client.getBalance({ address: CONTRACT_ADDRESS });
      setContractBalance(rawBalance.toString());
      
      setProjects(fetchedProjects.reverse()); // Show newest first
      setError('');
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to fetch projects: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create Project (Lock GEN, set contractor and scope)
  const createProject = async (contractorAddress, scopeDescription, fundingAmt) => {
    if (!glAccount || !CONTRACT_ADDRESS) {
      throw new Error('Wallet not connected');
    }
    setLoading(true);
    setError('');
    setTxHash('');
    setTxStatus(`Funding Project: locking ${fundingAmt} GEN for local public works escrow...`);

    try {
      const client = getWriteClient(glAccount);
      const valueWei = parseGen(fundingAmt);
      
      const hash = await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: 'create_project',
        args: [contractorAddress.trim(), scopeDescription.trim()],
        value: valueWei,
      });
      
      setTxHash(hash);
      setTxStatus('Submitting project escrow creation transaction. Locking funds...');

      const receipt = await client.waitForTransactionReceipt({ hash });
      
      const leaderReceipt = receipt.consensus_data?.leader_receipt?.[0];
      if (leaderReceipt && leaderReceipt.execution_result === 'ERROR') {
        const errorMsg = leaderReceipt.genvm_result?.stderr || 'Contract execution error';
        throw new Error(errorMsg);
      }

      setTxStatus('Success! Public works escrow contract established.');
      await fetchProjectsState();
      return receipt;
    } catch (err) {
      console.error('Project creation failed:', err);
      setError(err.message || 'Transaction failed');
      setTxStatus('Failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Audit Project Satisfaction (Submit community discussion URL)
  const auditProjectSatisfaction = async (projectId, forumUrl) => {
    if (!glAccount || !CONTRACT_ADDRESS) {
      throw new Error('Wallet not connected');
    }
    setLoading(true);
    setError('');
    setTxHash('');
    setTxStatus(`Initiating community satisfaction audit for project #${projectId}...`);

    try {
      const client = getWriteClient(glAccount);
      const hash = await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: 'audit_project_satisfaction',
        args: [Number(projectId), forumUrl.trim()],
      });
      
      setTxHash(hash);
      setTxStatus('GenLayer nodes are rendering the forum URL and running AI public sentiment evaluations. Please wait 15-30s...');

      const receipt = await client.waitForTransactionReceipt({ hash });
      
      const leaderReceipt = receipt.consensus_data?.leader_receipt?.[0];
      if (leaderReceipt && leaderReceipt.execution_result === 'ERROR') {
        const errorMsg = leaderReceipt.genvm_result?.stderr || 'Audit execution error';
        throw new Error(errorMsg);
      }

      setTxStatus('Consensus complete! Neighbor satisfaction evaluation finalized.');
      await fetchProjectsState();
      return receipt;
    } catch (err) {
      console.error('Satisfaction audit failed:', err);
      setError(err.message || 'Transaction failed');
      setTxStatus('Failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
      fetchProjectsState();
    }
  }, [CONTRACT_ADDRESS, address, fetchProjectsState]);

  return {
    address,
    projects,
    contractBalance,
    loading,
    error,
    txHash,
    txStatus,
    connectWallet,
    fetchProjectsState,
    createProject,
    auditProjectSatisfaction,
    contractAddress: CONTRACT_ADDRESS,
  };
}
