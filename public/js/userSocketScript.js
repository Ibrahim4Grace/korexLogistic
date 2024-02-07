'use strict';
const socket = io('/chat');

socket.emit('joinRoom', 'userRoom');

  
// By introducing a slight delay, we ensured that the joinRoom event 
// had enough time to be processed before attempting to store the user ID.
setTimeout(() => {
  const userId = socket.id;
  const room = 'userRoom';
  socket.emit('storeUserId', { userId, room });
  console.log(`User ID (${userId}) stored in room ${room}`);
}, 1000);  

const messageContainerUser = document.getElementById('message-container-user');
console.log('Message container identified:', messageContainerUser);

// In your user script
socket.on('message', (message) => {
  console.log('Received chat message:', message);
  appendMessage(messageContainerUser, message);
});


document.getElementById('user-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const message = document.getElementById('user-message').value;
  const senderName = document.getElementById('sender-name').value;
  const senderRole = document.getElementById('sender-role').value;

  // Emit the userMessage event with the message details
  socket.emit('userMessage', { message, senderName, senderRole });
  console.log('Sent user message:', { message, senderName, senderRole });

  // Clear the input field after sending the message
  document.getElementById('user-message').value = '';
});

fetch(`/chats/userRoom`)
  .then(response => response.json())
  .then(chatMessages => {
    console.log('Fetched chat messages:', chatMessages);
    chatMessages.forEach(message => {
      appendMessage(messageContainerUser, message);
    });
  });

// Function to append a message to the container
// function appendMessage(container, message) {
//   console.log('Appending message:', message);
//   const messageElement = document.createElement('div');
//   messageElement.innerText = `${message.senderName}: ${message.senderRole}: ${message.message}`;
//   container.appendChild(messageElement);
// }

// Function to append a message to the container
function appendMessage(container, message) {
  console.log('Appending message:', message);
  const messageElement = document.createElement('div');
  const timeAgo = formatTimeAgo(new Date(message.date_added)); // Calculate time ago
  messageElement.innerText = `${message.senderName}: ${message.senderRole}: ${message.message} - ${timeAgo}`;
  container.appendChild(messageElement);
}

// Function to format time ago
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


// Declare userTyping variable
let userTyping = document.getElementById("typing");

// is typing...
let userMessageInput = document.getElementById("user-message");

// isTyping event
userMessageInput.addEventListener("keypress", () => {
  const senderRole = document.getElementById('sender-role').value;
  socket.emit("typing", { user: senderRole, message: "is typing..." });
});

socket.on("notifyTyping", (data) => {
  if (data.user === "Admin") {
    // Update the userTyping element
    userTyping.innerText = data.user + " " + data.message;
    console.log(data.user + data.message);
  }
});

// stop typing
userMessageInput.addEventListener("keyup", () => {
  // Update the senderRole variable
  const senderRole = document.getElementById('sender-role').value;
  // Emit stopTyping event with user ID
  socket.emit("stopTyping", { user: senderRole});
});

socket.on("notifyStopTyping", () => {
  userTyping.innerText = "";
});
