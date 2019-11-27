
import React, { Component , useCallback} from 'react';
import ReactTable from 'react-table';
import _ from 'lodash';
import 'react-table/react-table.css';
import * as CSV from 'csv-string';
import Web3 from 'web3';
import { useDropzone } from 'react-dropzone';
import styled from 'styled-components'

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

  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onabort = () => console.log('file reading was aborted')
      reader.onerror = () => console.log('file reading has failed')
      reader.onload = () => {
      // Do whatever you want with the file contents
        const binaryStr = reader.result
        const string = new TextDecoder("utf-8").decode(binaryStr)
        props.onFile(CSV.parse(string))
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

    this.state = {
      hashes: [],
      csv: false,
      ready: true
    };
    
  }
  
  onChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  onFile = (file) => {
    this.setState({ csv: file })
  }

  render() {
    return (
      <section className="main-content columns is-fullheight ">
        <aside className="menu column section is-6 ">
          <p className="menu-label">
            GG Transcripts
          </p>
          <ul className="menu-list">
            {this.state.csv ?  this.renderList(): <StyledDropzone onFile= {this.onFile}/>}
          </ul>
          <div><br/></div>
        </aside>
      </section>
    )
  }

  renderList = () => {
    const data = this.state.csv;
    
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
}
export default Transcripts