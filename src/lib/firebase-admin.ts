import * as admin from 'firebase-admin';
import path from 'path';

import fs from 'fs';

if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.resolve('./legacy-firebase-adminsdk.json');
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Firebase Admin initialization error', error);
  }
}

export default admin;
