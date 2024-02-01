import React from 'react'
import { Row, Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

const ChatLoading = ({ msg }) => {
    return (
        <Row style={{display:'flex', justifyContent:'center', color:'white', marginLeft:'10px'}}>
            <Spin style={{color:'red'}} indicator={<LoadingOutlined spin  />} />
            <div styles={{fontsize:'large'}}>{msg}</div>
        </Row>
    )
}

export default ChatLoading
