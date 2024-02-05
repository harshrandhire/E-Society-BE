const io = require("socket.io-client");

const socket = io.connect("http://localhost:8000");

socket.on("connect", () => {
  console.log("Connected to the server");

  // Sending a request to create a new room
  const roomName = "roomName";
  socket.emit("createRoom", roomName);

  // Sending a request to find a room
  const roomId = "lwfqut8y"; // Replace with an existing room ID
  socket.emit("findRoom", roomId);

  // Sending a new message to a room
  const data = {
    room_id: roomId,
    message: "Hello aniket there!",
    user: "User123",
    timestamp: { hour: 12, mins: 30 },  
  };
  socket.emit("newMessage", data);
});

socket.on("roomsList", (data) => {
  console.log("Received rooms list:", data);
});

socket.on("foundRoom", (data) => {
  console.log("Received found room details:", data);
});

socket.on("roomMessage", (data) => {
  console.log("Received new message in the room:", data);
});

// Handle disconnection
socket.on("disconnect", () => {
  console.log("Disconnected from the server");
});
