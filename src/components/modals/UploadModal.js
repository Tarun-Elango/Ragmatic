import { Modal, Input, Space, Button, notification,Spin  } from 'antd'
import { React } from 'react'
import { useState, useRef, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import OpaqueLoading from '../opaqueLoading';

function UploadModal(props){
  const {user, error, isLoading } = useUser();
  const [visible, setVisible] = useState(true)
  const [file, setFile] = useState(null);
  const [pdfText, setPdfText] = useState('');
  const fileInputRef = useRef(null);
  const [uploadResponse, setUploadResponse] = useState(null)
  const [isManualLoading, setManualLoading] = useState(false);

  const onRemoveFile = () => {
    setFile(null);
    setPdfText('');
    // Reset the file input field
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancel=() => {
      setVisible(false)
      props.hideUploadModal()
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
      // call this endpooint to store the file after upload
      const response = await fetch('/api/parse', {
        method: 'POST',
        body: formData
      });
      // Parse the response body as JSON
      const data = await response.json();
      setUploadResponse(data.message)
      console.log(data.message);

    } catch (e) {
      console.error(e);
    }

    setManualLoading(false)
    setPdfText("read");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    };

  return (
    
      <Modal
        open={visible}
        title='Upload a New Document.'
        onCancel={handleCancel}
        footer={[
          <div key="footer-content" style={{ display: 'flex', alignItems: 'center' }}>
            <h4 style={{ marginRight: 'auto' }}>Allowed format: .pdf</h4>
            <Button key="back-button" onClick={handleCancel} type="dashed">
                Back
            </Button>
        </div> 
        ]}
      >
        <OpaqueLoading isShowing={isManualLoading} />
        <div>
          <form onSubmit={handleOk} style={{marginTop:'2vh'}}> 
            <input
              type="file"
              name="file"
              onChange={(e) => setFile(e.target.files?.[0])}
              ref={fileInputRef}
            />
            <input type="submit" value="Upload" style={{border:'2px solid #000', padding:'5px', borderRadius:'8px', backgroundColor:'#7ce38b'}}/>
          </form>

          {file && !isManualLoading &&(
            <div>
              <Button onClick={onRemoveFile} style={{marginTop:'2vh', backgroundColor:'#fa7970'}}>Remove File</Button>
            </div>
          )}

          {isManualLoading && (
            <div>
              <h2>Hold up, we are processing your document.</h2>
            </div>

          )}

          {pdfText && (
            <div>
              <h2>{uploadResponse}</h2>
            </div>
          )}
        </div>
      </Modal>
  )}

export default UploadModal;