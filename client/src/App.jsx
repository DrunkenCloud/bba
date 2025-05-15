import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import AuthContract from './contracts/Authentication.json';

const App = () => {
  const [account, setAccount] = useState('');
  const [authContract, setAuthContract] = useState(null);
  const [signupStatus, setSignupStatus] = useState('');
  const [signinStatus, setSigninStatus] = useState('');

  const hash = (username, password) => {
    return btoa(`${username}:${password}`);
  };

  useEffect(() => {
    const loadBlockchainData = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });

          const accounts = await web3Instance.eth.getAccounts();
          if (!accounts || accounts.length === 0) {
            throw new Error("No accounts found. Please make sure your wallet is connected.");
          }
          setAccount(accounts[0]);

          const networkId = (await web3Instance.eth.net.getId()).toString();
          if (!AuthContract.networks[networkId]) {
            throw new Error(`Contract not deployed on current network (ID: ${networkId}). Please connect to the correct network or deploy the contract.`);
          }
          
          const deployedNetwork = AuthContract.networks[networkId];
          const contract = new web3Instance.eth.Contract(
            AuthContract.abi,
            deployedNetwork.address
          );
          setAuthContract(contract);
          
          window.ethereum.on('accountsChanged', handleAccountsChanged);
        } catch (error) {
          console.error("Initialization error:", error);
          alert(`Error initializing: ${error.message}`);
        }
      } else {
        alert('Please install MetaMask to use this application');
      }
    };

    loadBlockchainData();
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      console.log('Please connect to MetaMask.');
      setAccount('');
    } else if (accounts[0] !== account) {
      setAccount(accounts[0]);
      console.log('Account changed to:', accounts[0]);
      setSignupStatus('');
      setSigninStatus('');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupStatus('Processing... please confirm in MetaMask');
    const username = e.target.username.value;
    const password = e.target.password.value;
    const userHash = hash(username, password);

    try {
      console.log('Attempting to register with account:', account);
      
      const isRegistered = await authContract.methods.isUserRegistered(account).call();
      if (isRegistered) {
        setSignupStatus('This address is already registered');
        return;
      }

      await authContract.methods.register(userHash).send({
        from: account
      });
      
      setSignupStatus('User registered successfully');
    } catch (error) {
      if (error.code) {
        setSignupStatus(`Error ${error.code}: ${error.message}`);
      } else {
        setSignupStatus('Error: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const handleSignin = async (e) => {
    e.preventDefault();
    setSigninStatus('Verifying credentials...');
    const username = e.target.username.value;
    const password = e.target.password.value;
    const userHash = hash(username, password);

    try {
      const isRegistered = await authContract.methods.isUserRegistered(account).call();
      if (!isRegistered) {
        setSigninStatus('This address is not registered');
        return;
      }

      const storedHash = await authContract.methods.getHash().call({ from: account });
      if (storedHash === userHash) {
        setSigninStatus('Login successful');
      } else {
        setSigninStatus('Incorrect credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.code) {
        setSigninStatus(`Error ${error.code}: ${error.message}`);
      } else {
        setSigninStatus('Error: ' + (error.message || 'Unknown error'));
      }
    }
  };

  return (
    <div className="p-6 font-sans max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Blockchain Authentication DApp</h1>
      
      {account ? (
        <div className="mb-4 p-2 bg-gray-100 rounded">
          <p className="font-medium">Connected Account: <span className="font-mono text-sm">{account}</span></p>
        </div>
      ) : (
        <div className="mb-4 p-2 bg-yellow-100 rounded">
          <p>Please connect to MetaMask</p>
        </div>
      )}
      
      {authContract && account ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          <form onSubmit={handleSignup} className="border p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">Sign Up</h2>
            <input type="text" name="username" placeholder="Username" required className="block border p-2 w-full mb-2" />
            <input type="password" name="password" placeholder="Password" required className="block border p-2 w-full mb-2" />
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Register</button>
            <p className="mt-2 text-sm text-gray-700">{signupStatus}</p>
          </form>

          <form onSubmit={handleSignin} className="border p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">Sign In</h2>
            <input type="text" name="username" placeholder="Username" required className="block border p-2 w-full mb-2" />
            <input type="password" name="password" placeholder="Password" required className="block border p-2 w-full mb-2" />
            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Login</button>
            <p className="mt-2 text-sm text-gray-700">{signinStatus}</p>
          </form>
        </div>
      ) : (
        <p>Loading Web3, accounts, and contract...</p>
      )}
    </div>
  );
};

export default App;
