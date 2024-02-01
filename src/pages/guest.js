import React, { useEffect, useState } from 'react';
import Head from 'next/head'
import { useRouter } from 'next/router';
import {  UserOutlined, InfoCircleOutlined, PlusCircleOutlined, DoubleLeftOutlined,DoubleRightOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Input,Tooltip, Menu   } from 'antd';
import logo from '../../public/logo.png'
import Image from 'next/image';
import styles from '../styles/guest.module.css';
import AboutModal from '../components/modals/AboutModal'



// TODO: change font, change text that shows up to the left and add type animations
export default function Guest () {
  const router = useRouter();
  const text = "Login to get Started !!!";
  const about ="More info"
  const vanilla =<span>Use AI without needing to upload anything.</span>
  const custom = <span>AI will answer queries, based on the uploaded resource.</span>
  const [isAboutGuestOpen, setIsAboutGuestOpen] = useState(false)
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const delay = 50
  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText(prevText => prevText + text[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, delay);
  
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text]);


    const handleLogin = () => {
      router.push('/api/auth/login')
    };
    
    const [textAreaRows, setTextAreaRows] = useState(2);
    const phrases =["Upload pdfs.","Upload word doc", "Upload text files", "More file types coming soon!!"]

return(<>
      <Head>
          <title>JotDownAI</title>
          <meta name="description" content="JotDown - An AI document Assitant." />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, "/>
          <link rel="icon" href="/favicon.ico" />
      </Head>

  <div style={{ display: 'flex', height: '100vh', backgroundColor: '#21262d' }}>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ maxHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#21262d', padding: '10px', overflow: 'auto' }}>
      
              {/* Header */}
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%', height: '7.5vh' }}>
                  <div style={{ flex: '0 0 auto', height: '3.25vh', marginLeft: '20px', marginTop: '-27.5px' }}>
                      <a>
                          <Image
                              src={logo} // Path to your image in the public folder
                              width={100} // Set the width of the image
                              height={10} // Set the height of the image
                              alt=""
                              style={{
                                maxWidth: '50%',
                                height: 'auto',
                              }}
                          />
                      </a>
                  </div>
                  
                <div className='name'>
                  <h3>
                    <strong >JotDownAI</strong> <Tooltip placement="bottom" title={about}>
                              <InfoCircleOutlined style={{marginLeft:'15px'}} onClick={()=>setIsAboutGuestOpen(true)}/>
                          </Tooltip>
                  </h3> 
                </div>
              </div>


              {/*body */}
              <div style={{
                height: '82.5vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'flex-start', // Aligns children to the left
                borderRadius: '10px',
                backgroundColor: '#36373A',
                marginTop: '15px',
                border: '1px solid black',
                padding: '15px',
                paddingTop:'30px',
                paddingLeft: '35px', // Increased left padding for more space
                width: '100%',
                boxSizing: 'border-box',
            }}>
              <p style={{
                  margin: '0 0 10px 0',
                  fontSize: '20px',
                  fontWeight: '600',
                  lineHeight: '1.6',
                  color: '#ffffff',
                  textAlign: 'left',
              }}></p>
              <p style={{
                  margin: '10px 0 0 0',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  lineHeight: '1.5',
                  color: '#E6735C',
                  animation: 'pulse 2s infinite',
                  textAlign: 'left',
              }}>
                  <strong>Resource-Tailored AI ChatBot.</strong>
              </p>
              <p style={{
                  margin: '15px 0 0 0',
                  fontSize: '18px',
                  fontWeight: '500',
                  lineHeight: '1.5',
                  color: '#C0C0C0',
                  textAlign: 'left',
              }}>
                  <Tooltip placement="bottom" title={custom}><strong>Upload Resources</strong></Tooltip> -&gt; Get Your Custom AI Assistant.
              </p>
              <p style={{
                  margin: '15px 0 15px 0',
                  fontSize: '18px',
                  fontWeight: '500',
                  lineHeight: '1.5',
                  color: '#C0C0C0',
                  textAlign: 'left',
              }}>
                 Includes <Tooltip placement="bottom" title={vanilla}><strong>Vanilla AI Chatbot</strong> </Tooltip>
              </p>
              <p style={{
                  margin: '15px 0 15px 0',
                  fontSize: '18px',
                  fontWeight: '500',
                  lineHeight: '1.5',
                  color: '#C0C0C0',
                  marginBottom: '20px',
                  textAlign: 'left',
              }}>
                  Supported file types: .pdf
              </p>
              <span className={styles.blinkingCursor}><strong>{currentText}</strong></span>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center', // Center vertically in the available space
                gap: '20px',
                marginTop: 'auto', // Push to bottom
                width: '100%', // Take full width to center content
                height: '10vh', // Full height of the viewport
                boxSizing: 'border-box', // Include padding and border in the element's total width and height
              }}>
                  <button style={{
                    borderRadius: '8px',
                    backgroundColor: '#fa7970',
                    color: 'black',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '5px 15px',
                  }} onClick={handleLogin}>
                    <strong>Login</strong>
                  </button>
                  <div  className='tierInfo' style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: '100%', 
                    padding: '0 10px',
                    boxSizing: 'border-box',
                  }}>
                    <p>
                      <em>Free tier: 10 Resources and unlimited messages. GPT-4 Plans start at $4.99.  </em>
                      <span style={{ color: ' #00A67E' }}> Powered by Open AI.</span>
                    </p>
                  </div>
              </div>
            </div>

            {/*footer */}  
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between', // Keep items evenly distributed
              width: '100%',
              padding: '0 10px',
              boxSizing: 'border-box',
            }}>

              <div style={{ 
                width: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                marginLeft: '50px', // Adjust this value for smaller screens if needed,
              }}>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '7.5vh'
                }}>
                  
                </div>                    
              </div>
              <div style={{height:'3.25vh',flex:'0 0 auto', maxWidth:'100px',fontSize:'9px'}}>
                Hosted on
                <a href="https://vercel.com/home" target="_blank" rel="noopener noreferrer">
                  <img src="https://img.shields.io/badge/vercel-%23000000.svg?logo=vercel&logoColor=white&style=for-the-badge" alt="Vercel" style={{height:'20px'}}/>
                </a>
              </div>
            </div>
            <style jsx>{`
            .tierInfo{
              font-size:0.85em
            }
            .name{
              font-size: 1.2em;
              color:#fa7970;
              flex: 0 1 auto;
              margin-left: -25px
            }
            /* Responsive styles */
            @media (max-width: 800px) {
              .name {
                font-size: 1.2em; /* Smaller font size for smaller screens */
              }
              .tierInfo{
                font-size:0.7em
              }
            }
             `}</style>
            
  {/*closing divs*/}  
      </div>
    </div>
  </div>

        {isAboutGuestOpen && (
              <AboutModal
                  hideAboutModal={() => setIsAboutGuestOpen(false)}
              /> 
          )}
  </>)
}
