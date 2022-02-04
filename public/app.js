const SpotifyWebApi = require('spotify-web-api-node')
const axios = require('axios')

let accessToken, refreshToken, expiresIn, roomID

const socket = io()
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
})

const code = new URLSearchParams(window.location.search).get('code')
roomID = window.location.pathname.substring(1,)
if(roomID) {
    localStorage.setItem('roomID', roomID)
}

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

        if(localStorage.getItem('roomID')) {
            roomID = localStorage.getItem('roomID')
            window.location = roomID
        }
    }).catch(() => {
        window.location = "/"
    })
    showDisplay()
}

function showDisplay() {
    if(roomID) {
        document.getElementById("roomloggedin").style.display = 'block'
        document.getElementById("roomlogin").style.display = 'none'
        socket.emit('userconnect', roomID, "player")
        socket.on('playerconnect', (name) => {
            console.log(name)
        })
    }
    else {
        document.getElementById("loggedin").style.display = 'block'
        document.getElementById("login").style.display = 'none'
    }
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

if(!roomID) {
    document.getElementById("join").addEventListener("submit", function (e) {
        e.preventDefault()
        
        let param = document.querySelector('input[name="room"]').value
        
        window.location = param.toUpperCase()
    })
    
    document.getElementById("logout").addEventListener("click", () => {
        localStorage.clear()
        window.location = "/"
    })
}
else {
    document.getElementById("message").addEventListener("submit", function (e) {
        e.preventDefault()
        
        let message = document.querySelector('input[name="message"]').value
        document.querySelector('input[name="message"]').value=''
        
        socket.emit('message', roomID, message)
    })
    document.getElementById("leaveroom").addEventListener("click", () => {
        window.location = "/"
    })
}

(function () {
    window.onpageshow = function(event) {
        if (event.persisted) {
            window.location.reload();
        }
    };
})();