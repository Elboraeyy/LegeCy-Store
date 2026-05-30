import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // Read credentials from environment variable (set on Vercel)
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin initialized successfully.');
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT_KEY env variable is not set. FCM push notifications will not work.');
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export default admin;
