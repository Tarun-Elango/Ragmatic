import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { DownOutlined, UserOutlined, InfoCircleOutlined, PlusCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import { Dropdown, Space, Typography, Button, Input,Tooltip, Menu } from 'antd';
import { useUser } from '@auth0/nextjs-auth0/client';
import { getSession } from "@auth0/nextjs-auth0";
import Head from 'next/head'
import LoadingComponent from '../components/LoadingComponent'
import UploadModal from '../components/modals/UploadModal';
import auth0 from './api/auth/[auth0]';
import axios from 'axios';

// TODO: change the header for mobile, MAKE IT SO IT BECOMES COMPACT/rearrage on zoom, use media in global css to figure out the settings
// connect front and back
// retrieve all user documents and chat in usetate, replace the sample arrays
// ui changes when no document or chat, ask user to upload ...., check all edge cases
// upload document ui and backend
// about, settings modal
// account page, later on stripe etc
// change auth0 to supertokens

//connect the ai server to the messaging chat

export default function Home({accessToken}) {
    const token = accessToken
    // TODO; when token is expired force user to logout

    const {user, error, isLoading } = useUser();
    const router = useRouter();
    var typeArray = ["Document 1"];
    var chatNames = ["chat 1", "chat 2"];
    const [inputText, setInputText] = useState('');
    const [userMessages, setUserMessages] = useState([]);
    const [responseMessages, setResponseMessages] = useState([]);
    const [dropDown, setDropDown] = useState(typeArray[0]) // default = assitant
    const [currentDocuIndex, setCurrentDocuIndex] = useState(0) // default = assitant, use this when choosing the ai to use
    const [currentChatIndex, setCurrentChatIndex] = useState(0)
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [isNewChat, setIsNewChat] = useState(false)
    const [current, setCurrent] = useState('mail');

    const text = <span> About</span>;
    const newText = <span> Create New Chat</span>;

    

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
            const apiFetch = await fetch('api/health');
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

    const handleAccountButtonClick = () => {
        router.push('/account')
    }

    const isButtonDisabled = inputText.trim() === '' ;

    const handleMenuClick = ({ key, index }) => {
        // console.log(`Selected item number: ${key}`);
        setDropDown(key)
        setCurrentDocuIndex(index)
    };
    const handleChatHistoryClick =({key, index}) => {
        setCurrentChatIndex(index)
    }

    
    const onClick = (e) => {
        if (e.key == 'setting:4'){
            handleBackButtonClick()
        }
        if (e.key == 'setting:1'){
            handleAccountButtonClick()
        }
    };

    const onNewChat = () => {
        console.log('newChat')
        setIsNewChat(true)
        setUserMessages([])
        setResponseMessages([])
        setIsNewChat(true)
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
        }
    ];

    const accounts = [
        {
            label: '',
            key: 'SubMenu',
            icon: <UserOutlined />,
            children: [

                  {
                    label: 'Account',
                    key: 'setting:1',
                  },
                  {
                    label: 'Settings',
                    key: 'setting:2',
                  },
                  {
                    label: 'Other',
                    key: 'setting:3',
                  },
                  {
                    label: 'Logout',
                    key: 'setting:4',
                  },

            ],
          },
    ];

    const chatHistory = [
        {
            label: 'Chat History',
            key: 'SubMenu',
            icon:<HistoryOutlined />,
            children: [

                  {
                    label: (
                        <a onClick={() => handleChatHistoryClick({ key: chatNames[0], index: 0  })}>
                            {chatNames[0]}
                        </a>
                    ),
                    key: 'setting:1',
                  },
                  {
                    label: (
                        <a onClick={() => handleChatHistoryClick({ key: chatNames[1], index: 1  })}>
                            {chatNames[1]}
                        </a>
                    ),
                    key: 'setting:2',
                  },

            ],
          },
    ];
    
    useEffect(() => {
        // updates according to the document choosen
        console.log(typeArray[currentDocuIndex], chatNames[currentChatIndex])
        /**
         * email"a@a.com"
            email_verifie:false
            name:"a@a.com"
            nickname: "a"
            picture:"https://s.gravatar.com/avatar/d10ca8d11301c2f4993ac2279ce4b930?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fa.png"
            sid:"u9UjwWdn-WD8x--CahUpvMD6WEB7tdg8"
            sub: "auth0|64f945e00f1413519a6c863a"
            updated_at2023-12-24T05:50:25.966Z"
         */

        // user.picture has the picture url
    }, [currentDocuIndex, currentChatIndex]);


  if (user){
  return (
    <>
        <Head>
            <title>JotDown</title>
            <meta name="description" content="JotDown - An AI document Assitant." />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" href="/favicon.ico" />
        </Head>

        <div style={{ maxHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#21262d', padding: '10px', overflow: 'auto' }}>
            <div style={{marginTop:'10px', display: 'flex', alignItems: 'center', width: '100%', height:'10vh' }}>
                <h3 style={{ flex: '1', marginRight: '15px', fontSize:'1.2em'}}>JotDown: AI Document Assitant <Tooltip placement="bottom" title={text}>
                        <InfoCircleOutlined />
                    </Tooltip>
                </h3>
                <h2  style={{ color: '#fa7970' }}>Select your Document:</h2>
                <Dropdown
                    menu={{
                    items,
                    selectable: true,
                    defaultSelectedKeys: ['1'],
                    }}
                >
                    <Typography.Link style={{color:'white', marginLeft:'15px'}}>
                    <Space>
                        {dropDown}
                        <DownOutlined />
                    </Space>
                    </Typography.Link>
                </Dropdown>
                <Button onClick={()=>setIsUploadOpen(true)} style={{ backgroundColor: '#fa7970', marginLeft:'15px',marginRight:'15px', border:'black' }}>New Upload</Button>
                <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal" items={accounts} style={{backgroundColor:'transparent', color:'white', marginRight:'15px'}}/>
            </div>

            <div style={{ height:'70vh',display: 'flex', flexDirection: 'column', borderRadius: '10px', backgroundColor: '#36373A', marginTop: '10px', border: '1px solid black', padding: '10px', width: '100%', height: '80vh' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <Tooltip placement="bottom" title={newText}>
                        <PlusCircleOutlined style={{ marginRight: '15px', marginLeft: '15px' }} onClick={onNewChat}/>New Chat
                    </Tooltip>
                    
                    
                    <Menu onClick={onClick} selectedKeys={[current]} mode="vertical" items={chatHistory} style={{ backgroundColor: 'transparent', color: 'white', marginRight: '15px' }} />
                    
                </div>

                <div style={{ overflowY: 'auto', flex: 1, overflowX: 'hidden' }}>

                    {([...userMessages, ...responseMessages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))).map((message, index) => (
                        <div key={index} style={{ textAlign: message.align, marginBottom: '10px', borderBottom: '1px solid #DDDDDD', paddingBottom: '5px', color: '#DDDDDD' }}>
                            {userMessages.includes(message) ? (
                                <span style={{ fontWeight: 'bold', color: '#b1e8fd' }}>User: </span>
                            ) : (
                                <span style={{ fontWeight: 'bold', color: '#2dba4e' }}>AI: </span>
                            )}
                            {message.text}
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', width: '100%',height:'10vh' }}>
            <Input type="text" value={inputText} onChange={handleInputChange} placeholder="Type your message" style={{ backgroundColor: '#a2d2fb', marginBottom: '5px', marginTop: '5px', flex: '1', flexShrink: 0 }} />

                <Button onClick={handleButtonClick} style={{ marginLeft: '10px', backgroundColor: '#7ce38b', border: 'black', fontSize: '1em' }} disabled={isButtonDisabled}>Send</Button>
            </div>

            <h2 style={{ flex: 1, marginLeft: '15px', flexShrink: 0, height:'10vh'}}>Current Chat: {chatNames[currentChatIndex]} | Document: {typeArray[currentDocuIndex]} |</h2>

            
        </div>
        {isUploadOpen && (
                    <UploadModal
                    isContactOpen={isUploadOpen}
                    setIsContactOpen={setIsUploadOpen}
                    hideUploadModal={()=>setIsUploadOpen(false)}
                    />
                )}
    </>
    )

    } else if (isLoading) {
        return <LoadingComponent msg="Loading..." />
    } else if (error) {
        return <p>Error: {error.message}</p>;
    } else {
        // If user is null and there's no error, redirect to login
        router.push('/api/auth/login')
    }
}



export const getServerSideProps = async (context) => {
    try {
        // Fetch data from external API for accesstoken
        const postData = `{"client_id":"${process.env.AUTH0_CLIENT_ID}","client_secret":"${process.env.AUTH0_CLIENT_SECRET}","audience":"${process.env.AUTH0_AUD}","grant_type":"client_credentials"}`
        const headers = {
            'Content-Type': 'application/json',
        }

        const response = await axios.post(process.env.AUTH0_TOKEN, postData, { headers });

        // Extract the data from the response
        const data = response.data;
        const accessToken = data.access_token

        console.log(accessToken)
        
        // Pass data to the page via props
        return { props: { accessToken } };
    } catch (error) {
        // Handle errors, you can log them or customize the response accordingly
        console.error('Error fetching access token:', error.message);

        // You can redirect to an error page or return an error prop
        return {
            props: {
                error: 'error',
            },
        };
    }
}