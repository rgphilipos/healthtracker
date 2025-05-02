import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, Firestore } from 'firebase/firestore';

// TODO: Replace these values with your actual Firebase configuration
// You can find these values in your Firebase Console under Project Settings
const firebaseConfig = {
  apiKey: "AIzaSyCEbXVGOkYHBSVIy3kIVNRCqKd8WynDa-0",
  authDomain: "health-cc894.firebaseapp.com",
  projectId: "health-cc894",
  storageBucket: "health-cc894.firebasestorage.app",
  messagingSenderId: "424714805619",
  appId: "1:424714805619:web:bbf9942434f925641d6506",
  measurementId: "G-WMPV7QCSQQ"
};

console.log('Starting Firebase initialization...');
console.log('Firebase config loaded:', {
  ...firebaseConfig,
  apiKey: '***' // Hide the actual API key in logs
});

let app;
let db: Firestore;

try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully:', app.name);
  
  db = getFirestore(app);
  console.log('Firestore initialized successfully');
  
  // Verify Firestore connection
  getDocs(collection(db, 'symptoms'))
    .then(() => console.log('Successfully connected to Firestore'))
    .catch((error: Error) => console.error('Error connecting to Firestore:', error));
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

export { db }; 