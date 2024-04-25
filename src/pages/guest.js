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
  {/* Header Component */}
  <header className={styles.header}>
    <a href="/" aria-label="Home">
      <Image
        src={logo}
        width="50"
        height="50"
        alt="Ragmatic Logo"
        className={styles.logo}
      />
    </a>
    <h1 className={styles.h1Bold}>Ragmatic</h1>
    <Tooltip placement="bottom" title={about}>
      <button 
        aria-label="About Ragmatic"
        className={styles.infoButton}
        onClick={() => setIsAboutGuestOpen(true)}>
        <InfoCircleOutlined />
      </button>
    </Tooltip>
  </header>

  {/* Main Content Component */}
  <main className={styles.mainclassBox}>
    <h2 className={styles.boxWords}>Custom AI Assistant Tailored to Your Resources</h2>
    <p className={styles.description}>
      Upload resources & get your custom AI assistant
    </p>
    <p className={styles.supportedTypes}>Supported file types: PDF, Word, Text file, Text input, YouTube videos, Website URLs, Images</p>
    <p className={styles.third}>AI Equipped with Internet access and a built-in calculator</p>
    <div className={styles.buttonBox}>
      <button className={styles.loginButton} onClick={handleLogin}>
        Login to get started
      </button>
    </div>
  </main>

  {/* Footer Component */}
  <footer className={styles.foot}>
    <div className={styles.footBox}>
      <p > Hosted on GCP</p>
      <h3 className={styles.poweredText}>Powered by OpenAI</h3> 
      <h3 className={styles.author}><em>By Tarun Elango</em></h3> 
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