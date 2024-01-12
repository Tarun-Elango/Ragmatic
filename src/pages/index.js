import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {  UserOutlined, InfoCircleOutlined, PlusCircleOutlined, DoubleLeftOutlined,DoubleRightOutlined, FileAddOutlined } from '@ant-design/icons';
import { Button, Input,Tooltip, Menu,List,Modal } from 'antd';
import { useUser } from '@auth0/nextjs-auth0/client';
import Head from 'next/head'
import LoadingComponent from '../components/LoadingComponent'
import UploadModal from '../components/modals/UploadModal';
import AboutModal from '../components/modals/AboutModal'
import AccountModal from '../components/modals/AccountModal';
import axios from 'axios';

// TODO: 
// change auth0, mongodb, chroma to supabase
// change the header for mobile, MAKE IT SO IT BECOMES COMPACT/rearrage on zoom, use media in global css to figure out the settings
// connect front and back
// retrieve all user documents and chat in usetate, replace the sample arrays
// ui changes when no document or chat, ask user to upload ...., check all edge cases
// about, settings modal
// account page, later on stripe etc
//connect the ai server to the messaging chat
// TODO; when idtoken is expired force user to logout

export default function Home({accessToken}) {
    const token = accessToken
    

    const {user, error, isLoading } = useUser();
    const router = useRouter();
    const [typeArray, setTypeArray] = useState([])
    const [docArray, setDocArray] =useState([])
    var chatNames = ["1. this is what is need", "2. how do i do this"];
    const [inputText, setInputText] = useState('');
    const [userMessages, setUserMessages] = useState([]);
    const [responseMessages, setResponseMessages] = useState([]);

    const [currentDocuIndex, setCurrentDocuIndex] = useState(0) 
    const [currentChatIndex, setCurrentChatIndex] = useState(0)
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [isAboutOpen, setIsAboutOpen] = useState(false)
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
    const [isLeftColumnVisible, setIsLeftColumnVisible] = useState(true);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const text = <span> About</span>;
    const newUpload = <span>Upload new document</span>
    const newText = <span> Create New Chat</span>;

    const showModal = () => {
        setIsModalVisible(true);
    };
    
    const handleSelect = (item) => {
        const index = typeArray.indexOf(item);
        setCurrentDocuIndex(index);
        localStorage.setItem('lastDocIndex', index); // Update local storage
        setIsModalVisible(false); // Close modal on selection
    };
    

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const handleSearchChange = (e) => {
        //setSearchTerm(e.target.value);
        const value = event.target.value;
        setSearchTerm(value);
        const filtered = typeArray.filter(name => name.toLowerCase().includes(value.toLowerCase()));
        setFilteredData(filtered);
    };



    const handleChatBackButtonClick = async () => {
        if(isLeftColumnVisible){
        setIsLeftColumnVisible(false)
        } else {
            setIsLeftColumnVisible(true)
        }
    }
    

    const handleButtonClick = async () => {
        const currentDateTime = new Date().toLocaleString();
        const newMessage = {
            text: inputText,
            timestamp: currentDateTime,
            align: 'right',
        };

        setUserMessages([...userMessages, newMessage]);
        await fetchAiResponse(inputText);
        setInputText('');
    };

    const fetchAiResponse = async (inputText) => {
        try {
            const apiFetch = await fetch('api/health', {
                headers: {
                    'Content-Type':'application/json',
                  'Authorization': `Bearer ${token}`
                }
              });
            const data = await apiFetch.json();
            const responseMessage = {
                text: JSON.stringify(data.message).slice(1, -1),
                timestamp: new Date().toLocaleString(),
                align: 'left',
            };

            setResponseMessages([...responseMessages, responseMessage]);

            // add to users chat 
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
        setIsAccountModalOpen(true)
    }

    const isButtonDisabled = inputText.trim() === '' ;

    const handleMenuClick = ({ key, index }) => {
        // console.log(`Selected item number: ${key}`);
        setCurrentDocuIndex(index)
        console.log('Selected document:', typeArray[index], docArray[index]);
        localStorage.setItem('lastDocIndex', index);
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
        setUserMessages([])
        setResponseMessages([])
    };

    const dynamicItems = typeArray.map((name, index) => ({
        key: String(index + 1),
        label: (
            <a onClick={() => handleMenuClick({ key: name, index })}>
                {name}
            </a>
        ),
    }));

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
                    label: 'Upgrade',
                    key: 'setting:3',
                  },
                  {
                    label: 'Logout',
                    key: 'setting:4',
                  },

            ],
          },
    ];
    
  const fetchUserDocuments = async () => {
    if (!user?.sub) return;

    const requestBody = {
        userRefID: user.sub,
      type: 'fetch',
    };

    try {
      const response = await fetch('http://localhost:3000/api/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const documents = await response.json();
      setDocArray(documents);

      const names = documents.map(doc => doc.docuName.replace(user.sub, ""));
      setTypeArray(names);

      const lastDocIndex = localStorage.getItem('lastDocIndex');
        if (lastDocIndex && documents[lastDocIndex]) {
            setCurrentDocuIndex(parseInt(lastDocIndex, 10));
        }  
    } catch (error) {
      console.error('Failed to fetch user documents:', error);
    }
  };

    const fetchData = async () => {
        try {
          const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'task':'add'
            },
            body: JSON.stringify({
                userId: id,
                chatID: "124",
                pdfId: "DOC1704821974068",
                chatName: "test2",
                userMessage: "Hello, how can I assist you?",
                botMessage: "I'm here to help! What do you need?"
            })
          });
  
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
  
          const messages = await response.json();
          setUserMessages(messages);
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      };
    
    useEffect(() => {
        // get all docs
        fetchUserDocuments();
        // on page refresh load all docs
        // fetch the latest chats for "chosen" documents only and show to user
        // then everytime the docs change fetch that docs chats and show user
        // local storage has the doc most used recently, and its chat will only be priotized
        console.log(typeArray[currentDocuIndex], chatNames[currentChatIndex])
    }, [user]);

    useEffect(() => {
        setFilteredData(typeArray);
      }, [typeArray]);


  if (user){
  return (
    <>
        <Head>
            <title>JotDown</title>
            <meta name="description" content="JotDown - An AI document Assitant." />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" href="/favicon.ico" />
        </Head>

        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#21262d' }}>
        {isLeftColumnVisible && (
            <div style={{ 
                width: '25vh', // Use viewport width to keep width responsive
                display: 'flex', 
                flexDirection: 'column', 
                backgroundColor: '#36373A', 
                padding: '10px',
                height: '100vh', // Subtract padding from the viewport height
                boxSizing: 'border-box', // Include padding and border in the height calculation
                justifyContent: 'space-between',
                fontSize:'0.8em'
            }}>
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center',
                    height: '100%',
                    
                    overflow: 'hidden' // Prevent horizontal overflow
                }}>
                    <Tooltip placement="bottom" title={newText}>
                        <PlusCircleOutlined 
                            style={{ marginRight: '15px', marginLeft: '15px' }} 
                            onClick={onNewChat}
                        />
                        New Chat
                    </Tooltip>
                    
                    <ul style={{ 
                        listStyle: 'none', 
                        padding: '0 1px', // Add horizontal padding if needed, and remove vertical padding
                        overflowY: 'auto', 
                        height: 'calc(100% - 60px)', 
                        marginTop: '10px', // Reduce the top margin if needed
                        overflowX: 'hidden',
                    }}>
                        {chatNames.map((name, index) => (
                            <li key={index} style={{ margin: '5px 0' }}> {/* Reduce vertical margin between list items */}
                                <a 
                                    style={{ 
                                        cursor: 'pointer', 
                                        color: 'white', 
                                        transition: 'color 0.3s',
                                        padding: '2px 10px', // Adjust padding for better spacing control
                                        borderRadius: '5px',
                                        backgroundColor:'#333',
                                        padding: '2px 1px',
                                        display: 'block', // Ensure the anchor tag fills the entire list item for better click area
                                    }} 
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#21262d';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = '#333'; // Set back to initial background color
                                    }}
                                    onClick={() => handleChatHistoryClick({ key: name, index })}
                                >
                                    {name.substring(0, 15)}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {isLeftColumnVisible && (
                <DoubleLeftOutlined style={{ 
                    alignSelf: 'center', 
                    marginBottom: '10px' 
                }} onClick={handleChatBackButtonClick}/>)}
            </div>)}

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column',  overflow: 'auto' }}>

                <div style={{ maxHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#21262d', padding: '10px', overflow: 'auto' }}>
                    <div style={{marginTop:'10px', display: 'flex', alignItems: 'center', width: '100%', height:'5vh' }}>
                        <h3 style={{ flex: '1', marginRight: '15px', fontSize:'1.2em', color:'#fa7970'}}>JotDown<Tooltip placement="bottom" title={text}>
                                <InfoCircleOutlined style={{marginLeft:'15px'}} onClick={()=>setIsAboutOpen(true)}/>
                            </Tooltip>
                        </h3>
                        <Tooltip placement="bottom" title={newUpload}><FileAddOutlined onClick={()=>setIsUploadOpen(true)} style={{marginLeft:'10px'}}/></Tooltip>
                        <Button style={{ backgroundColor: '#fa7970', marginLeft:'15px',marginRight:'15px', border:'black' }} onClick={showModal}>Select document</Button>
                        <Menu onClick={onClick}  mode="horizontal" items={accounts} style={{backgroundColor:'transparent', color:'white', marginRight:'15px'}}/>
                    </div>

                    <div style={{ height:'87vh',display: 'flex', flexDirection: 'column', borderRadius: '10px', backgroundColor: '#36373A', marginTop: '10px', border: '1px solid black', padding: '10px', width: '100%' }}>
                        <div style={{ overflowY: 'auto', flex: 1, overflowX: 'hidden' }}>

                            {([...userMessages, ...responseMessages].sort((a, b) =>  new Date(a.timestamp) - new Date(b.timestamp))).map((message, index) => (
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

                    <div style={{ display: 'flex', alignItems: 'center', width: '100%',height:'8vh' }}>
                        <Input type="text" value={inputText} onChange={handleInputChange} placeholder="Type your message" style={{ backgroundColor: '#a2d2fb', marginBottom: '5px', marginTop: '5px', flex: '1', flexShrink: 0 }} />

                            <Button onClick={handleButtonClick} style={{ marginLeft: '10px', backgroundColor: '#7ce38b', border: 'black', fontSize: '1em' }} disabled={isButtonDisabled}>Send</Button>
                        </div>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', // Center the items horizontally
                            height: '8vh', // Set t
                            padding: '0 10px', // Add some horizontal padding
                            boxSizing: 'border-box' // Include padding in 
                        }}>
                            {!isLeftColumnVisible && (
                            <DoubleRightOutlined style={{ 
                                // Set a fixed width for the icon container to align the text to center
                                position: 'absolute', 
                                left: '20px' 
                            }} onClick={handleChatBackButtonClick}/>
                            )}
                            <h2 style={{ 
                                flex: 1, 
                                textAlign: 'center', // Center the text horizontally
                                margin: 0, // Remove default margin of `h2`
                                color: 'white', // Adjust the color if needed
                                whiteSpace: 'nowrap', // Prevent the text from wrapping
                                overflow: 'hidden', // Hide overflow
                                textOverflow: 'ellipsis' // Add an ellipsis for overflowing text
                            }}>Details : Chat - 
                               <span style={{ color: '#2dba4e' }}> 
                                    {chatNames.length > 0 && chatNames[currentChatIndex] ? ' '+chatNames[currentChatIndex].slice(0, 30)+' ' : ' Start asking '}
                                </span> 
                                | Document - 
                                <span style={{ color: '#2dba4e' }}>
                                    {typeArray.length > 0 && typeArray[currentDocuIndex] ? ' '+typeArray[currentDocuIndex]+' ' : ' Upload any document '}
                                </span>
                            </h2>
                        </div>
                    </div>
            </div>
        </div>
        {isUploadOpen && (
                <UploadModal
                    isContactOpen={isUploadOpen}
                    setIsContactOpen={setIsUploadOpen}
                    hideUploadModal={()=>setIsUploadOpen(false)}
                    />
                )} 
        {isAboutOpen && (
            <AboutModal
                hideAboutModal={() => setIsAboutOpen(false)}
            /> 
        )}
        {isAccountModalOpen && (
            <AccountModal
            hideAccountModal={() => setIsAccountModalOpen(false)}
        />
        )}
        <Modal
            open={isModalVisible}
            title="Choose a document to begin the conversation"
            onCancel={handleCancel}
            footer={[
                <div key="footer-content" style={{ display: 'flex', alignItems: 'center' }}>
                <Button key="back-button" onClick={handleCancel} type="dashed" style={{ backgroundColor: "#fa7970" }}>
                    Back
                </Button>
                </div>
            ]}>
            <Input
                placeholder="Search for an uploaded doc"
                value={searchTerm}
                onChange={handleSearchChange}
            />
            <div style={{ marginTop: '10px' }}>
                {filteredData.length > 0 ? (
                <List
                    size="small"
                    bordered
                    dataSource={filteredData}
                    renderItem={item => (
                    <List.Item
                        style={{ cursor: 'pointer', backgroundColor: item === typeArray[currentDocuIndex] ? '#f0f0f0' : '' }}
                        onClick={() => handleSelect(item)}
                    >
                        {item}
                    </List.Item>
                    )}
                    style={{ maxHeight: '200px', overflow: 'auto' }}
                />
                ) : (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    Please upload a document to start a conversation.
                </div>
                )}
            </div>
            </Modal>

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