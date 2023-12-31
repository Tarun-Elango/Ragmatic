import React from 'react'
import { Row, Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

const LoadingComponent = ({ msg }) => {
    return (
        <Row style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh'}}>
            <Spin indicator={<LoadingOutlined spin />} />
            <div styles={{fontsize:'large', 'padding':'0 0 5px 15px'}}>{msg}</div>
        </Row>
    )
}

export default LoadingComponent
