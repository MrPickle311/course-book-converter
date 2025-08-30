# Google OAuth Setup Guide

This application includes a demo Google OAuth implementation. To enable real Google OAuth authentication, follow these steps:

## 1. Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (or Google Identity API)
4. Go to "Credentials" in the left sidebar
5. Click "Create Credentials" → "OAuth 2.0 Client IDs"
6. Configure the OAuth consent screen if prompted
7. For Application type, select "Web application"
8. Add your domain to "Authorized JavaScript origins":
   - For development: `http://localhost:3000`
   - For production: `https://yourdomain.com`
9. Copy the generated Client ID

## 2. Update the Application

### Replace the Client ID
In `/components/GoogleSignIn.tsx`, replace:
```typescript
client_id: 'YOUR_GOOGLE_CLIENT_ID_HERE'
```
with your actual Google Client ID.

### Remove Demo Mode
1. Remove or comment out the `handleDemoGoogleSignIn` function
2. Remove the demo button and show the real Google button:
```typescript
// Remove this block:
<Button onClick={handleDemoGoogleSignIn} ...>

// Show this block instead:
<div id="google-signin-button" />
```

### Update the Real Button Rendering
Uncomment and update the Google button rendering:
```typescript
useEffect(() => {
  if (googleScriptLoaded && window.google) {
    window.google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: mode === 'login' ? 'signin_with' : 'signup_with'
      }
    );
  }
}, [googleScriptLoaded, mode]);
```

## 3. Backend Integration (Recommended)

For production use, you should verify the Google JWT token on your backend:

### Backend Verification (Node.js example):
```javascript
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);

async function verifyGoogleToken(token) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return {
      success: true,
      user: {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      }
    };
  } catch (error) {
    return { success: false, error: 'Invalid token' };
  }
}
```

### Update AuthContext
Replace the demo token decoding with a real API call:
```typescript
const loginWithGoogle = async (googleCredential: any) => {
  setIsLoading(true);
  
  try {
    // Send token to your backend for verification
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: googleCredential.credential })
    });
    
    const result = await response.json();
    
    if (result.success) {
      setUser(result.user);
      localStorage.setItem('pdf_course_user', JSON.stringify(result.user));
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: 'Authentication failed' };
  } finally {
    setIsLoading(false);
  }
};
```

## 4. Security Considerations

1. **Never verify tokens on the frontend** - Always verify Google tokens on your backend
2. **Use HTTPS** - Google OAuth requires HTTPS for production
3. **Validate the audience** - Ensure the token was issued for your application
4. **Check token expiration** - Implement proper token refresh logic
5. **Store minimal user data** - Only store necessary user information

## 5. Testing

1. Test with different Google accounts
2. Test the consent flow for new users
3. Test with users who have revoked permissions
4. Verify proper error handling for network issues

## Current Demo Features

The current implementation includes:
- ✅ Google Sign-In UI component
- ✅ Mock authentication flow
- ✅ User profile integration
- ✅ Automatic account creation for new Google users
- ✅ Seamless integration with existing email/password auth

## Production Checklist

- [ ] Get Google Client ID from Google Cloud Console
- [ ] Replace demo client ID in GoogleSignIn.tsx
- [ ] Set up backend token verification
- [ ] Update AuthContext to use real API calls
- [ ] Configure HTTPS for production
- [ ] Test thoroughly with different accounts
- [ ] Update OAuth consent screen information
- [ ] Add proper error handling and user feedback