let accessToken = null;
let userEmail = "";

function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).then(result => {
    const user = result.user;
    userEmail = user.email;
    document.getElementById("userEmail").textContent = userEmail;
    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";

    initGmailAccess(); // Get Gmail access token
  });
}

function initGmailAccess() {
  const tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: 'YOUR_GOOGLE_CLIENT_ID',  // from Google Cloud Console
    scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send',
    callback: (tokenResponse) => {
      accessToken = tokenResponse.access_token;
    }
  });
  tokenClient.requestAccessToken();
}

async function sendDraft() {
  const subject = document.getElementById("subject").value;
  const to = document.getElementById("recipient").value;
  const status = document.getElementById("status");

  status.textContent = "Searching for draft...";

  const drafts = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
    headers: { Authorization: `Bearer ${accessToken}` }
  }).then(res => res.json());

  const match = drafts.drafts?.find(d => d.message.payload.headers.some(h => h.name === "Subject" && h.value === subject));

  if (!match) {
    status.textContent = "Draft not found.";
    return;
  }

  const draft = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts/${match.id}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  }).then(res => res.json());

  const raw = atob(draft.message.raw.replace(/-/g, '+').replace(/_/g, '/'));
  const modified = raw.replace(/To: .*?\r\n/, `To: ${to}\r\n`);
  const newRaw = btoa(modified).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ raw: newRaw })
  });

  if (sendRes.ok) {
    status.textContent = "✅ Email sent!";
    saveToFirestore(subject, to);
  } else {
    status.textContent = "❌ Failed to send.";
  }
}

function saveToFirestore(subject, to) {
  const user = auth.currentUser;
  if (!user) return;

  db.collection("users").doc(user.uid).collection("sentLogs").add({
    subject: subject,
    recipient: to,
    sentAt: new Date().toISOString()
  });
}
