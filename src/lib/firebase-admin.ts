import * as admin from 'firebase-admin';
import path from 'path';

if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.resolve('./legacy-firebase-adminsdk.json');
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Firebase Admin initialization error', error);
  }
}

export default admin;
