const SpotifyWebApi = require('spotify-web-api-node')
const axios = require('axios')

let roomID

const socket = io()

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
})

getAccessToken()

function getAccessToken() {
    axios.get('/access')
        .then(res => {
            spotifyApi.setAccessToken(res.data.accessToken)
        }).catch((err) => {
            console.log(err)
        })
}

roomID = window.location.pathname.substring(1,)

if (!roomID) {
    document.getElementById("join").addEventListener("submit", function (e) {
        e.preventDefault()

        let param = document.querySelector('input[name="room"]').value

        window.location = param.toUpperCase()
    })
}
else {
    socket.emit('userconnect', roomID, "player")

    socket.on('playerconnect', (name) => {
        console.log(name)
    })

    socket.on('addtrack', (id) => {
        const iframe = document.createElement('iframe')
        iframe.setAttribute('src', "https://open.spotify.com/embed/track/" + id + "?utm_source=generator&theme=0")
        iframe.setAttribute('height', "80")
        iframe.setAttribute('width', "100%")
        iframe.setAttribute('allow', "clipboard-write; encrypted-media")
        iframe.setAttribute('frameBorder', "0")
        document.getElementById('show').appendChild(iframe)
    })

    function debounce(callback, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(function () { callback.apply(this, args); }, wait);
        };
    }

    document.getElementById("search").addEventListener('keyup', debounce(() => {
        let search = document.getElementById("search").value
        if (search) {
            document.getElementById('show').style.display = 'none'
            getAccessToken()
            spotifyApi.searchTracks(search).then(res => {
                document.getElementById('results').innerHTML = ""
                res.body.tracks.items.forEach(track => {
                    const template = document.querySelector('#r')
                    const result = template.content.cloneNode(true)
                    result.querySelector('img').src = track.album.images[2].url
                    result.querySelector('h3').innerHTML = track.name
                    result.querySelector('.song').onclick = () => {
                        socket.emit('puttrack', roomID, track.id)
                        document.getElementById('results').innerHTML = ""
                        document.getElementById("search").value = ''
                        document.getElementById('show').style.display = 'block'
                    }
                    document.getElementById('results').appendChild(result)
                })
            }).catch(err => {
                console.log(err)
            })
        }
        else {
            document.getElementById('results').innerHTML = ""
        }
    }, 100))

    document.getElementById("message").addEventListener("submit", function (e) {
        e.preventDefault()

        let message = document.querySelector('input[name="message"]').value
        document.querySelector('input[name="message"]').value = ''

        socket.emit('message', roomID, message)
    })

    document.getElementById("leaveroom").addEventListener("click", () => {
        window.location = "/"
    })
}

(function () {
    window.onpageshow = function (event) {
        if (event.persisted) {
            window.location.reload();
        }
    };
})();