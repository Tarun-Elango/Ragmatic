import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {  UserOutlined, InfoCircleOutlined, PlusCircleOutlined, DoubleLeftOutlined,DoubleRightOutlined, FileAddOutlined, DeleteOutlined,WarningOutlined } from '@ant-design/icons';
import { Button, Input,Tooltip, Menu,List,Modal,notification  } from 'antd';
import { useUser } from '@auth0/nextjs-auth0/client';
import Head from 'next/head'
import LoadingComponent from '../components/LoadingComponent'
import UploadModal from '../components/modals/UploadModal';
import AboutModal from '../components/modals/AboutModal'
import AccountModal from '../components/modals/AccountModal';
import axios from 'axios';
import OpaqueLoading from '../components/OpaqueLoading'

// TODO: 
// add token valid to all routes
// add a input formater before ui
// change the css when media > 250% scroll in @ media in global.css
// connect to ai logic
// account page, and connect to stripe etc
// rate limit messages, doc uploaded, and messages sent
// change auth0, mongodb, chroma to supabase
// when users idtoken is expired force user to logout, getsession has it

export default function Home({accessToken}) {
    const openNotification = (message, description) => {
        notification.open({
          message: <span style={{ color: 'red' }}><WarningOutlined />{message}</span>,
          description: description,
          onClick: () => {
            console.log('Notification Clicked!');
          },
        });
      };

    const token = accessToken
    const {user, error, isLoading } = useUser();
    const router = useRouter();
    const [typeArray, setTypeArray] = useState([])
    const [docArray, setDocArray] =useState([])
    const [inputText, setInputText] = useState('');

    const [currentDocuIndex, setCurrentDocuIndex] = useState(0) 
    const [currentChat, setCurrentChat] = useState({ index: null, id: null });

    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [isAboutOpen, setIsAboutOpen] = useState(false)
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
    const [ isDeleteChatModalOpen, setIsDeleteChatModalOpen] =useState(false)
    const [isLeftColumnVisible, setIsLeftColumnVisible] = useState(true);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [ chatArray, setChatArray ] = useState([])
    const [chatIdToDelete, setChatIdToDelete] = useState(null);
    const [ deleteChatMessag, setDeleteChatMessage ] = useState(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [itemToDelete, setItemToDelete] = useState(null);

    const text = <span> About</span>;
    const newUpload = <span>Upload new document</span>

    const showModal = () => {
        setIsModalVisible(true);
        console.log(docArray)
    };
    
    // function to select a new doc
    const handleSelect = (item) => {
        setMessageList([])
        setCurrentChat({ index: null, id: null })
        const index = typeArray.indexOf(item);
        setCurrentDocuIndex(index);
        localStorage.setItem('lastDocIndex', index); // Update local storage
    
        // Fetch chats for the selected document
        const selectedDocument = docArray[index]; // Assuming docArray contains all documents
        fetchChatMessages(user.sub, selectedDocument.docuId); // Replace 'id' with the actual property name for document ID
        setIsModalVisible(false); // Close modal on selection
    };
    

    const handleCancel = () => {
        setIsModalVisible(false);
        setShowDeleteConfirm(false)
        setItemToDelete(null);
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

    const [messageList, setMessageList] = useState([]);

    // to message to current messagelist
    const addMessage = (newMessage, messageType) => {
        const timestamp = new Date().toISOString(); // ISO string format for timestamp
        const messageWithExtraInfo = {
            ...newMessage,
            timestamp,
            type: messageType
        };
    
        setMessageList(prevMessages => [...prevMessages, messageWithExtraInfo]);
    };

    const clearMessageList = () => {
        setMessageList([]);
    };
    
    
    // takes message, type, chatid, and creates a new message doc
    const addMessageMongo = async (message, type, id) =>{ 
        if (!user?.sub) return;
      
        const postData = {
            chatID: id,
            userID: user.sub,
            messageType: type,
            content: message
          };
        try {
            const response = await fetch('api/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(postData)
            });
        
            if (!response.ok) {
              throw new Error('Request failed');
            }
        
            const data = await response.json();
            // if good do nothing
          } catch (error) {
            console.error('Error:', error);
            // Handle errors here
            // cant do much now, when mongo fails
            openNotification(' Failed to store message.');
          }
    }

    // used the current doc selected and creates a new chat 
    const newChatMongo = async () => {
        if (!user?.sub) return;

        let ctName;
        if (inputText.length <= 15) {
            ctName = inputText;
          } else {
            ctName = inputText.substring(0, 15);
          }

        const postData = {
            userID:user.sub,
            document:docArray[currentDocuIndex].docuId,
            chatName:ctName,
          };
        try {
            const response = await fetch('api/chats', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(postData),
            });
      
            if (response.ok) {
              return await response.json();
              // Handle successful response here
            } else {
                throw new Error('Request failed with status: ' + response.status);
            }
          } catch (error) {
            openNotification(' Failed to store newly created Chat.');
            console.error('MongoDB Operation Error:', error);
        return { error: true, message: error.message };
          }

    }

    // function to handle send button 
    const handleButtonClick = async () => {

        let updatedChat = currentChat;
        if (currentChat.index == null || currentChat.id == null) {
            const res = await newChatMongo();
            if (res && !res.error) {
                const updatedArray = [...chatArray, res.data];
                setChatArray(updatedArray);
                updatedChat = { index: updatedArray.length, id: res.data._id };
                setCurrentChat(updatedChat);
            }else {
                // Handle MongoDB operation failure here
                console.error('Failed to create new chat:', res.message);
                // Optionally, display an error message to the user
                return;
            }
        }

        // Ensure this block only runs if updatedChat is valid
        if (updatedChat.id) {
            const currentDateTime = new Date().toLocaleString();
            const newMessage = {
                text: inputText,
                timestamp: currentDateTime,
                align: 'right',
            };
            console.log("current chat updated", updatedChat);
            addMessageMongo(inputText, "userMessage", updatedChat.id);
            addMessage(newMessage, "user");
            await fetchAiResponse(updatedChat.id);
            setInputText('');
        }
    };

    const fetchAiResponse = async (id) => {
        try {
            const openAiData = {
                prompt:"Say - Welcome to the chat in french"
              }
            const apiFetch = await fetch('api/ai', {
                method: 'POST',
                headers: {
                    'Content-Type':'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(openAiData)
              });
            const data = await apiFetch.json();
            const responseMessage = {
                text: JSON.stringify(data).slice(1, -1),
                timestamp: new Date().toLocaleString(),
                align: 'left',
            };

            addMessage(responseMessage, "ai")
            //console.log(responseMessage.text, "botMessage", currentChat.id)
            addMessageMongo(responseMessage.text, "botMessage", id)
            // add to users chat 
        } catch (error) {
            openNotification(' Failed to receive a response.');
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

    const isButtonDisabled = inputText.trim() === '' || docArray.length === 0 || typeArray===0;

    // function to handle chat list and its selection
    const handleChatHistoryClick = async (chatId) => {
        clearMessageList()
        
        // Step 1: Update State
        setCurrentChat({ index: chatArray.findIndex(chat => chat._id === chatId), id: chatId });
        // Step 2: Fetch Chat Content
        try {
            const response = await fetch(`/api/messages?chatID=${chatId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.success) {
                const combinedMessages = [...data.data.userMessages, ...data.data.botMessages];
                combinedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                for (let i = 0; i < combinedMessages.length; i++) {
                   if (combinedMessages[i].messageType == "userMessage"){
                    const uMessage = {
                        text: combinedMessages[i].content,
                        timestamp: combinedMessages[i].createdAt,
                        align: 'right',
                    }
                    addMessage(uMessage, "user");
                   }else{
                    const aMessage = {
                        text: combinedMessages[i].content,
                        timestamp: combinedMessages[i].createdAt,
                        align: 'left',
                    }
                    addMessage(aMessage, "ai");
                   }
                }
            }
        } catch (error) {
            openNotification(' Failed to retrieve chats for selected resource.');
            console.error("Failed to fetch chat history:", error.message);
        }
        
    };
    
    // useEffect hook to log the current chat id when it changes
    useEffect(() => {
        if (currentChat && currentChat.id) {
            console.log("useeffect",currentChat.id);
            // You can also place any other actions here that need to run after currentChat.id updates
        }
    }, [currentChat]); 
      
  
    const onClick = (e) => {
        if (e.key == 'setting:4'){
            handleBackButtonClick()
        }
        if (e.key == 'setting:1'){
            handleAccountButtonClick()
        }
    };

    const onNewChat = () => {
        setMessageList([])
        currentChat.index = null
    };

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
    
    useEffect(() => {
        // Step 1: Load User Documents
        if (user?.sub) {
          fetchUserDocuments();
        }
    }, [user]);
      
    useEffect(() => {
        // Step 3: Set Filtered Data
        setFilteredData(typeArray);
    }, [typeArray]);
      
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
      
          // Step 2: Load Chat Messages for Current Document
          const lastDocIndex = localStorage.getItem('lastDocIndex');
          if (lastDocIndex && documents[lastDocIndex]) {
            setCurrentDocuIndex(parseInt(lastDocIndex, 10));
            const currentDocument = documents[lastDocIndex];
            fetchChatMessages(user.sub, currentDocument.docuId);
          }

          
        } catch (error) {
            //TODO: handle this better
          console.error('Failed to fetch user documents:', error);
        }
    };
      
      
    function customEncodeURI(str) {
    // A basic example that encodes everything except the pipe character '|'
        return str.replace(/[^A-Za-z0-9\-_.!~*'()|]/g, function(c) {
         return '%' + c.charCodeAt(0).toString(16);
        });
    }


    const handleDeleteChatCancel = ()=>{
        setDeleteChatMessage(null)
        setChatIdToDelete(null)
        setIsDeleteChatModalOpen(false) //close modal
    }


    const deletchat = (id)=>{
        setChatIdToDelete(id)
        setIsDeleteChatModalOpen(true) //open modal
       
    }

    const handleDeleteChatYes =async () =>{
        
        // delete the chat onpressing yes
        try {
            const response = await fetch(`/api/chats?chatId=${chatIdToDelete}`, {
              method: 'DELETE',
              headers: {
                // Add any necessary headers here
                'Content-Type': 'application/json'
              },
            });
        
            const data = await response.json();
    
            if (response.ok) {
                // if successful
                setCurrentChat({ index: null, id: null }) // set the current chat to null
                setMessageList([]) // set the message list to null to clear any chat
                // update the chatarray, remove the chat object with the deleted chat id
                const updatedChatArray = chatArray.filter(chat => chat._id !== chatIdToDelete);
                setChatArray(updatedChatArray);

                // Additional logic on successful deletion
                setChatIdToDelete(null);// set id to null, to refresh the delete const
                setDeleteChatMessage("chat deleted") // set delete message
            } else {
              console.error('Failed to delete chat:', data.message);
              // Handle the error response here
              setDeleteChatMessage("chat wasn't deleted, try again later")
            }
          } catch (error) {
            openNotification(' Failed to delete this chat.');
            console.error('Error during fetch:', error.message);
            // Handle the fetch error here
          }    
    }

    useEffect(() => {
    }, [chatIdToDelete]);
    
    useEffect(() => {
    }, [typeArray]);
    
    const fetchChatMessages = async (userId, pdfId) => {
        try {
          const response = await fetch(`/api/chats?userID=${customEncodeURI(userId)}&document=${customEncodeURI(pdfId)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
      
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
      
          const chatMessages = await response.json();
         // console.log('Chat Messages:', chatMessages); // Log the chat response
      
          if (Array.isArray(chatMessages.data)) {
            setChatArray(chatMessages.data); // Set chatArray with the data field
          } else {
            console.error('Data is not an array:', chatMessages.data);
            setChatArray([]); // Reset to empty array if data is not an array
          }
      
        } catch (error) {
            openNotification(' Failed to retrieve chat messages.');
          console.error('Failed to fetch chat messages:', error);
          setChatArray([]); // Reset to empty array in case of error
        }
    };

    const [isManualLoading, setManualLoading] = useState(false);


    const refreshDocuments = () => {
        fetchUserDocuments();
    };

    const deleteResource = (item, event) => {
        event.stopPropagation(); // Prevents the List.Item onClick from being triggered
        console.log("Delete resource:", item);
        setShowDeleteConfirm(true);
        setItemToDelete(item);
      };
    
    const confirmDelete = async () => {
        if (!user?.sub) return;
        setManualLoading(true)
        // Add your delete logic here using itemToDelete
        console.log("Confirm delete:", itemToDelete);
        // call the endpointwith id, and name
        const deleteIndex = typeArray.indexOf(itemToDelete);
        console.log(docArray[deleteIndex])
        const deleteid = docArray[deleteIndex].docuId
        const deleteName = docArray[deleteIndex].docuName
        const body = JSON.stringify({ docId:deleteid, docName:deleteName });
        try {
            const response = await fetch('api/document', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
              body: body
            });
        
            const data = await response.json();
        
            if (response.ok) {
              console.log('Success:', data);
            } else {
              console.error('Error:', data.message);
            }
          } catch (error) {
            openNotification('Resource could not be deleted.')
            console.error('Fetch error:', error.message);
          }

        //remove from typearray, and docarray
        refreshDocuments();
        if (deleteIndex !== -1) {
            typeArray.splice(deleteIndex, 1);
          }
          setMessageList([])
        fetchChatMessages(user?.sub, deleteid)
        // Hide the confirmation message and reset itemToDelete
        setShowDeleteConfirm(false);
        setItemToDelete(null);
        setManualLoading(false)
    };
    const deselectDelete =()=>{
        setShowDeleteConfirm(false);
        setItemToDelete(null);
    }

  if (user){
  return (
    <>
        <Head>
            <title>JotDown</title>
            <meta name="description" content="JotDown - An AI document Assitant." />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" href="/favicon.ico" />
        </Head>

        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#21262d'}}>
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
                            <PlusCircleOutlined 
                                style={{ display:'flex', flexDirection:'column', justifyContent:'center'}} 

                                onClick={onNewChat}
                            />
                        <ul style={{ 
                                listStyle: 'none', 
                                padding: '0 1px',
                                overflowY: 'auto', 
                                height: 'calc(100% - 60px)', 
                                marginTop: '10px', 
                                overflowX: 'hidden',
                            }}>
                                {Array.isArray(chatArray) && chatArray.map((chat, index) => (
                                    <li key={chat._id} style={{ margin: '5px 0' }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            backgroundColor: '#333',
                                            borderRadius: '5px',
                                            padding: '2px 10px',
                                        }}>
                                            <a 
                                                style={{ 
                                                    flex: 1, // makes the link expand to take available space
                                                    cursor: 'pointer', 
                                                    color: 'white',
                                                    textDecoration: 'none',
                                                    padding: '2px 10px',
                                                    borderRadius: '5px',
                                                    transition: 'background-color 0.3s',
                                                }} 
                                                onMouseEnter={(e) => e.target.style.backgroundColor = '#21262d'}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = '#333'}
                                                onClick={() => handleChatHistoryClick(chat._id)}
                                                title={chat.chatName} // Shows the full name on hover
                                            >
                                                {chat.chatName.substring(0, 15)}
                                            </a>
                                            <div 
                                                onClick={() => deletchat(chat._id)}
                                                style={{
                                                    padding: '1px 2px',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.3s',
                                                }}
                                                onMouseEnter={(e) => e.target.style.backgroundColor = '#21262d'}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = '#333'}
                                            >
                                                <DeleteOutlined style={{ color: 'white' }}/>
                                            </div>
                                        </div>
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
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column',  overflow: 'hidden' }}>

                <div style={{ maxHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#21262d', padding: '10px', overflow: 'auto' }}>
                    <div style={{marginTop:'10px', display: 'flex', alignItems: 'center', width: '100%', height:'5vh' }}>
                        <h3 style={{ flex: '1', marginRight: '15px', fontSize:'1.2em', color:'#fa7970'}}>JotDown<Tooltip placement="bottom" title={text}>
                                <InfoCircleOutlined style={{marginLeft:'15px'}} onClick={()=>setIsAboutOpen(true)}/>
                            </Tooltip>
                        </h3>
                        <Tooltip placement="bottom" title={newUpload}><FileAddOutlined onClick={()=>setIsUploadOpen(true)} style={{marginLeft:'10px'}}/></Tooltip>
                        <Button style={{ backgroundColor: '#fa7970', marginLeft:'15px',marginRight:'15px', border:'black' }} onClick={showModal}>Manage Resource</Button>
                        <Menu onClick={onClick}  mode="horizontal" items={accounts} style={{backgroundColor:'transparent', color:'white', marginRight:'15px'}}/>
                    </div>

                    <div style={{
                        height: '75vh',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '10px',
                        backgroundColor: '#36373A',
                        marginTop: '10px',
                        border: '1px solid black',
                        padding: '8px',
                        width: '100%',
                        boxSizing: 'border-box', // Include padding in the width calculation
                        marginRight: '0px' // Adjust based on scrollbar width
                    }}>
                        <div style={{
                            overflowY: 'auto', // Show scrollbar only when needed
                            flex: 1,
                            overflowX: 'hidden',
                            paddingRight: '15px' // Adjust padding to offset scrollbar width
                        }}>

                            {messageList.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).map((message, index) => {
                                const isUserMessage = message.type === 'user'; // Determine side based on type
                                const messageSide = isUserMessage ? 'right' : 'left';
                                const senderLabel = isUserMessage ? 'User' : 'AI';
                                const senderColor = isUserMessage ? '#f0f0f0' : 'white';

                                return (
                                    <div key={index} style={{ textAlign: messageSide }}>
                                        <div style={{
                                            color: senderColor,
                                            fontWeight: 'bold',
                                            marginBottom: '5px',
                                        }}>
                                            {senderLabel}:
                                        </div>
                                        <div style={{
                                            backgroundColor: isUserMessage ? '#f0f0f0' : '#24292e',
                                            color: isUserMessage ? 'black' : 'white',
                                            textAlign: 'left',
                                            padding: '10px',
                                            borderRadius: '10px',
                                            display: 'inline-block',
                                            maxWidth: '80%',
                                            marginLeft: isUserMessage ? '20%' : '0',
                                            marginRight: isUserMessage ? '0' : '20%',
                                        }}>
                                            {message.text}
                                        </div>
                                    </div>
                                );
                            })}
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
                                left: '12px'
                            }} onClick={handleChatBackButtonClick}/>
                            )}
                            <h2 style={{ 
                                flex: 1, 
                                textAlign: 'center', // Center the text horizontally
                                marginLeft: 0, // Remove default margin of `h2`
                                color: 'white', // Adjust the color if needed
                                whiteSpace: 'nowrap', // Prevent the text from wrapping
                                overflow: 'hidden', // Hide overflow
                                textOverflow: 'ellipsis' // Add an ellipsis for overflowing text
                            }}>Details : Chat - 
                               <span style={{ color: '#2dba4e' }}> 
                                    {chatArray.length > 0 && currentChat.index !== null && chatArray[currentChat.index] 
                                        ? ' ' + chatArray[currentChat.index].chatName.slice(0, 30) + ' ' 
                                        : ' Start asking '}
                                </span>              | Document - 
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
                    onUploadSuccess={refreshDocuments}
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
            open={isDeleteChatModalOpen} 
            title="Are you sure you want to delete this chat"  onCancel={handleDeleteChatCancel}
            footer={[
                <div key="footer-content" style={{ display: 'flex', alignItems: 'center' }}>
                <Button key="back-button" onClick={handleDeleteChatCancel} type="dashed">
                    Back
                </Button>
                {
                deleteChatMessag === null && (
                    <Button key="yes-button" onClick={handleDeleteChatYes} type="dashed">
                    Yes
                    </Button>
                )
                }
            </div> 
            ]}>
                {deleteChatMessag}
    </Modal>
    <Modal
      open={isModalVisible}
      title="Choose a Resource to begin the conversation"
      onCancel={handleCancel}
      footer={[
        <Button key="back-button" onClick={handleCancel} type="dashed" style={{ backgroundColor: "#fa7970" }}>
          Back
        </Button>
      ]}
    >
        <OpaqueLoading isShowing={isManualLoading} />
      <Input
        placeholder="Search for an uploaded resource"
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
                <DeleteOutlined
                  style={{ color: 'red', float: 'right', cursor: 'pointer' }}
                  onClick={(e) => deleteResource(item, e)}
                />
              </List.Item>
            )}
            style={{ maxHeight: '200px', overflow: 'auto' }}
          />
        ) : (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            Please upload a resource to start a conversation.
          </div>
        )}
        {showDeleteConfirm && (
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
            <h2>Are you sure you want to delete selected item</h2>
            <Button style={{ backgroundColor: 'red', marginLeft: '10px' }} onClick={confirmDelete}>
              Yes
            </Button>
            <Button style={{ backgroundColor: 'green', marginLeft: '10px'}} onClick={deselectDelete}>
              No
            </Button>
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