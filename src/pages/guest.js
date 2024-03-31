import {  InfoCircleOutlined } from '@ant-design/icons';
import { Tooltip, } from 'antd';
import React, {  useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head'
import styles from '../styles/guest.module.css'
import logo from '../../public/logo.png'
import Image from 'next/image';
import AboutModal from '../components/modals/AboutModal'

export default function Guest () {
  const router = useRouter();
  const handleLogin = () => {
    router.push('/api/auth/login')
  };

  const text = "pdf, word, text file, text input";
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

  const about ="More info"
  const vanilla =<span>Have a regular conversation with an AI.</span>
  const custom = <span>AI will answer queries, based on the uploaded resource.</span>
  const [isAboutGuestOpen, setIsAboutGuestOpen] = useState(false)
return(<>

<Head>
    <title>Ragmatic - AI for your Resource</title>
    <meta name="description" content="Ragmatic: AI Assitant for your resources" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, "/>
    <link rel="icon" href="/favicon.ico" />
</Head>

<div className={styles.container}>
    <header className={styles.header}>
    <a>
      <Image
        src={logo} // Path to your image in the public folder
        width="50" // Set the width of the image similar to the SVG width
        height="50" // Set the height of the image similar to the SVG height
        alt=""
        style={{
          paddingBottom:'5vh',
          display: 'block', // Ensures the image is a block-level element, similar to the default SVG behavior
          maxWidth: '100%', // Ensures the image scales within its container
          height: 'auto', // Maintains aspect ratio
          stroke: 'currentColor', // SVG property, not applicable to bitmap images but kept for consistency
          strokeWidth: '2', // SVG property, not applicable to bitmap images but kept for consistency
          strokeLinecap: 'round', // SVG property, not applicable to bitmap images but kept for consistency
          strokeLinejoin: 'round', // SVG property, not applicable to bitmap images but kept for consistency
          color: 'red', // Assuming you want to apply a red color filter to your image, though this may not have the desired effect without further CSS or SVG filters
          className: 'h-8 w-8 text-red-500' // Tailwind CSS classes for height, width, and text color, which might not apply directly to images
        }}
      />
    </a>

    <h1 className={styles.h1Bold} >Ragmatic</h1>
    <Tooltip placement="bottom" title={about}>
      <InfoCircleOutlined style={{ fontSize: '24px', paddingBottom:'5vh'}} onClick={()=>setIsAboutGuestOpen(true)}/>
    </Tooltip>
  </header>
  <main className={styles.mainclassBox}>
    <h2 className = {styles.boxWords}>Resource-Tailored AI ChatBot.</h2>
    <p className="mb-4">
      <Tooltip placement="bottom" title={custom}>
        Upload Resources & Get Your Custom AI Assistant.
      </Tooltip>
    </p>
    <p className="mb-4">
      <Tooltip placement="bottom" title={vanilla}>
        Includes Vanilla AI Chatbot
      </Tooltip>
    </p>
    <p className="mb-6">Supported file types: pdf, word, text file, text input, Youtube videos, website URLs</p>

    <div className={styles.buttonBox}>
      <button className={styles.loginButton} onClick={handleLogin}>
        Login to get started
      </button>
    </div>
  </main>
  <footer className={styles.foot}>
  <div className={styles.shimmercontainer}>
 
  
</div>

    <div className={styles.footBox}>
      <p>Hosted on GCP</p>
      
      <h3 className={styles.poweredText}>  Powered by Open AI</h3> 
      <h3 > <em> By Tarun Elango</em></h3> 
    </div>
  </footer>
</div>
{isAboutGuestOpen && (
  <AboutModal
      hideAboutModal={() => setIsAboutGuestOpen(false)}
  /> 
)}
</>)
}