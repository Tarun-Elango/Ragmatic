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
    title="About Me"  onCancel={handleCancel}
    footer={[
        <div key="footer-content" style={{ display: 'flex', alignItems: 'center' }}>
          <Button key="back-button" onClick={handleCancel} type="dashed">
              Back
          </Button>
      </div> 
      ]}>
      <p>This is a chat AI app where you can upload your PDF...</p>
    </Modal>
  )
}

export default AboutModal;
