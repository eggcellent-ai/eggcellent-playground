# Firebase Setup for Google Authentication & Cloud Sync

This guide will help you set up Firebase Authentication with Google OAuth and Firestore cloud sync for the Eggcellent playground.

**Important:** _API keys are **never** synced to the cloud. They are stored only in your browser's local storage for security. Only prompts and non-sensitive user data are synced to Firestore._

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "eggcellent-playground")
4. Follow the setup wizard (you can disable Google Analytics if you don't need it)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project console, click "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Click on "Google" provider
5. Enable it and configure:
   - **Project support email**: Your email address
   - **Web SDK configuration**: Leave as default
6. Click "Save"

## Step 3: Enable Firestore Database

1. In your Firebase project console, click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (you can add security rules later)
4. Select a location close to your users
5. Click "Done"

## Step 4: Configure Firestore Security Rules

1. In Firestore Database, go to the "Rules" tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click "Publish"

## Step 5: Get Firebase Configuration

1. In your Firebase project console, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>)
5. Register your app with a nickname (e.g., "eggcellent-web")
6. Copy the configuration object

## Step 6: Set Environment Variables

Create a `.env` file in your project root with the following variables:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id-here
```

Replace the values with the actual configuration from your Firebase project.

## Step 7: Configure Authorized Domains

1. In Firebase Console, go to Authentication > Settings
2. Under "Authorized domains", add your domain:
   - For development: `localhost`
   - For production: your actual domain

## Step 8: Test the Setup

1. Start your development server: `npm run dev`
2. Open the app in your browser
3. Click the "Sign in with Google" button in the header
4. Complete the Google OAuth flow
5. You should see your Google profile picture and name in the header
6. Check that prompts sync to Firestore (you can view this in the Firebase Console)
7. Test that your prompts persist across browser sessions

## Troubleshooting

### Common Issues:

1. **"Firebase: Error (auth/popup-closed-by-user)"**

   - This is normal if the user closes the popup
   - The error is handled gracefully in the app

2. **"Firebase: Error (auth/unauthorized-domain)"**

   - Make sure you've added your domain to authorized domains in Firebase Console
   - For localhost, add `localhost` to the list

3. **"Firebase: Error (auth/api-key-not-valid)"**

   - Check that your API key is correct in the `.env` file
   - Make sure the `.env` file is in the project root

4. **Environment variables not loading**
   - Restart your development server after creating the `.env` file
   - Make sure the variable names start with `VITE_`

## Security Notes

- The Firebase configuration is safe to expose in client-side code
- API keys are **never** synced to Firestore or any server
- API keys are stored only in your browser's local storage
- User authentication tokens are handled securely by Firebase
- No sensitive data is stored on your servers

## Next Steps

Once Google authentication and Firestore sync are working, you can:

1. Add more authentication providers (GitHub, Microsoft, etc.)
2. Implement user-specific features
3. Add role-based access control
4. Sync user data with your backend (if you add one)

For more information, see the [Firebase Authentication documentation](https://firebase.google.com/docs/auth) and [Firestore documentation](https://firebase.google.com/docs/firestore).
