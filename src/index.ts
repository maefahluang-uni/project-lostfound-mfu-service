const express = require("express");
import cors from "cors";
import { apiRouter } from "../routes";
import { Server } from 'socket.io';
import { createServer } from "http";
const app = express();

const PORT = 3001;
const SERVER_PORT = 8181

app.use(cors());
app.use(express.json());
app.use("/api", apiRouter);

const server = createServer(app);
export const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('join_room', (data) => {
    const chatRoomId = data.data.chatRoomId
    socket.join(chatRoomId)
    console.log(`a user joined ${JSON.stringify(chatRoomId)}`)
    socket.emit("room_joined", `joined room: ${JSON.stringify(chatRoomId)}`)
  })

  socket.on('disconnect', () => console.log('user disconnected'));
});

server.listen(PORT, () => {console.log("SERVER IS LISTENING ON " + PORT)})

