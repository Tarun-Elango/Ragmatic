import React, { useState } from 'react';
import { Modal, Input, Space, Button, notification,Spin  } from 'antd'

function AboutModal({ hideAboutModal }) {
  const [isModalVisible, setIsModalVisible] = useState(true);

  const handleOk = () => {
    setIsModalVisible(false);
    hideAboutModal();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    hideAboutModal();
  };


  // about the app
  // about the team
  // version release notes

  return (
    <Modal 
    open={isModalVisible} 
    title="JotDown: Your Friendly Resource Assitant!" 
    onCancel={handleCancel}
    footer={[
      <div key="footer-content" style={{ display: 'flex', alignItems: 'center' }}>
        <Button key="back-button" onClick={handleCancel} type="dashed">
            Back
        </Button>
    </div> 
    ]}>
      <h3 > <em> Beta version 0.1</em></h3> 
    <div className="about-modal" style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px',fontFamily: 'Roboto Mono, monospace' }}>
        <p style={{ color: '#333', textAlign: 'center' }}>Quickly upload and get AI assistance for your files.</p>
        
        <div style={{ marginTop: '10px', marginBottom: '20px', color: '#555' }}>
        <strong>Supported File Types:</strong>
            <ul style={{ listStyleType: 'disc', padding: 0 }}>
            <li>PDFs</li>
            <strong>Future support:</strong>
            <li>Word Documents</li>
            <li>Text Files</li>
            <li>Excel Spreadsheets</li>
            <li>Website URL content</li>
            <li>YouTube Videos</li>
            <li>MP4 Videos</li>
            <li>MP3 Audio</li>
            <li>Images</li>
            <li>Regular old plain text</li>
        </ul>

        </div>

        <p style={{ color: '#333', textAlign: 'center' }}><strong>Start Exploring !!</strong></p>

    </div>
</Modal>

  )
}

export default AboutModal;
