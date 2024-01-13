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

  return (
    <Modal 
    open={isModalVisible} 
    title="Welcome to JotDown!" 
    onCancel={handleCancel}
    footer={[
      <div key="footer-content" style={{ display: 'flex', alignItems: 'center' }}>
        <Button key="back-button" onClick={handleCancel} type="dashed">
            Back
        </Button>
    </div> 
    ]}>
    <div className="about-modal" style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px' }}>
        <p style={{ color: '#333', textAlign: 'center' }}>Quickly upload and get AI assistance for your files.</p>
        
        <div style={{ marginTop: '10px', marginBottom: '20px', color: '#555' }}>
            <strong>Supported File Types:</strong>
            <ul style={{ listStyleType: 'disc', padding: 0 }}>
            <li>PDFs</li>
            <li>Word Documents</li>
            <li>Text Files</li>
            <li>Excel Spreadsheets</li>
            <li>Website URLs</li>
            <li>YouTube Videos</li>
        </ul>
        </div>

        <p style={{ color: '#333', textAlign: 'center' }}><strong>Start Exploring !!</strong></p>
    </div>
</Modal>

  )
}

export default AboutModal;
