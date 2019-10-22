
import React, { Component } from 'react'
import ReactTable from 'react-table'
import 'react-table/react-table.css'
import Web3 from 'web3'
import bs58 from 'bs58'
import IPFS from 'ipfs-http-client'
import crypto from 'eth-crypto'
import dotenv from 'dotenv'

const abis = require('./ABI/testnet/abi.js');

const Transcripts = () => (
  <Transcript></Transcript>
);

const ipfs = IPFS('/ip4/127.0.0.1/tcp/5001');

class Transcript extends Component {
  constructor(props) {
    super(props);
    this.web3 = new Web3('https://ropsten.infura.io/v3/');
    this.web3.eth.accounts.wallet.add('');
    this.address = '';

    this.contract = new this.web3.eth.Contract(
      abis.GGPoint.abi, 
      '',
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
    this.contract.methods.getTranscripts('0x25094bccb2b936f4dccfd2fe992065eb388be323').call().then((hexHashes) => {
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
      return crypto.decryptWithPrivateKey('0x7306a015bd8b700cd28413ebf61168aebaadd57f12f80e5b9453f3d13bc9588f', encryptedTranscript)
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