import { AppProps } from 'next/app';
import Head from 'next/head';
import ReactGA from 'react-ga4';

import './_app.css';

ReactGA.initialize('G-JMCDB5JZXK');

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Welcome to web!</title>
      </Head>

      <main className='app'>
        <Component {...pageProps} />
      </main>
    </>
  );
}

export default CustomApp;
