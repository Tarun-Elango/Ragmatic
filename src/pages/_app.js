import '../styles/globals.css'
import React from 'react'
import Head from 'next/head'
import { UserProvider } from '@auth0/nextjs-auth0/client';

export default function App({ Component, pageProps }) {
  return (
    <>
    <Head>
        <title>JotDown</title>
        <meta
            name="description"
            content="JotDown - An AI document Assitant."
        />
        <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
        />
    </Head>
    <UserProvider>
        <Component {...pageProps} />
    </UserProvider>
</>
  );
}