import React from 'react'
import { Spin } from 'antd'

const OpaqueLoading = ({ isShowing }) => {
    if (!isShowing) return null;
  
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 1000,
          }}>
            <Spin size="large" />
            <h2 style={{marginLeft:'20px'}}> Large docs take a wee bit longer to process, support us to improve our server.</h2>
          </div>
    )
}

export default OpaqueLoading
