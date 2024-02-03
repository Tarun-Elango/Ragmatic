import {  InfoCircleOutlined } from '@ant-design/icons';
import { Tooltip, } from 'antd';
import React, {  useState } from 'react';
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
  
  const about ="More info"
  const vanilla =<span>Have a regular conversation with an AI.</span>
  const custom = <span>AI will answer queries, based on the uploaded resource.</span>
  const [isAboutGuestOpen, setIsAboutGuestOpen] = useState(false)
return(<>

<Head>
    <title>JotDownAI</title>
    <meta name="description" content="JotDown - An AI document Assitant." />
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

    <h1 className={styles.h1Bold} >JotDownAI</h1>
    <Tooltip placement="bottom" title={about}>
      <InfoCircleOutlined style={{ fontSize: '24px', paddingBottom:'5vh'}} onClick={()=>setIsAboutGuestOpen(true)}/>
    </Tooltip>
  </header>
  <main className={styles.mainclassBox}>
    <h2 className = {styles.boxWords}>Resource-Tailored AI ChatBot.</h2>
    <p class="mb-4"><Tooltip placement="bottom" title={custom}>Upload Resources -&gt; Get Your Custom AI Assistant.</Tooltip></p>
    <p class="mb-4"><Tooltip placement="bottom" title={vanilla}>Includes Vanilla AI Chatbot</Tooltip></p>
    <p class="mb-6">Supported file types: .pdf</p>
    <div className={styles.buttonBox}>
      <button className={styles.loginButton} onClick={handleLogin}>
        Login to get started
      </button>
    </div>
  </main>
  <footer className={styles.foot}>
  <div className={styles.shimmercontainer}>
  <span className={styles.shimmertext}>Free tier: 1 Resources and unlimited messages.</span> Pro Plans start at $9.99
</div>

    <div className={styles.footBox}>
      <p>Hosted on </p>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="h-6 w-6 ml-1"
      >
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
      </svg>
      <h3 className={styles.poweredText}>  Powered by Open AI</h3> 
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