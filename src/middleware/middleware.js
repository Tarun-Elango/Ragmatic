//import { NextRequest, NextResponse } from 'next/server';
const jose = require('jose');

async function middleware(req) {
  // if (req.method === 'OPTIONS') {
  //   return NextResponse.json({});
  // }

  // retreive token
  const token =  req.headers.authorization;

  if (token) {

    // retireve the token status
    const verificationResult = await authenticateRequest(token);

    // send the token status
    return verificationResult
    
  } else {

    // when no token
    return { success: false,  message: 'Authentication failed: No token given' };
  }
}

async function authenticateRequest(token) {
  // Load public key from the authentication provider
  const jwks = await jose.createRemoteJWKSet(new URL(process.env.AUTH0_JWKS_URI));

  try {
    // Verify the given token
    const at = token.replace('Bearer ', '')
    const result  = await jose.jwtVerify(at, jwks, {
        audience: process.env.AUTH0_AUD,
        issuer: process.env.AUTH0_ISSUER_BASE_URL, 
        algorithms: ['RS256']
    });

    // if valid
    return { success: true,  tokenDetails: result.payload,message: 'Token verified successfully' };
  } catch (e) {
    // if invalid
    console.error('Authentication failed: Token could not be verified');
    return { success: false, message: `Authentication failed: ${e.message}` };
  }
}

module.exports = { middleware };
