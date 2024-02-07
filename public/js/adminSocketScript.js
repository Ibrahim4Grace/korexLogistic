'use strict';

const socket = io('/chat');

// Emit the joinRoom event with the room name
socket.emit('joinRoom', 'adminRoom');


setTimeout(() => {
 // Assuming you have the adminId available, emit the storeUserId event
socket.emit('storeUserId', { userId: socket.id, room: 'adminRoom'});
}, 1000);  


console.log('Emitted adminMessage with userId:', socket.userId);

const messageContainerAdmin = document.getElementById('message-container-admin');

//Listen for incoming messages from users and admins
socket.on('message', (message) => {
  console.log('Received user chat message:', message);
  // Append the message to the admin's message container
  appendMessage(messageContainerAdmin, message);
});


document.getElementById('admin-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const message = document.getElementById('admin-message').value;
  const senderName = document.getElementById('sender-name').value;
  const senderRole = document.getElementById('sender-role').value;

  // Emit the adminMessage event with the message details
  socket.emit('adminMessage', { message, senderName, senderRole});

  // Clear the input field after sending the message
  document.getElementById('admin-message').value = '';
});

// Fetch messages from the server only for the admin
fetch('/chats/adminRoom')  // Adjust the endpoint to fetch admin-specific messages
  .then(response => response.json())
  .then(chatMessages => {
    chatMessages.forEach(message => {
      appendMessage(messageContainerAdmin, message);
    });
  });

// Function to append a message to the container
// function appendMessage(container, message) {
//   const messageElement = document.createElement('div');
//   messageElement.innerText = `${message.senderName}: ${message.senderRole}: ${message.message}`;
//   container.appendChild(messageElement);
// }

// Function to append a message to the container
function appendMessage(container, message) {
  const messageElement = document.createElement('div');
  const timeAgo = formatTimeAgo(new Date(message.date_added)); // Calculate time ago
  messageElement.innerText = `${message.senderName}: ${message.senderRole}: ${message.message} - ${timeAgo}`;
  container.appendChild(messageElement);
}


function formatTimeAgo(date) {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  let interval = Math.floor(seconds / 31536000);

  if (interval >= 1) {
    return interval + ' years ago';
  }
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval + ' months ago';
  }
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval + ' days ago';
  }
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval + ' hours ago';
  }
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval + ' minutes ago';
  }
  return Math.floor(seconds) + ' seconds ago';
}


// Declare adminTyping variable
let adminTyping = document.getElementById("typing");

// is typing...
let adminMessageInput = document.getElementById("admin-message");

// isTyping event
adminMessageInput.addEventListener("keypress", () => {
  const senderRole = document.getElementById('sender-role').value;
  socket.emit("typing", { user: senderRole, message: "is typing..." });
});

socket.on("notifyTyping", (data) => {
  if (data.user === "User") {
    adminTyping.innerText = data.user + " " + data.message;
    console.log(data.user + data.message);
  }
});

// stop typing
adminMessageInput.addEventListener("keyup", () => {
    // Update the senderRole variable
    const senderRole = document.getElementById('sender-role').value;
  socket.emit("stopTyping", { user: senderRole });
});

socket.on("notifyStopTyping", () => {
  adminTyping.innerText = "";
});