import os
import requests
from jose import jwt, jwk, jws
from jose.utils import base64url_decode

def authenticate_request(token):
    # Load public keys from the authentication provider
    jwks_uri = ''
    jwks_response = requests.get(jwks_uri)
    jwks = jwks_response.json()

    # Extract the token without 'Bearer '
    at = token.replace('Bearer ', '')

    # Decode the JWT header to determine which key was used to sign the token
    headers = jwt.get_unverified_header(at)

    # Find the public key in the JWKs
    key = None
    for jwk_key in jwks['keys']:
        if jwk_key['kid'] == headers['kid']:
            key = jwk.construct(jwk_key)
            break

    if not key:
        return {'success': False, 'message': 'Public key not found in JWKs'}

    # Verify the given token
    try:
        payload = jwt.decode(
            at,
            key,
            algorithms=['RS256'],
            audience='',
            issuer=''
        )

        # If valid
        return True
    except jwt.JWTError as e:
        # If invalid
        #('Authentication failed: Token could not be verified')
        return False

# Example usage
token = ''
result = authenticate_request(token)
print(result)
