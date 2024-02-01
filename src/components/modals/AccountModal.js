import { useUser } from '@auth0/nextjs-auth0/client';
import { Card, Avatar } from 'antd';
import { useRouter } from 'next/router';
import { ArrowLeftOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import { Modal, Input, Space, Button, notification,Spin  } from 'antd'

export default function AccountModal({hideAccountModal}) {
  const router = useRouter();
  const { user, error, isLoading } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  const [isModalVisible, setIsModalVisible] = useState(true);

  const handleOk = () => {
    setIsModalVisible(false);
    hideAccountModal();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    hideAccountModal();
  };

  return (
    <Modal 
    open={isModalVisible} 
    onCancel={handleCancel}
    style={{fontFamily: 'Roboto Mono, monospace'}}
    footer={[
        <div key="footer-content" style={{ display: 'flex', alignItems: 'center' }}>
          <Button key="back-button" onClick={handleCancel} type="dashed">
              Back
          </Button>
      </div> 
      ]}>
    <div style={{ maxWidth: '600px', margin: 'auto',fontFamily: 'Roboto Mono, monospace' }}>
      <Card style={{marginTop:'20px'}}>
        <div style={{ marginBottom: '20px' }}>
          <Avatar size={64} src={user.picture} />
        </div>
        <div style={{fontFamily: 'Roboto Mono, monospace'}}>
        <p >Name: {user.nickname}</p>
        <p>Email: {user.email}</p>
        <br></br>
        <h2><strong>Current plan info</strong></h2>
        <p>Tier: Free</p>
        <p>From:() to:()</p>
        <br></br>
        <h2><strong>AI Model</strong></h2>
        <p>OpenAI gpt-3.5-turbo</p>
        <br></br>
        <Button><strong>Cancel subsription</strong></Button>
        </div>
      </Card>
      
    </div>
    </Modal>
  );
}
