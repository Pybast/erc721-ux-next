import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.scss'
import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider'
import {useState, useEffect} from 'react';
import {fakeMeebitsABI, fakeMeebitsAddress, fakeMeebitsClaimerABI, fakeMeebitsClaimerAddress, signatures} from '../utils/contractMeebits'

export default function FakeMeebits() {

  const [provider, setProvider] = useState();
  const [web3, setWeb3] = useState();
  const [contract, setContract] = useState();
  const [contractClaimer, setContractClaimer] = useState();
  const [accounts, setAccounts] = useState();
  const [metamaskConnected, setMetamaskConnected] = useState(false);
  const [contractName, setContractName] = useState("Unknown");
  const [contractSupply, setContractSupply] = useState("???");
  const [baseURI, setBaseURI] = useState("");
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);


  const detectProvider = () => {
    detectEthereumProvider().then(async (provider) =>  {
      if (!provider) {
        alert("No ethereum wallet found");
        return;
      }
      setProvider(provider);
      await setWeb3(new Web3(provider));
    })
  }

  async function SwitchNetwork() {
    if (!web3) {
      alert('Could not set Web3 Provider. Make sure you have a web3 enabled browser')
      return false;
    }
    const response = await (web3.currentProvider).request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x4" }]
    }).then(() => true).catch(() => false);
    console.log({response});
    return response
  }

  useEffect(() => {
    detectProvider();
  }, []);

  useEffect(() => {
    login();
  }, [web3])
  
  useEffect(() => {
    (async () => {
      setLoading(true);
      if (contract) {
        console.log("fakeMeebits", contract.methods.name().call());
        setContractName(await contract.methods.name().call());
        const _supply = await contract.methods.totalSupply().call();
        setContractSupply(_supply);
        const _baseURI = await contract.methods.baseURI().call();
        setBaseURI(_baseURI);

        const tokenURIs = [];
        for (let index = 1; index <= _supply; index++) {
          console.log("uri", _baseURI + index);
          const request = await fetch(`/api/fetchMeebits/${index}`);
          const response = await request.json();
          const uri = response['image'];
          tokenURIs.push(uri);
        }
        setTokens(tokenURIs);
        setLoading(false);
      }
    })();
  }, [contract])

  const login = async () => {
    if (!web3) {
      return false;
    }

    const res = SwitchNetwork();

    if (!res) {
      alert("You must connect to the Rinkeby chain");
      return;
    }

    if (provider === null) {
      alert('Could not set Web3 Provider. Make sure you have a web3 enabled browser')
      return;
    }

    const fakeMeebits = await new web3.eth.Contract(fakeMeebitsABI, fakeMeebitsAddress);
    const fakeMeebitsClaimer = await new web3.eth.Contract(fakeMeebitsClaimerABI, fakeMeebitsClaimerAddress);
    setContract(fakeMeebits);
    setContractClaimer(fakeMeebitsClaimer);
 
    if (!provider) return;

    const accounts = await (provider).request({
      method: "eth_requestAccounts",
    }).catch(() => [])

    setAccounts(accounts);

    if (accounts.length > 0) {
      setMetamaskConnected(true)
    }
  }

  const buyToken = async () => {
    // const isWhitelisted = await contractClaimer.methods.whitelist(accounts[0]).call();
    // if (!isWhitelisted) {
    //   alert("You are not whitelisted");
    //   return;
    // }
    const tokenToClaim = parseInt(contractSupply) + 1;
    const signature = signatures[tokenToClaim].signature;
    if (signature) {
      await contractClaimer.methods.claimAToken(tokenToClaim, signature).send({
        from: accounts[0]
      }).catch((e) => e);
    }
    
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        { (!accounts || accounts.length == 0) && (
          <>
            <h1 className={styles.title}>
              Welcome to <a href="https://github.com/l-henri/erc721-ux">ERC721-ux!</a>
            </h1>
          </>
        )}

        { accounts && !loading && accounts.length > 0 && (
          <>
            <div className={styles.titleContainer}>
              <a href={`/`}><button className="back">Back</button></a>
              <h1>{contractName} - {contractSupply}</h1>
              <button onClick={buyToken}>Buy a token</button>
            </div>
            <div className={styles.gallery}>
              {tokens?.map((value, index) => {
                return <a key={index} href={`/fakeMeebits/${index + 1}`}>
                  <div className={styles.galleryItem}>
                    <img src={value}></img>
                  </div>
                </a>
              })}
            </div>
          </>
        )}
        { loading && (
          <>
            <div className={styles.titleContainer}>
              <a href={`/`}><button className="back">Back</button></a>
              <h1>{contractName} - {contractSupply}</h1>
            </div>
            <svg version="1.1" id="L5" x="0px" y="0px"
              viewBox="0 0 800 800">
              <circle fill="rgb(204, 208, 209)" stroke="none" cx="6" cy="50" r="6">
                <animateTransform 
                  attributeName="transform" 
                  dur="1s" 
                  type="translate" 
                  values="0 15 ; 0 -15; 0 15" 
                  repeatCount="indefinite" 
                  begin="0.1"/>
              </circle>
              <circle fill="rgb(204, 208, 209)" stroke="none" cx="30" cy="50" r="6">
                <animateTransform 
                  attributeName="transform" 
                  dur="1s" 
                  type="translate" 
                  values="0 10 ; 0 -10; 0 10" 
                  repeatCount="indefinite" 
                  begin="0.2"/>
              </circle>
              <circle fill="rgb(204, 208, 209)" stroke="none" cx="54" cy="50" r="6">
                <animateTransform 
                  attributeName="transform" 
                  dur="1s" 
                  type="translate" 
                  values="0 5 ; 0 -5; 0 5" 
                  repeatCount="indefinite" 
                  begin="0.3"/>
              </circle>
            </svg>
          </>
        )}
        
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  )
}
