import { Modal, Input, Space, Button, notification,Typography,Collapse, message, Upload  } from 'antd'

import { UpOutlined, DownOutlined, WarningOutlined, InboxOutlined } from '@ant-design/icons';
import { React } from 'react'
import { useState, useRef, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import OpaqueLoading from '../OpaqueLoading';

function UploadModal(props){

  const [inputTextUpload, setInputTextUpload] = useState('');
  const [inputTextUploadHeader, setinputTextUploadHeader] = useState('');
  const [inputURL, setinputURL] = useState('');
  const [inputURLHeader, setinputURLHeader] = useState('');
  const { TextArea } = Input;
  const { Title } = Typography;
  const { Panel } = Collapse;

  // Custom expand icon for the Collapse component
  const customExpandIcon = (panelProps) => {
    return panelProps.isActive ? <UpOutlined /> : <DownOutlined />;
  };
  
  const openNotification = (message, description) => {
    notification.open({
      message: <span style={{ color: 'red' }}><WarningOutlined />{message}</span>,
      description: description,
      onClick: () => {
        console.log('Notification Clicked!');
      },
    });
  };
  const {user, error, isLoading } = useUser();
  const [visible, setVisible] = useState(true)
  const [file, setFile] = useState(null);
  const [pdfText, setPdfText] = useState('');
  const fileInputRef = useRef(null);
  const [uploadResponse, setUploadResponse] = useState(null)
  const [isManualLoading, setManualLoading] = useState(false);
  const [buttonType, setButtonType]= useState('')

  const onRemoveFile = () => {
    setFile(null);
    setPdfText('');
    // Reset the file input field
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancel=() => {
    if (buttonType===''){
      // if no button has been selected close modal
      setVisible(false)
      props.hideUploadModal()
    }
      else{
        // if button has been selected, clear button type, thereby going to last page (thats how html is set empty const shows button)
        setButtonType('')
      }
  }

  const handleOk = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    //TODO filter file type
    setPdfText('');
    setFile(null);
    setManualLoading(true)
        
    try {
      // set the loading symbol
      // process the pdf and send to pinecone, namespace (i.e pinecone docuname) = user id + pdf name
      const formData = new FormData();
      formData.append('file', file);
      const userId = user.sub
      formData.append('userId', userId)
      // call this endpoint to store the file after upload
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: {
              'Authorization': `Bearer ${props.acToken}`
            },
        body: formData
      });
      // Parse the response body as JSON
      const data = await response.json();
      setUploadResponse(data.message)
      console.log(data.message);
      props.onUploadSuccess();

    } catch (e) {
      openNotification('failed to upload doc')
      console.error(e);
    }

    setManualLoading(false)
    setPdfText("read");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    };

    const manualText=async ()=>{
      setPdfText('');
      setFile(null);
      setManualLoading(true)
          
      try {
        // set the loading symbol
        // process the pdf and send to pinecone, namespace (i.e pinecone docuname) = user id + pdf name
        const inputtext = {
          headerText:inputTextUploadHeader,
          bodyText:inputTextUpload,
          userId:user.sub
        }
        // call this endpoint to store the file after upload
        const response = await fetch('/api/input', {
          method: 'POST',
          headers: {
                'Authorization': `Bearer ${props.acToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(inputtext)
        });
        // Parse the response body as JSON
        const data = await response.json();
        setUploadResponse(data.message)
        console.log(data.message);
        props.onUploadSuccess();
        setinputTextUploadHeader('')
        setInputTextUpload('')

      } catch (e) {
        openNotification('failed to upload Text')
        console.error(e);
      }

      setManualLoading(false)
      setPdfText("read");
      
    }
    

    const url= async()=>{
      setPdfText('');
      setManualLoading(true)
      setUploadResponse('')
        
      // Attempt to create a URL object with the inputURL
      try {
        const urlObj = new URL(inputURL);
        console.log(inputURL, "is a valid URL.");
        if (urlObj.protocol === 'https:') {
          console.log('The URL is secure and uses HTTPS.');

          if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
            if (urlObj.searchParams.has('v') || urlObj.pathname.length > 1) {
              console.log(inputURL, "is a valid YouTube video URL.");
              //take the inputURL and retrieve the youtube video transcript 
              const youtubeUrl ={
                url:inputURL,
                name:inputURLHeader,
                userId:user.sub
              }
              const urlresponse = await fetch('/api/youtube', {
                method: 'POST', // or 'POST' depending on your endpoint requirements
                headers: {
                  'Content-Type': 'application/json', // Replace YOUR_AUTH_TOKEN_HERE with your actual token
                  'Authorization': `Bearer ${props.acToken}`
                },
                body: JSON.stringify(youtubeUrl)
              });
              const sample = await urlresponse.json();
              console.log(sample.message);
              setUploadResponse(sample.message);
              setinputURL('');
              setinputURLHeader('');
              props.onUploadSuccess();
            } else {
              console.log(inputURL, "is a valid YouTube URL but not a direct video link.");
              setUploadResponse("URL is not a direct video link.");
            }
          } else {
            try{
              // regular webpage
              const inputtext = {
                headerText:inputURLHeader,
                bodyText:inputURL,
                userId:user.sub
              }
              console.log(inputURL, "is a valid URL but not a YouTube URL.");
              const urlresponse = await fetch('/api/url', {
                method: 'POST', // or 'POST' depending on your endpoint requirements
                headers: {
                  'Content-Type': 'application/json', // Replace YOUR_AUTH_TOKEN_HERE with your actual token
                  'Authorization': `Bearer ${props.acToken}`
                },
                body: JSON.stringify(inputtext)
              });
              const dataurl = await urlresponse.json();
              console.log(dataurl.message);
              setUploadResponse(dataurl.message);
              setinputURL('');
              setinputURLHeader('');
              props.onUploadSuccess();

            } catch (error) {
              // If an error is caught, it means the inputURL is not a valid URL
              console.error(inputURL, error);
              setUploadResponse("enter a valid url")
            }
          }   
        } else {
          setUploadResponse("only Https links allowed")
          console.error('The URL is not secure. Please use an HTTPS URL.');
        }
      } catch (error) {
        // If an error is caught, it means the inputURL is not a valid URL
        console.error(inputURL, error);
        setUploadResponse("enter a valid url")
      }
      setManualLoading(false)
      setPdfText("read");
    }

  return (
    
    <Modal
    open={visible}
    title={<span style={{ color: '#5C6B77' }}>Upload a New Resource.</span>}
    onCancel={handleCancel}
    footer={[
      <div key="footer-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <Button key="back-button" onClick={handleCancel} style={{ borderColor: '#B0BEC5', color: '#5C6B77' }}>
          Back
        </Button>
      </div> 
    ]}
    style={{ borderRadius: '10px' }}
    
  >
    <OpaqueLoading isShowing={isManualLoading} />
    <div>
    <Collapse expandIcon={customExpandIcon} className="site-collapse-custom-collapse" >
      <Panel header={<Title level={4} style={{ color: '	#a3573a', marginBottom: 0 }}>PDF, Word docx, Text file</Title>} key="2" className="site-collapse-custom-panel">
        <Space direction="vertical" style={{ width: '100%' }}>
        <form onSubmit={handleOk} style={{ marginTop: '24px' }}> 
        <input
          type="file"
          name="file"
          onChange={(e) => setFile(e.target.files?.[0])}
          ref={fileInputRef}
          style={{ marginTop: '0px' }}
        />
        <input type="submit" value="Process" style={{ border: '1px solid #CBD5E0', padding: '6px 12px', borderRadius: '8px', backgroundColor: '	#2dba4e', color: '#2D3748', cursor: 'pointer' }}/>
      </form>
        </Space>
      </Panel>
    </Collapse>

    <Collapse expandIcon={customExpandIcon} className="site-collapse-custom-collapse" style={{ marginTop: '24px' }}>
      <Panel header={<Title level={4} style={{ color: '	#475c6c', marginBottom: 0 }}>Manually Input Text</Title>} key="1" className="site-collapse-custom-panel">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input placeholder="Give it a name" style={{ borderColor: '#CBD5E0', color: '#2D3748' }} value={inputTextUploadHeader} onChange={(e)=>setinputTextUploadHeader(e.target.value)}/>
          <TextArea
            value={inputTextUpload}
            onChange={(e) => setInputTextUpload(e.target.value)}
            placeholder="Paste your text here"
            autoSize={{ minRows: 4, maxRows: 6 }}
            style={{ borderColor: '#CBD5E0', color: '#2D3748' }}
          />
          <Button style={{ backgroundColor: '	#2dba4e'}} onClick={manualText}  disabled={!inputTextUploadHeader || !inputTextUpload}>Process</Button>
        </Space>
      </Panel>
    </Collapse>

    {/* Add a URL or YouTube Video Section */}
    <Collapse expandIcon={customExpandIcon} className="site-collapse-custom-collapse" style={{ marginTop: '24px' }}>
      <Panel header={<Title level={4} style={{ color: '#eb2d3a', marginBottom: 0 }}>Website URL or YouTube Video</Title>} key="2" className="site-collapse-custom-panel">
        <Space direction="vertical" style={{ width: '100%' }}>
          <h2>Please ensure to include the entire URL, starting with "https://"</h2>
          <Input placeholder="Give it a name" style={{ borderColor: '#CBD5E0', color: '#2D3748' }} value={inputURLHeader} onChange={(e)=>setinputURLHeader(e.target.value)}/>
          <Input placeholder="The url" style={{ borderColor: '#CBD5E0', color: '#2D3748' }} value={inputURL} onChange={(e)=>setinputURL(e.target.value)}/>
          <Button style={{ backgroundColor: '	#2dba4e'}} onClick={url} disabled={!inputURLHeader || !inputURL}>Process</Button>
        </Space>
      </Panel>
    </Collapse>


      {file && !isManualLoading && (
        <div>
          <Button onClick={onRemoveFile} style={{ marginTop: '24px', backgroundColor: '#FF5A5F', color: '#2D3748' }}>Remove File</Button>
        </div>
      )}
  
      {isManualLoading && (
        <div style={{ marginTop: '24px' }}>
          <h2 style={{ color: '#718096' }}>Hold up, we are processing your document.</h2>
        </div>
      )}
  
      {pdfText && (
        <div style={{ marginTop: '24px' }}>
          <h2 style={{ color: '#FC642D' }}>{uploadResponse}</h2>
        </div>
      )}
    </div>  
  </Modal>
  
  )}

export default UploadModal;

/**
 * 
     <Collapse expandIcon={customExpandIcon} className="site-collapse-custom-collapse" style={{ marginTop: '24px' }}>
      <Panel header={<Title level={4} style={{ color: '#7d3865', marginBottom: 0 }}>Images</Title>} key="2" className="site-collapse-custom-panel">
        <Space direction="vertical" style={{ width: '100%' }}>
        </Space>
      </Panel>
    </Collapse>
    <Collapse expandIcon={customExpandIcon} className="site-collapse-custom-collapse" style={{ marginTop: '24px' }}>
      <Panel header={<Title level={4} style={{ color: '#032904', marginBottom: 0 }}>Excel</Title>} key="2" className="site-collapse-custom-panel">
        <Space direction="vertical" style={{ width: '100%' }}>
        </Space>
      </Panel>
    </Collapse>
 */