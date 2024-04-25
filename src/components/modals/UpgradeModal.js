import React, { useState } from 'react';
import { Modal, Input, Space, Button, notification,Spin  } from 'antd'
import { useUser } from '@auth0/nextjs-auth0/client';

function UpgradeModal({ hideUpgradeModal }) {
  const [isUpgradeModalVisible, setIsUpgradeModalVisible] = useState(true);
  const { user, error, isLoading } = useUser();
  const handleOk = () => {
    setIsUpgradeModalVisible(false);
    hideUpgradeModal();
  };

  const handleCancel = () => {
    setIsUpgradeModalVisible(false);
    hideUpgradeModal();
  };

  return (
    <Modal
  open={isUpgradeModalVisible}
  title={<span style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 'bold' }}>Enjoy Pro Plan benefits for free during our Beta version!</span>}
  onCancel={handleCancel}
  footer={[
    <div key="footer-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
      <Button key="back-button" onClick={handleCancel} style={{ border: '1px solid #ccc', borderRadius: '5px' }}>
        Back
      </Button>
      <h2 style={{ margin: 0, color: "#5433FF", fontFamily: 'Roboto, sans-serif', fontWeight: 'normal' }}><em>Powered by Stripe</em></h2>
    </div>
  ]}
  style={{ fontFamily: 'Roboto, sans-serif' }}
>
  <div className="upgrade-modal" style={{
    backgroundColor: '#F9F9F9',
    padding: '24px',
    borderRadius: '8px',
    border: '1px solid #EAEAEA',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  }}>
    <p style={{ fontFamily: 'Roboto, sans-serif', lineHeight: '1.6', color: '#333' }}>
    <strong>$7.99</strong> No Holds Barred, Unlock Everything
    </p>
    <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginBottom: '24px', marginTop:'24px' }}>
      <li style={{ marginBottom: '8px' }}>Unlimited Resources</li>
      <li style={{ marginBottom: '8px' }}>Unlimited Messages</li>
      <li style={{ marginBottom: '8px' }}>Unlimited Tool Usage</li>
      <li>AI model: Custom GPT-4-turbo</li>
    </ul>
    <Button style={{ backgroundColor: '#007BFF', color: 'white', padding: '6px 12px', borderRadius: '5px', border: 'none', fontFamily: 'Roboto, sans-serif', fontWeight: 'medium' }}>
      Continue to Payment
    </Button>
    <p style={{ marginTop: '24px', fontSize: '0.9em', color: '#666' }}>
      We are here for you.
    </p>
  </div>
</Modal>


  )
}

export default UpgradeModal;
