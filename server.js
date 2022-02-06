const express = require('express')
const path = require('path')
require('dotenv').config({ path: "./.env" });
const PORT = process.env.PORT || 3000
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const cors = require('cors')
const SpotifyWebApi = require('spotify-web-api-node')

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
})

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

app.set('view engine', 'ejs')

app.use(express.static(path.join(__dirname, "public")))
app.use(cors())
app.use(express.json()) //For JSON requests
app.use(express.urlencoded({extended: true}));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))

const rooms = {}
const ingame = {}
let access_token

newToken();

function newToken(){
  spotifyApi
  .clientCredentialsGrant()
    .then(data => {
      access_token = data.body.access_token
        spotifyApi.setAccessToken(access_token)
    }
  ).catch(err => {
    console.log(err)
  })
}

setInterval(newToken, (3600 - 10) * 1000);

app.get('/access', (req, res) => {
  res.json({
    accessToken: access_token
  })
})

app.get("/", (req, res) => {
  res.render("index")
})

app.post('/room', (req, res) => {
  let roomID = ""
  do {
    roomID = generateRoomID()
  }
  while (rooms[roomID] != null && rooms[roomID].users.length>0)

  rooms[roomID] = { users: {} }
  res.redirect(roomID)
})

app.get('/:room', (req, res) => {
  if (rooms[req.params.room] == null) {
    return res.redirect('/')
  }
  res.render("room")
})

io.on('connection', socket => {
  socket.on('userconnect', (room, name) => {
    socket.join(room) 
    name += " "+(Object.keys(rooms[room].users).length+1)
    rooms[room].users[socket.id] = name
    ingame[socket.id] = true;
    console.log(name+" connected")
    console.log(ingame[socket.id])
    io.sockets.to(room).emit('playerconnect', name)
  })

  socket.on('message', (room, message) => {
    ingame[socket.id] = false
    console.log(ingame[socket.id])
    console.log(rooms[room].users[socket.id]+": "+message)
  })

  socket.on('puttrack', (room, id) => {
    io.sockets.to(room).emit('addtrack', id)
  })

  socket.on('disconnect', () => {
    getUserRooms(socket).forEach(room => {
      io.sockets.to(room).emit('playerdisconnect', rooms[room].users[socket.id])
      delete rooms[room].users[socket.id]
    })
    delete ingame[socket.id]
  })
})

function getUserRooms(socket) {
  return Object.entries(rooms).reduce((names, [name, room]) => {
    if (room.users[socket.id] != null) names.push(name)
    return names
  }, [])
}

function generateRoomID() {
  let roomID = ""
  while(roomID.length < 5) {
    roomID+=ALPHABET[Math.floor(Math.random() * 26)];
  }
  return roomID
}