import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {  UserOutlined, InfoCircleOutlined, PlusCircleOutlined, DoubleLeftOutlined,DoubleRightOutlined, RocketOutlined, DeleteOutlined,WarningOutlined,SearchOutlined, CalculatorOutlined, PictureOutlined ,CloudUploadOutlined } from '@ant-design/icons';
import { Button, Input,Tooltip, Menu,List,Modal,notification, Switch  } from 'antd';
import { useUser } from '@auth0/nextjs-auth0/client';
import Head from 'next/head'
import LoadingComponent from '../components/LoadingComponent'
import UploadModal from '../components/modals/UploadModal';
import AboutModal from '../components/modals/AboutModal'
import AccountModal from '../components/modals/AccountModal';
import UpgradeModal from '../components/modals/UpgradeModal';
import axios from 'axios';
import OpaqueLoading from '../components/OpaqueLoading'
import ChatLoading from '../components/ChatLoading'
import Guest from './guest'
import io from 'socket.io-client';
import styles from '../styles/home.module.css'

export default function Home({accessToken}) {

  // This module is used to display a notifi
  const openNotification = (message, description) => {
      notification.open({
        message: <span style={{ color: 'red' }}><WarningOutlined />{message}</span>,
        description: description,
        onClick: () => {
          console.log('Notification Clicked!');
        },
      });
    };

    
  const { TextArea } = Input;

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
  const newUpload = <span>Upload new Resource</span>
  const openChat = <span>Open ChatBar</span>
  const closeChat = <span>Close ChatBar</span>
  const Vanilla = <span>Vanilla Mode: Ignore the resource and use plain AI.</span>
  const search = <span>Search Mode: Use web search for additional power.</span>
  const calculator = <span>Calculator Mode: Use a calculator to reliably perform math.</span>
  const dalle = <span>Produce an image (based on provided resource). Max 2images/resource/day</span>
  const rocket = <span>Rocket mode: Harness all resources to answer your query 10 per day</span>
  const [isSearchActive, setSearchActive] = useState(false);
  const [isCalculatorActive, setCalculatorActive] = useState(false);
  const [isVanillaMode, setIsVanillaMode] = useState(false);

  const vanillaMode = async () => {
    setIsVanillaMode(prevIsVanillaMode => {
      const newState = !prevIsVanillaMode;
      console.log(`vanilla mode ${newState ? 'on' : 'off'}`);
      return newState;
    });
  };
  
  // Function to toggle search icon active state
  const toggleSearch = () => {
    setSearchActive(prevIsSearchMode => {
      const newSState = !prevIsSearchMode;
      console.log(`Search mode ${newSState ? 'on' : 'off'}`);
      return newSState;
    });
  };

  // Function to toggle calculator icon active state
  const toggleCalculator = () => {
    setCalculatorActive(prevIsCalcMode => {
      const newCState = !prevIsCalcMode;
      console.log(`calculator mode ${newCState ? 'on' : 'off'}`);
      return newCState;
    });
  };


  const showModal = () => {
      setIsModalVisible(true);
      //console.log(docArray)
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
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(postData)
          });
      
          if (!response.ok) {
            throw new Error('Request failed');
          }
      
          const data = await response.json();
          //console.log(data)
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
        }

      try {
          const response = await fetch('api/chats', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
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
      // for empty messagelist
      if (currentChat.index == null || currentChat.id == null) {
        //create a new chat
          const res = await newChatMongo();
          if (res && !res.error) {
              // update chat arraya and current chat value
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

      // this block runs when there is already a current chat
      if (updatedChat.id) {
        // get all the past vectors for current chat

          const currentDateTime = new Date().toLocaleString();
          const newMessage = {
              text: inputText,
              timestamp: currentDateTime,
              align: 'right',
          };
          //console.log("current chat updated", updatedChat);
          // add new message to mongo
          addMessageMongo(inputText, "userMessage", updatedChat.id);

          //add message to message list
          addMessage(newMessage, "user");
          setInputText('');
          // get the ai response, which handles ai message insertion to message list
          await fetchAiResponse(updatedChat.id);   
      }

      // take the user+ai message send to api with chatid
  };

  function formatOpenAiResponse(responseText) {
    // Replace escaped double quotes with the desired format
    let formattedText = responseText.replace(/\\"/g, '"');

    // Replace line breaks with <br> tags
    formattedText = formattedText.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');

    // Regular expression to identify URLs
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi;

    // Replace URLs with clickable links
    formattedText = formattedText.replace(urlRegex, function(url) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #4A90E2;">${url}</a>`;
    });

    return formattedText;
  }

  // for the html component
  const FormattedMessage = ({ text }) => {
    return <div dangerouslySetInnerHTML={{ __html: text }}></div>;
  };

  const postAiSupabase =async (responseMessage,id)=>{
    // send to supabase the user query and the response. for vector storage
   // after the users query has been answered sucessfully
   const combinedString = inputText+ responseMessage.text // the most recent user+ai message combo
   //console.log(combinedString)
   // call the api with chatid and combined string
   const storePastMessage={
     chatId:id,
     combinedMessage:combinedString
   }
   try {
     const responseSupaStore = await fetch(`/api/chatVector`, {
       method: 'POST',
       headers: {
           'Content-Type':'application/json',
           'Authorization': `Bearer ${token}`
       },
       body: JSON.stringify(storePastMessage)
     })
     if (!responseSupaStore.ok) {
         throw new Error(`HTTP error! status: ${responseSupaStore.status}`);
     }
     const checkIfMessageStored =  await responseSupaStore.json();
   //console.log(checkIfMessageStored)// has the most relevant past message
   } catch (error) {console.log('could not receive past message')}
 }

  const [isAiLoading, setIsAiLoading]= useState(false)
  const [socket, setSocket] = useState(null);

  const fetchAiResponse = async (id) => {
    let responseMessage =""
    
    let supabasePastRetreive = ""
    if(messageList.length >0){
      // retreive past relevant message
      const getPastMessage={
        chatId:id,
        userQuery:inputText
      }
      try {
        const responseSupaGet = await fetch(`/api/chatVector`, {
          method: 'POST',
          headers: {
              'Content-Type':'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(getPastMessage)
        })
        if (!responseSupaGet.ok) {
            throw new Error(`HTTP error! status: ${responseSupaGet.status}`);
        }
        supabasePastRetreive = await responseSupaGet.json();
        
      } catch (error) {console.log('could not receive past message')}
    }

    setIsAiLoading(true)
    let dataPmt = ""

    // get the complete prompt
      try {
        if (!isVanillaMode){
          const openAiData = {
            prompt:inputText,
            docId: docArray[currentDocuIndex].docuId,
            docName: docArray[currentDocuIndex].docuName,
            pMessage: supabasePastRetreive.length === 0 ? "none" : supabasePastRetreive.message,
          }
          const apiFetch = await fetch('api/ai', {
              method: 'POST',
              headers: {
                  'Content-Type':'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(openAiData)
            });
          dataPmt = await apiFetch.json(); // has the pmt
        } else {
          dataPmt = `- User Query: ${inputText}.-previousRelevantMessage:${supabasePastRetreive.message}.- Instruction to LLM: - Respond to user query. - Think step by step before answering. - Keep the response concise, within 200 words. - Refer to the previous relevant message only for context, and if no such message is found, ignore previous relevant message.`
        }

        // get the response from open ai using sockets
        let currentAIMessage = ""
        const timestp = new Date().toISOString
        const initalMes = {
          text: currentAIMessage,
          timestamp:timestp,
          align:'left',  
        }

        const initialEmpty = {
          ...initalMes,
          timestp,
          type: "ai"
        };

        setMessageList((prevMessages)=>[...prevMessages, initialEmpty]) 
        //---------------------------------------------------------------- socket start ------------------------------------------------------------
        if (!socket) { // Check if the socket is not already connected
          // create a new connection, with token
          const newSocket = io(process.env.SOCKETURL,{
            query:{acctoken:token}
          });
            
          newSocket.on('error', (data) => {

            // add the error to the message list
            setMessageList((prevMessages) => {
            
              currentAIMessage  = currentAIMessage+ data.data
              const lastString =  prevMessages[prevMessages.length - 1] ;
              const updatedLastString = lastString.text + data.data;
              return [...prevMessages.slice(0, prevMessages.length - 1),
                {...lastString, text:updatedLastString}];

            });

            // finsish the message processing 
            setIsAiLoading(false)
            openNotification('Invalid token, please login again')
            console.log('Disconnected by the server');
            setSocket(null);
            // shut off the socket
            newSocket.close()
            //newSocket.emit('trigger_disconnect') //way to tell the server to disconnect
            // router.push('/api/auth/logout')
          })

          newSocket.on('message', (data) => {
    
            // add messsage, weird way, hence be careful
            setMessageList((prevMessages) => {
              currentAIMessage  = currentAIMessage+ data.data
              const lastString =  prevMessages[prevMessages.length - 1] ;
              const updatedLastString = lastString.text + data.data;
              return [...prevMessages.slice(0, prevMessages.length - 1),
                {...lastString, text:updatedLastString}];
            });

            console.log('message received')
          });
        
          newSocket.on('disconnect', async () => {
            // on disconnect

            // retrieve the last complete message
            setMessageList((prevMessages) => {
              const lastMessage = prevMessages[prevMessages.length - 1];
              //console.log(lastMessage.text); // Print the entire previous message
              
              // call mongo store function
              responseMessage = {
                text:lastMessage.text,
                timestamp: new Date().toLocaleString(),
                align: 'left',
              };

              //addMessage(responseMessage, "ai")
              //console.log(responseMessage.text, "botMessage", currentChat.id)
              // add to users chat 
              addMessageMongo(responseMessage.text, "botMessage", id)
              
              // add the current user+ai to supabase
              postAiSupabase(responseMessage, id)
              //newSocket.off('disconnect'); // Remove the disconnect event listener after it has been executed once
              newSocket.close()

              return prevMessages; // Return the previous messages without modification
            });

            // finish the message retireval process on the ui
            setIsAiLoading(false)
            console.log('Disconnected by the server');
            setSocket(null); // Reset the socket state to allow reconnection
          });
          
          // set the socket connection
          setSocket(newSocket);

          //start the socket connection
          newSocket.emit('start', dataPmt);
          console.log('Started');
        }
        //---------------------------------------------------------------- socket end ------------------------------------------------------------
        // const formattedResponse = formatOpenAiResponse(JSON.stringify(data).slice(1, -1));
      } catch (error) {
        setIsAiLoading(false)
          openNotification(' Failed to receive a response.');
          console.error('Error fetching response:', error);
      }
  };


  const handleStopButtonClick = async () => { 
    
    if (socket) {
      //finish the message retireval on ui
      setIsAiLoading(false)
      //console.log(messages)

      //stop the socket from client
      socket.disconnect(); //way to 
      console.log('Connection manually closed');
      setSocket(null); // Reset the socket state after disconnection

      // save mongo
      // save supabase post ai

      // setMessageList((prevMessages) => {
      //   const lastMessage = prevMessages[prevMessages.length - 1];
      //   //console.log(lastMessage.text); // Print the entire previous message
        
      //   // call mongo store function
      //   responseMessage = {
      //     text:lastMessage.text,
      //     timestamp: new Date().toLocaleString(),
      //     align: 'left',
      //   };

      //   //addMessage(responseMessage, "ai")
      //   //console.log(responseMessage.text, "botMessage", currentChat.id)
      //   // add to users chat 
      //   addMessageMongo(responseMessage.text, "botMessage", id)
        
      //   // add the current user+ai to supabase
      //   postAiSupabase(responseMessage, id)
      //   newSocket.off('disconnect'); // Remove the disconnect event listener after it has been executed once

      //   return prevMessages; // Return the previous messages without modification
      // });
    }
  }

  const handleInputChangeTextArea = (e) => {
      setInputText(e.target.value);
  };

  const handleBackButtonClick = () => {
      router.push('/api/auth/logout');
  };

  const handleAccountButtonClick = () => {
      setIsAccountModalOpen(true)
  }

  const isButtonDisabled = inputText.trim() === '' || docArray.length === 0 || typeArray===0 || isAiLoading

  // function to handle chat list and its selection
  const handleChatHistoryClick = async (chatId) => {
    // when we select a new chat
      clearMessageList()
      
      // Step 1: Update State
      setCurrentChat({ index: chatArray.findIndex(chat => chat._id === chatId), id: chatId });
      // Step 2: Fetch Chat Content
      try {
          const response = await fetch(`/api/messages?chatID=${chatId}`, {
            method: 'GET',
            headers: {
                'Content-Type':'application/json',
              'Authorization': `Bearer ${token}`
            }
          })
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          if (data.success) {
            // create the message list for exsiting chat, which has been selected
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
    


  //   // useEffect hook to log the current chat id when it changes
  // useEffect(() => {
  //     if (currentChat && currentChat.id) {
  //        // console.log("useeffect",currentChat.id);
  //         // You can also place any other actions here that need to run after currentChat.id updates
  //     }
  // }, [currentChat]); 
      
  
  const onClick = (e) => {
      if (e.key == 'setting:3'){
          handleBackButtonClick()
      }
      if (e.key == 'setting:1'){
          handleAccountButtonClick()
      }
      if (e.key == 'setting:2'){
        setIsUpgradeOpen(true)
    }
  };

  const onNewChat = () => {
      setMessageList([])
      currentChat.index = null
      currentChat.id = null
  };

  const accounts = [
      {
          label: '',
          key: 'SubMenu',
          icon: <UserOutlined />,
          children: [

                {
                  label: 'Account & Settings',
                  key: 'setting:1',
                },
                {
                  label: 'Upgrade ⚡⚡',
                  key: 'setting:2',
                },
                {
                  label: 'Logout',
                  key: 'setting:3',
                },
                {
                  label: 'Contact us',
                  key: 'setting:4',
                },
          ],
        },
  ];
    
  useEffect(() => {
      // Step 3: Set Filtered Data, for the resource list
      setFilteredData(typeArray);
  }, [typeArray]);

    // // update typearray, contains the docs name, doc array contains the doc objects
    // useEffect(() => {
    // }, [typeArray]);
      

  const [fetchingDocs, setFetchingDocs] = useState(false)
  const fetchUserDocuments = async () => {
      if (!user?.sub) return;
    
      setFetchingDocs(true)
      const requestBody = {
        userRefID: user.sub,
        type: 'fetch',
      };
    
      try {
        const response = await fetch('/api/document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` },
          body: JSON.stringify(requestBody),
        });
    
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
    
        const documents = await response.json();
        if (documents.message=='Empty List'){
          // empty list returned
          setIsUploadOpen(true) 
          return
        }else{
          //not empty list returned
          setDocArray(documents);
          const names = documents.map(doc => doc.docuName.replace(user.sub, ""));
          setTypeArray(names);
  
          
          const lastDocIndex = localStorage.getItem('lastDocIndex');
          if (lastDocIndex && documents[lastDocIndex]) {
            // use local storage
            setCurrentDocuIndex(parseInt(lastDocIndex, 10));
            const currentDocument = documents[lastDocIndex];
            fetchChatMessages(user.sub, currentDocument.docuId);
          } else{
            // not empty list returned, but no localstorage
            setCurrentDocuIndex(0)
            const currentDocument = documents[0];
            fetchChatMessages(user.sub, currentDocument.docuId);
          }
  
          setFetchingDocs(false)
        }
       
        
      } catch (error) {
          //TODO: handle this better
        console.error('Failed to fetch user documents:', error);
        setFetchingDocs(false)
      }
      setFetchingDocs(false)
  };
         
  useEffect(() => {
    // Step 1: Load User Documents, on page refresh
    if (user?.sub) {
      fetchUserDocuments();
    }
  }, [user]);

  function customEncodeURI(str) { // used in fetch chat messages
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
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
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

  // update when chat has been deleted from the list
  useEffect(() => {
  }, [chatIdToDelete]);
  

  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false)


  const fetchChatMessages = async (userId, pdfId) => {
    setChatArray([])
      try {
        const response = await fetch(`/api/chats?userID=${customEncodeURI(userId)}&document=${customEncodeURI(pdfId)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` }
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
      //console.log("Delete resource:", item);
      setShowDeleteConfirm(true);
      setItemToDelete(item);
  };
    
  const confirmDelete = async () => {
      if (!user?.sub) return;
      setManualLoading(true)
      // Add your delete logic here using itemToDelete
      // call the endpointwith id, and name
      const deleteIndex = typeArray.indexOf(itemToDelete);
      const deleteid = docArray[deleteIndex].docuId
      const deleteName = docArray[deleteIndex].docuName
      const body = JSON.stringify({ docId:deleteid, docName:deleteName });
      try {
          const response = await fetch('api/document', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: body
          });
      
          const data = await response.json();
      
          if (response.ok) {
            //console.log('Success:', data);
          } else {
            console.error('Error:', data.message);
          }
        } catch (error) {
          openNotification('Resource could not be deleted.')
          console.error('Fetch error:', error.message);
        }
      localStorage.setItem('lastDocIndex', 0)
      //remove from typearray, and docarray
      refreshDocuments();
      if (deleteIndex !== -1) {
          typeArray.splice(deleteIndex, 1);
          docArray.splice(deleteIndex,1)
        }
      setMessageList([])
      fetchChatMessages(user?.sub, docArray[0].docuId)

      setCurrentChat({ index: null, id: null })      
      

      // Hide the confirmation message and reset itemToDelete
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      setManualLoading(false)
  };
  
  const deselectDelete =()=>{
      setShowDeleteConfirm(false);
      setItemToDelete(null);
  }

  const [textAreaRows, setTextAreaRows] = useState(2);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 800) {
        setTextAreaRows(1);
      } else {
        setTextAreaRows(2);
      }
    }
    // Set the initial rows value based on current window size
    handleResize();
    // Add event listener for window resize
    window.addEventListener('resize', handleResize);
    // Cleanup the event listener
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  if (user){
  return (
    <>
      <Head>
          <title>JotDownAI</title>
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
                          style={{ display:'flex', flexDirection:'column', justifyContent:'center', fontSize:'1.5em'}} 

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
                        { fetchingDocs ? <ChatLoading/>: <>
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
                                      {chat.chatName.substring(0, 14)}
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
                        </>
                      }
                  </ul>
              </div>
              
              <h2  style={{alignSelf: 'center', marginBottom:'10px'}}><a className={styles.hoverPro} onClick={()=>setIsUpgradeOpen(true)}>  Try Pro </a></h2>
            
          {isLeftColumnVisible && (
            
          <DoubleLeftOutlined style={{alignSelf: 'center', marginBottom: '15px'}} onClick={handleChatBackButtonClick}/> 
         )}
        </div>)}

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column',  overflow: 'hidden' }}>
            <div style={{ maxHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#21262d', padding: '10px', overflow: 'auto' }}>
              <div style={{marginTop:'10px', display: 'flex', alignItems: 'center', width: '100%', height:'7.5vh' }}>
                  <h3 style={{ flex: '1', marginRight: '15px', fontSize:'1.2em', color:'#fa7970'}}>JotDownAI<Tooltip placement="bottom" title={text}>
                          <InfoCircleOutlined style={{marginLeft:'15px'}} onClick={()=>setIsAboutOpen(true)}/>
                      </Tooltip>
                  </h3>
                  <Tooltip placement="bottom" title={newUpload}><CloudUploadOutlined onClick={()=>setIsUploadOpen(true)} style={{marginLeft:'10px', fontSize:'25px'}}/></Tooltip>
                  <Button style={{ backgroundColor: '#fa7970', marginLeft:'15px',marginRight:'15px', border:'black' }} onClick={showModal}>Manage Resource</Button>
                  <Menu onClick={onClick}  mode="horizontal" items={accounts} style={{backgroundColor:'transparent', color:'white', marginRight:'15px'}} selectedKeys={[null]}/>
              </div>

              <div style={{
                  height: '70vh',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '10px',
                  backgroundColor: '#36373A',
                  marginTop: '15px',
                  border: '1px solid black',
                  padding: '8px',
                  width: '100%',
                  boxSizing: 'border-box',
                  marginRight: '0px'
                }}>
                  {/* Icon Row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center', // Align items vertically
                    marginBottom: '10px', // Space between icons and message area
                    paddingLeft: '10px' // Padding to the left of the icons
                  }}>
                    <Tooltip placement="bottom" title={Vanilla}>
                    <Switch
                      onClick={vanillaMode}
                      style={{marginRight:'20px'}}
                    />
                    </Tooltip>
                    <Tooltip placement="bottom" title={search}>
                    <SearchOutlined
                      onClick={toggleSearch}
                      style={{
                        marginRight: '35px',
                        color: isSearchActive ? 'red' : 'inherit', // Change color when active
                        cursor: 'pointer'
                      }}
                    />
                  </Tooltip>
                  <Tooltip placement="bottom" title={calculator}>
                    <CalculatorOutlined
                      onClick={toggleCalculator}
                      style={{
                        marginRight: '35px',
                        color: isCalculatorActive ? 'red' : 'inherit', // Change color when active
                        cursor: 'pointer'
                      }}
                    />
                  </Tooltip>
                  <Tooltip placement="bottom" title={dalle}>
                  <PictureOutlined style={{
                        marginRight: '35px',
                        color: isCalculatorActive ? 'red' : 'inherit', // Change color when active
                        cursor: 'pointer'
                      }} />
                  </Tooltip>
                  <Tooltip placement="bottom" title={rocket}>
                  <RocketOutlined style={{
                        marginRight: '35px',
                        color: isCalculatorActive ? 'red' : 'inherit', // Change color when active
                        cursor: 'pointer'
                      }} />
                  </Tooltip>

                  </div>

                  {/* Messages Container */}
                  <div style={{
                    overflowY: 'auto',
                    flex: 1,
                    overflowX: 'hidden',
                    paddingRight: '15px'
                  }}>
                    {messageList.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).map((message, index) => {
                      const isUserMessage = message.type === 'user';
                      const messageSide = isUserMessage ? 'right' : 'left';
                      const senderLabel = isUserMessage ? 'User' : 'AI';
                      const senderColor = isUserMessage ? '#f0f0f0' : 'white';

                      // Check if the sender is AI and apply the formatting function
                      let messageText = senderLabel === 'AI' ? formatOpenAiResponse(message.text) : message.text;

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
                            wordBreak: 'break-word'
                          }} >  
                            <FormattedMessage text={messageText} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '12.5vh' }}>

                  <TextArea
                    value={inputText}
                    onChange={handleInputChangeTextArea}
                    placeholder="Start asking"
                    className="custom-placeholder"
                    style={{
                      height: '12.5vh',
                      backgroundColor: '#36373A',
                      color: '#FFFFFF',
                      resize: 'none', // Disables manual resizing
                      overflowY: 'auto',
                    }}
                    autoSize={{ minRows: textAreaRows, maxRows: textAreaRows }}
                  />
                  
                  {isAiLoading ? (<Button
                    onClick={handleStopButtonClick}
                    style={{
                      marginLeft: '1vw', // Relative to the width of the viewport
                      backgroundColor: '#eb2d3a',
                      border: 'none', // Assuming you want no border; change if needed
                      borderRadius: '50px', // Large enough value to create pill shape
                      fontSize: '1em', // Scales with the font size of the document
                      height: '5vh', // Relative to the height of the viewport
                      padding: '1vh 2vw', // Vertical padding relative to height, horizontal padding relative to width
                      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', // Optional: adds a slight shadow for depth
                      display: 'flex', // Enables the use of Flexbox for centering
                      alignItems: 'center', // Centers content vertically within the button
                      justifyContent: 'center', // Centers content horizontally within the button
                      whiteSpace: 'nowrap' // Prevents the text from wrapping
                    }}
                  >
                    Stop
                  </Button>):(<Button
                    onClick={handleButtonClick}
                    style={{
                      marginLeft: '1vw', // Relative to the width of the viewport
                      backgroundColor: '#7ce38b',
                      border: 'none', // Assuming you want no border; change if needed
                      borderRadius: '50px', // Large enough value to create pill shape
                      fontSize: '1em', // Scales with the font size of the document
                      height: '5vh', // Relative to the height of the viewport
                      padding: '1vh 2vw', // Vertical padding relative to height, horizontal padding relative to width
                      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', // Optional: adds a slight shadow for depth
                      display: 'flex', // Enables the use of Flexbox for centering
                      alignItems: 'center', // Centers content vertically within the button
                      justifyContent: 'center', // Centers content horizontally within the button
                      whiteSpace: 'nowrap' // Prevents the text from wrapping
                    }}
                    disabled={isButtonDisabled}
                  >
                    Send
                  </Button>)}
                    
          
                    
                </div>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'flex-start', // Align items to the start
                            width: '100%', // Ensure the div takes the full width of its container
                            maxHeight: '5vh', 
                            padding: '0 10px', 
                            boxSizing: 'border-box',
                        }}><style jsx>{`
                        h2 {
                          flex: 1;
                          text-align: center;
                          margin-left: 24px;
                          margin-right: 24px;
                          color: white;
                          white-space: nowrap;
                          overflow: hidden;
                          margin-top:3px
                        }
                        .icon {
                          font-size: 1em; /* Default size */
                        }

                        h2 span {
                          color: #2dba4e;
                        }

                        /* Media Query for screens with max-width of 600px */
                        @media (max-width: 600px) {
                          h2 {
                            font-size: 0.7em; /* Adjust the font size as needed */
                          }
                          .icon {
                            font-size: 0.7em; /* Adjust icon size similarly */
                            margin-bottom:-10px
                          }
                        }
                      `}</style>
                            <div style={{ width: '10%' }} className="icon">
                              
                            {!isLeftColumnVisible && (
                              <Tooltip placement="right" title={openChat}>
                            <DoubleRightOutlined onClick={handleChatBackButtonClick} /></Tooltip>
                            )}
                            </div>
                            <div style={{ 
                                width: '90%', 
                                display: 'flex', 
                                justifyContent: 'center', // Center the content in this div
                               marginLeft:'-17.5px'// Adjust if needed to fine-tune the position of "hello"
                            }}>
                                <h2>
                                  Selected Resource - 
                                  <span>
                                    {typeArray.length > 0 && typeArray[currentDocuIndex] ? ' '+typeArray[currentDocuIndex]+' ' : ' Upload any document '} 
                                  </span> 
                                </h2>
                                
                                {isAiLoading ? <ChatLoading/> : <></>}
                            </div>
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
                      acToken = {token}
                      />
                  )} 
          {isUpgradeOpen && (
              <UpgradeModal
                  hideUpgradeModal={() => setIsUpgradeOpen(false)}
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
      console.log('here')
        // If user is null and there's no error, redirect to login
        //
        return <Guest />
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

//chat details
/**
 Chat - 
                          <span style={{ color: '#2dba4e' }}> 
                              {chatArray.length > 0 && currentChat.index !== null && chatArray[currentChat.index] 
                                  ? ' ' + chatArray[currentChat.index].chatName.slice(0, 30) + ' ' 
                                  : ' Start asking '}
                          </span>              |
 */