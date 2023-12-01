import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { DownOutlined } from '@ant-design/icons';
import { Dropdown, Space, Typography, Button, Input } from 'antd';
import { useUser } from '@auth0/nextjs-auth0/client';
import Head from 'next/head'

export default function Home() {
   const {user, error, isLoading } = useUser();
    const router = useRouter();
    var typeArray = ["Assistant", "Coding help", "Tax help", "Business help", "🤫", "Lifestyle help", "Brand help"];
    const [inputText, setInputText] = useState('');
    const [userMessages, setUserMessages] = useState([]);
    const [responseMessages, setResponseMessages] = useState([]);
    const [dropDown, setDropDown] = useState(typeArray[0]) // default = assitant
    const [currentAiIndex, setCurrentAiIndex] = useState(0) // default = assitant, use this when choosing the ai to use

    const handleButtonClick = async () => {
        const currentDateTime = new Date().toLocaleString();
        const newMessage = {
            text: inputText,
            timestamp: currentDateTime,
            align: 'right',
        };

        setUserMessages([...userMessages, newMessage]);
        await fetchResponse(inputText);
        setInputText('');
    };

    const fetchResponse = async (inputText) => {
        try {
            const apiFetch = await fetch('api/fetch');
            const data = await apiFetch.json();
            const responseMessage = {
                text: JSON.stringify(data.message).slice(1, -1),
                timestamp: new Date().toLocaleString(),
                align: 'left',
            };

            setResponseMessages([...responseMessages, responseMessage]);
        } catch (error) {
            console.error('Error fetching response:', error);
        }
    };

    const handleInputChange = (e) => {
        setInputText(e.target.value);
    };

    const handleBackButtonClick = () => {
        router.push('/api/auth/logout');
    };

    const isButtonDisabled = inputText.trim() === '' ;

    const handleMenuClick = ({ key, index }) => {
        // console.log(`Selected item number: ${key}`);
        setDropDown(key)
        setCurrentAiIndex(index)
    };
    
    const items = [
        {
            key: '1',
            label: (
                <a onClick={() => handleMenuClick({ key: typeArray[0], index: 0  })}>
                    {typeArray[0]}
                </a>
            ),
        },
        {
            key: '2',
            label: (
                <a onClick={() => handleMenuClick({ key: typeArray[1] , index: 1 })}>
                    {typeArray[1]}
                </a>
            ),
        },
        {
            key: '3',
            label: (
                <a onClick={() => handleMenuClick({ key: typeArray[2], index: 2  })}>
                   {typeArray[2]}
                </a>
            ),
        },
        {
            key: '4',
            label: (
                <a onClick={() => handleMenuClick({ key: typeArray[3], index: 3  })}>
                    {typeArray[3]}
                </a>
            ),
        },
        {
            key: '5',
            label: (
                <a onClick={() => handleMenuClick({ key: typeArray[4], index: 4  })}>
                    {typeArray[4]}
                </a>
            ),
        },
        {
            key: '6',
            label: (
                <a onClick={() => handleMenuClick({ key: typeArray[5], index: 5 })}>
                   {typeArray[5]}
                </a>
            ),
        },
        {
            key: '7',
            label: (
                <a onClick={() => handleMenuClick({ key: typeArray[6], index: 6  })}>
                    {typeArray[6]}
                </a>
            ),
        },
    ];

    useEffect(() => {
        // updates according to the ai choosen
        console.log(user)
  }, [currentAiIndex]);
  if (user){
  return (
    <>
    <Head>
        <title>Assitant</title>
        <meta name="description" content="Personal Assitant" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link href="../../font/VarelaRound-Regular.ttf" rel="stylesheet"/>
    </Head>
    <div style={{  minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#21262d', padding: '10px', overflowX:'hidden' }}>
    <div style={{marginTop:'10px', display: 'flex', alignItems: 'center', width: '100%', maxWidth: '800px' }}>
        <h3 style={{ color: 'white', flex: '1', marginRight: '15px', fontSize: '1.2em' }}>{user.nickname} Welcome to Your AI Companion</h3>
        <Dropdown
            menu={{
            items,
            selectable: true,
            defaultSelectedKeys: ['1'],
            }}
        >
            <Typography.Link style={{color:'white'}}>
            <Space>
                {dropDown}
                <DownOutlined />
            </Space>
            </Typography.Link>
        </Dropdown>
        
        <Button onClick={handleBackButtonClick} style={{ backgroundColor: '#fa7970', marginLeft:'15px', border:'black' }}>Log Out</Button>
    </div>

    <div style={{ borderRadius: '10px', backgroundColor: '#89929b', marginTop: '10px', border: '1px solid black', padding: '10px', width: '100%', maxWidth: '800px', height: '80vh', overflowY: 'auto' }}>
        {([...userMessages, ...responseMessages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))).map((message, index) => (
            <div key={index} style={{ textAlign: message.align, marginBottom: '10px' }}>
                {message.text}
            </div>
        ))}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '800px' }}>
        <Input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Type your message"
            style={{ backgroundColor: '#a2d2fb', marginBottom: '5px', marginTop: '5px', flex: '1' }}
        />
        <Button onClick={handleButtonClick} style={{ marginLeft: '10px', backgroundColor: '#7ce38b', border: 'black', fontSize: '1em' }} disabled={isButtonDisabled}>Send</Button>
    </div>
</div>
</>
  )

} else if (isLoading) {
    return <p>Loading...</p>;
} else if (error) {
    return <p>Error: {error.message}</p>;
} else {
    // If user is null and there's no error, redirect to login
    router.push('/api/auth/login')
}
}
