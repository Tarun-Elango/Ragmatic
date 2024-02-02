import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export default function Stream() {
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const startReceivingMessages = () => {
    let currentAIMessage = ""
    const initalMes = {
      text: currentAIMessage,
      align:'left',  
    }
    const initialEmpty = {
      ...initalMes,
      type: "ai"
    };
  
    setMessages((prevMessages)=>[...prevMessages, initialEmpty])
    if (!socket) { // Check if the socket is not already connected
      const newSocket = io('http://localhost:5000');
      console.log('Connected');

      newSocket.on('message', (data) => {

        
        setMessages((prevMessages) => {
          currentAIMessage  = currentAIMessage+ data.data
          //console.log(currentAIMessage)
         const lastMessage = prevMessages[prevMessages.length - 1];
        const updatedContent = lastMessage.text + data.data;
        return [
          ...prevMessages.slice(0, prevMessages.length - 1),
          { ...lastMessage, text: updatedContent }
        ];

        });

        //setMessages((prevMessages) => [...prevMessages, data.data]);
        console.log('message received')
      });
  

      newSocket.on('disconnect', () => {
        setMessages((prevMessages) => {
          const lastMessage = prevMessages[prevMessages.length - 1];
          console.log(lastMessage.text); // Print the entire previous message
  
          newSocket.off('disconnect'); // Remove the disconnect event listener after it has been executed once
  
          return prevMessages; // Return the previous messages without modification
        });
        console.log('disconnected websocket')
        setSocket(null); // Reset the socket state to allow reconnection
      });

      setSocket(newSocket);

      newSocket.emit('start', 'write a few lines about beauty of summer');
      console.log('Started');
    }
  };

  // Function to manually close the socket connection
  const stopReceivingMessages = () => {
    if (socket) {
      //console.log(messages)
      socket.disconnect();
      console.log('Connection manually closed');
      setSocket(null); // Reset the socket state after disconnection


    }
    
  };


  return (
    <div>
      <button onClick={startReceivingMessages} style={{background:'blue'}}>Start Receiving Messages</button>
      <button onClick={stopReceivingMessages} style={{background:'red'}}>Stop Receiving Messages</button>
      <div style={{background:'grey'}}>
      {messages.map((message, index) => (
        <div key={index}>{message.text}</div>
      ))}
      </div>
    </div>

  );
}
