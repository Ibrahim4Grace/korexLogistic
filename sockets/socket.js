const socketIO = require("socket.io");
const session = require("express-session");
const passport = require("passport");
const Chat = require('../models/chat');
const chatIoSetup = (server, app, wrap, Chat,) => {
  const io = socketIO(server);

  global.io = io;

  const chatIo = io.of('/chat');

  const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000
    },
  });

  chatIo.use(wrap(sessionMiddleware));
  chatIo.use(wrap(passport.initialize()));
  chatIo.use(wrap(passport.session()));

  chatIo.on('connection', (socket) => {
    console.log('User connected to chat:', socket.id);
    
  
    socket.on("typing", (data) => {
      chatIo.emit("notifyTyping", {
        user: data.user,
        message: data.message,
      });
    });
  
    socket.on("stopTyping", () => {
      chatIo.emit("notifyStopTyping");
    });
  
    //  Handle joinRoom event
      socket.on('joinRoom', (room) => {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
      });

  
      socket.on('storeUserId', ({ userId, room }) => {
        socket.userId = userId;
        socket.adminId = userId; // Store the admin ID directly in the socket
        console.log(`Socket ${socket.id} is associated with user ID ${userId} in room ${room}`);
      });
  
    socket.on('userMessage', async (message) => {
      try {
        console.log(`Received user message from Socket ${socket.id} with user ID ${socket.userId}`);
        console.log('User message content:', message);
    
        const newChatMessage = new Chat({
          message: message.message,
          senderName: message.senderName,
          senderRole: message.senderRole,
          userId: socket.userId,
          date_added: new Date(),
        });
    
        await newChatMessage.save();
    
        // Broadcast the message to admins in the 'adminRoom'
        chatIo.to('adminRoom').emit('message', newChatMessage);
        // Broadcast the message to the user in the 'userRoom'
        chatIo.to(socket.userId).emit('message', newChatMessage);
        console.log(`Received user message from Socket ${socket.id} with user ID ${socket.userId}`);
      } catch (error) {
        console.error('Error saving user message to the database:', error);
      }
    });
    
  
      socket.on('adminMessage', async (message) => {
        try {
          console.log(`Received admin message from Socket ${socket.id} with admin ID ${socket.adminId}`);
          console.log('Admin message content:', message);
  
         
      
          if (socket.adminId) {
            const newChatMessage = new Chat({
              message: message.message,
              senderName: message.senderName,
              senderRole: message.senderRole,
              adminId: socket.adminId, // Use the directly stored admin ID
              date_added: new Date(),
            });
      
            await newChatMessage.save();
  
              chatIo.to('userRoom').emit('message', newChatMessage);
            // Broadcast the message only to the specific user in their room
            chatIo.to(socket.userId).emit('message', newChatMessage);
           
          } else {
            console.error('Admin ID not found in socket.');
          }
        } catch (error) {
          console.error('Error saving admin message to the database:', error);
        }
      });
  
    socket.on('disconnect', () => {
      console.log('User disconnected from chat:', socket.id);
    });
  });
    

  return chatIo;
};



module.exports = chatIoSetup

