const SpotifyWebApi = require('spotify-web-api-node')
const axios = require('axios')

let accessToken, refreshToken, expiresIn, roomID

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
})

const code = new URLSearchParams(window.location.search).get('code')
const d = document.getElementById("loggedin")
const l = document.getElementById("login")

if('refreshToken' in localStorage) {
    refreshToken = localStorage.getItem('refreshToken')
    getRefresh()
    showDisplay()
}
else if(code != null) {
    login()
}

function login() {
    axios.post("/login", {
        code,
    })
    .then(res => {
        accessToken = res.data.accessToken
        refreshToken = res.data.refreshToken
        expiresIn = res.data.expiresIn

        localStorage.setItem('refreshToken', refreshToken)

        spotifyApi.setAccessToken(accessToken)

        window.history.pushState({}, null, '/')
    }).catch(() => {
        window.location = "/"
    })
    showDisplay()
}

function showDisplay() {
    d.style.display = 'block'
    l.style.display = 'none'
    setInterval(getRefresh, (3600-10)*1000)
}

function getRefresh() {
    axios.post("/refresh", {
        refreshToken,
    })
    .then(res => {
        accessToken = res.data.accessToken
        expiresIn = res.data.expiresIn

        spotifyApi.setAccessToken(accessToken)
    }).catch((err) => {
        window.location = "/"
        console.log(err)
    })
}

document.getElementById("join").addEventListener("submit", function (e) {
    e.preventDefault()
    
    let param = document.querySelector('input[name="room"]').value

    window.location = param.toUpperCase()
})

document.getElementById("logout").addEventListener("click", () => {
    localStorage.clear()
    window.location = "/"
})
