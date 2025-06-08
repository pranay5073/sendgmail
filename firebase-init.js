const firebaseConfig = {
  apiKey: "AIzaSyC0hQV7fm1ezqe18h99L7c1b6RVwj44ulE",
  authDomain: "send-71d82.firebaseapp.com",
  projectId: "send-71d82",
  appId: "1:617445897711:web:42995261bbe00cb015721a",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
