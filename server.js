const express = require('express')
const path = require('path')
require('dotenv').config({ path: "./.env" });
const PORT = process.env.PORT || 3000
const app = express()
const server = require('http').createServer(app)
const cors = require('cors')
const SpotifyWebApi = require('spotify-web-api-node')

const spotifyApi = new SpotifyWebApi({
  redirectUri: process.env.REDIRECT_URI,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
})

app.use(express.static(path.join(__dirname, "public")))
app.use(cors())
app.use(express.json()) //For JSON requests
app.use(express.urlencoded({extended: true}));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))

app.post("/login", (req, res) => {
    const code = req.body.code
    spotifyApi
    .authorizationCodeGrant(code)
      .then(data => {
        spotifyApi.setRefreshToken(data.body.refresh_token)
        spotifyApi.setAccessToken(data.body.access_token)
        res.json({
          accessToken: data.body.access_token,
          refreshToken: data.body.refresh_token,
          expiresIn: data.body.expires_in,
        })
      })
      .catch(err => {
        console.log(err)
        res.sendStatus(400)
      })
})

app.post("/refresh", (req, res) => {
  spotifyApi
    .refreshAccessToken()
    .then(data => {
      res.json({
        accessToken: data.body.access_token,
        expiresIn: data.body.expires_in,
      })
    })
    .catch(err => {
      console.log(err)
      res.sendStatus(400)
    })
})