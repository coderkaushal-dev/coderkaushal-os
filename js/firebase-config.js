// js/firebase-config.js

// Yahan apni Firebase credentials paste karein
const firebaseConfig = {
   apiKey: "AIzaSyC0XOiT8X9bFaHJ5jTC297AYvFyorF_6BA",
    authDomain: "coderkaushal-os.firebaseapp.com",
    projectId: "coderkaushal-os",
    storageBucket: "coderkaushal-os.firebasestorage.app",
    messagingSenderId: "141207667858",
    appId: "1:141207667858:web:ee37287d1bf4117cad124b",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore (Database)
const db = firebase.firestore();

console.log("Firebase Connected Successfully! 🚀");