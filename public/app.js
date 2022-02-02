const SpotifyWebApi = require('spotify-web-api-node')
const axios = require('axios')

let accessToken, refreshToken, expiresIn, roomID

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
})

const code = new URLSearchParams(window.location.search).get('code')
const d = document.getElementById("loggedin")
const l = document.getElementById("login")

if(code != null) {
    showDisplay()
}

function showDisplay() {
    d.style.display = 'block'
    l.style.display = 'none'

    axios.post("/login", {
        code,
    })
    .then(res => {
        accessToken = res.data.accessToken
        refreshToken = res.data.refreshToken
        expiresIn = res.data.expiresIn
        setInterval(getRefresh, (expiresIn-10)*1000)
        spotifyApi.setAccessToken(accessToken)
        window.history.pushState({}, null, '/')
    }).catch(() => {
        window.location = "/"
    })
}

function getRefresh() {
    axios.post("/refresh", {
        refreshToken,
    })
    .then(res => {
        accessToken = res.data.accessToken
        expiresIn = res.data.expiresIn
    }).catch(() => {
        window.location = "/"
    })
}

document.getElementById("join").addEventListener("submit", function (e) {
    e.preventDefault()
    
    let param = document.querySelector('input[name="room"]').value

    window.location = param
})
