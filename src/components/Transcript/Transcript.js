
import React, { Component } from 'react';
import ReactTable from 'react-table';
import _ from 'lodash';
import 'react-table/react-table.css';
import Web3 from 'web3';
import bs58 from 'bs58';
import Provider from '@truffle/hdwallet-provider'
import IPFS from 'ipfs-http-client';
import crypto from 'eth-crypto';

const abis = require('./ABI/testnet/abi.js');
const mnemonic = process.env.REACT_APP_QA_USER_MNEMONIC;
const blockchainNode = process.env.REACT_APP_QA_INFURA_ENDPOINT;
const ggPointAddress = process.env.REACT_APP_QA_GGPOINT_ADDRESS;

const Transcripts = () => (
  <Transcript></Transcript>
);

const ipfs = IPFS('/ip4/127.0.0.1/tcp/5001');

class Transcript extends Component {
  constructor(props) {
    super(props);
    this.provider = new Provider(mnemonic, blockchainNode);
    this.web3 = new Web3(this.provider);
    console.log(this.web3)
    this.address = this.web3._provider.addresses[0];

    this.contract = new this.web3.eth.Contract(
      abis.GGPoint.abi, 
      ggPointAddress,
      { from: this.address },
    );

    this.state = {
      hashes: [],
      transcripts: [],
      ready: false
    };
    this.getHashes()
    
  }
  
  onChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  render() {
    return (
      <section className="main-content columns is-fullheight ">
        <aside className="menu column section is-6 ">
          <p className="menu-label">
            Transcripts
          </p>
          <ul className="menu-list">
            {this.state.ready ? this.renderList() : null}
          </ul>
          <div><br/></div>
        </aside>
      </section>
    )
  }

  renderList = () => {
    const data = this.state.transcripts
    
    const columns = [{
      Header: 'Skill',
      accessor: 'name'
    },{
      Header: 'Minutes Spent',
      accessor: 'validatedMinutes'
    }
    ]
    return <ReactTable data={data} columns={columns}/>
  };

  getHashes = ()=> {
    this.contract.methods.getTranscripts(this.address).call().then((hexHashes) => {
      const hashes = hexHashes.map(bytes32Hex => {
        const hashHex = "1220" + bytes32Hex.slice(2)
        const hashBytes = Buffer.from(hashHex, 'hex');
        const hashStr = bs58.encode(hashBytes)
        return hashStr
      });
      this.setState({hashes: hashes},this.getTranscripts);
    })
  } 
  getTranscripts = async() => {
    const hashPromises = this.state.hashes.map((hash) => {
      return ipfs.get(hash);
    })
    const resolvedHashes = await Promise.all(hashPromises);
    const decrypedTranscriptPromises = resolvedHashes.map(hash => {
      const encryptedTranscript = JSON.parse(hash[0].content.toString());
      return crypto.decryptWithPrivateKey('', encryptedTranscript)
    });
    const transcripts = await Promise.all(decrypedTranscriptPromises);
    const transcriptObjects = [];
    transcripts.forEach(transcript =>{
      transcriptObjects.push(JSON.parse(transcript));
    })
    
    this.setState({
      ready: true,
      transcripts: transcriptObjects
    })
  }
}
export default Transcripts