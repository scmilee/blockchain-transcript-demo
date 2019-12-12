
import React, { Component , useCallback} from 'react';
import ReactTable from 'react-table';
import _ from 'lodash';
import 'react-table/react-table.css';
import * as CSV from 'csv-string';
import Web3 from 'web3';
import { useDropzone } from 'react-dropzone';
import styled from 'styled-components'
import HDWalletProvider from '@truffle/hdwallet-provider'
const getColor = (props) => {
  if (props.isDragAccept) {
      return '#00e676';
  }
  if (props.isDragReject) {
      return '#ff1744';
  }
  if (props.isDragActive) {
      return '#2196f3';
  }
  return '#eeeeee';
}

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-width: 2px;
  border-radius: 2px;
  border-color: ${props => getColor(props)};
  border-style: dashed;
  background-color: #fafafa;
  color: #bdbdbd;
  outline: none;
  transition: border .24s ease-in-out;
`;


const Transcripts = () => (
  <Transcript />
);

const StyledDropzone = (props)=> {
  const { onFile } = props;
  
  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onabort = () => console.log('file reading was aborted')
      reader.onerror = () => console.log('file reading has failed')
      reader.onload = () => {
      // Do whatever you want with the file contents
        const binaryStr = reader.result
        const string = new TextDecoder("utf-8").decode(binaryStr)
        onFile(CSV.parse(string))
      }
      reader.readAsArrayBuffer(file)
    })
    
  }, [])

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    acceptedFiles
  } = useDropzone({onDrop});
  const files = acceptedFiles.map(file => <li key={file.path}>{file.path}</li>);
   
  return (
    <div className="container">
      <Container {...getRootProps({isDragActive, isDragAccept, isDragReject})}>
        <input {...getInputProps()} />
        <p>Drag 'n' drop some files here, or click to select files</p>
      </Container>
      <ul>{files}</ul>
    </div>
  );
}

class Transcript extends Component {
  constructor(props) {
    super(props);
    this.web3 = new Web3(new HDWalletProvider(process.env.REACT_APP_QA_ADMIN_MNEMONIC, process.env.REACT_APP_QA_INFURA_ENDPOINT));
    this.trustedOracles = {
      '0x28841345caadffac6907cb35ac26d4f79f5ebdff' : 'CBT-Nuggets',
      '0x265f1b94b59c8bff67c661e40d339a88f9aab459' : 'Comp-TIA'
    }
    this.state = {
      hashes: [],
      csv: false,
      ready: true
    };
    
  }
  
  onChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  onFile = async(fileArray) => {
    //remove headers line
    fileArray.shift();

    const headers = [
      "memberId",
      "validatedMinutes",
      "completedAt",
      "name",
      "timeSpent"
    ]
    //loop through each line
    const entries = await _.map(fileArray, async(line) => {
      
      const signature = line.pop();
      const hash = line.pop();

      const entry = {};
      _.forEach(line, (datapoint, i)=> {
        entry[headers[i]] = datapoint
      });
      
      //convert entries back to numbers (can be fixed in future to just use strings)
      entry.memberId = Number.parseInt(entry.memberId);
      entry.validatedMinutes = Number.parseInt(entry.validatedMinutes);
      entry.timeSpent = Number.parseInt(entry.timeSpent);

      //generate new hash
      const checksumHash = this.web3.utils.soliditySha3(JSON.stringify(entry));
      if(checksumHash !== hash) return entry;
      //check to see if signature is valid
      const skillAuthor = await this.web3.eth.personal.ecRecover(hash, signature);
      if(this.trustedOracles[skillAuthor] === undefined) return entry;

      entry.skillAuthor = this.trustedOracles[skillAuthor];
      entry.valid = true;

      return entry;
    });

    this.setState({ csv: await Promise.all(entries) })
  }

  render() {
    return (
      <section className="main-content columns ">
        <aside className="menu column section is-10">
          <h1 className="menu-label is-size-6">
            GG Transcripts
          </h1>
            {this.state.csv ?  this.renderList(): <StyledDropzone onFile= {this.onFile}/>}
          <div><br/></div>
        </aside>
      </section>
    )
  }

  resetCSV = () => {
    this.setState({ csv : false});
  }

  renderList = () => {
    const data = this.state.csv;
    const columns = [
      {
        Header: 'Skill',
        accessor: 'name'
      },
      {
        Header: 'Date Completed',
        accessor: 'completedAt'
      },
      {
        Header: 'Skill Author',
        accessor: 'skillAuthor'
      },
      {
        Header: "Validated",
        Cell: (row) => {
          if (row.original.valid) {
            return (<div><span className="icon has-text-success"> <i className="fas fa-check-square"></i> </span></div>)
          } else {
            return (<div><span className="icon has-text-danger"><i className="fas fa-ban"></i> </span></div>)
          }
          
        },
        id: "status"
      }
    ]
    return (
      <div> 
          <ReactTable data={data} columns={columns} showPagination={false} showPageSizeOptions={false} defaultPageSize={5} />
          <br/>
          <a onClick={()=> this.resetCSV()} className="button is-warning is-pulled-right">
            New Transcript
          </a>

      </div>
    )
  };
}
export default Transcripts