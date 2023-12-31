import { Modal, Input, Space, Button, notification } from 'antd'
import { React, useState } from 'react'

function UploadModal(props){
    const [api, contextHolder] = notification.useNotification()
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(true)
    const handleCancel=() => {
        setVisible(false)
        props.hideUploadModal()
    }
    const handleOk = () => {
        // loading true do the task, not async, then loading false, keep loading till file uploaded

        setLoading(true);
        setTimeout(() => {
            setLoading(true);
            setVisible(false)            
            props.hideUploadModal()
          }, 3000);
      };

    return (
      <Modal
        open={visible}
        title="Upload a New Document"
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel} type="dashed">
            Back
          </Button>,

          <Button
            type="dashed"
            loading={loading}
            onClick={handleOk}
          >
            <a>Upload</a>
          </Button>,
        ]}
      >
        <p>Some contents...</p>
        <p>Some contents...</p>
        <p>Some contents...</p>
        <p>Some contents...</p>
        <p>Some contents...</p>
      </Modal>
    )

}

export default UploadModal;