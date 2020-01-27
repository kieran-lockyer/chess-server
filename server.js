const uuidv4 = require('uuid/v4');

const WebSocketServer = require('ws').Server
const wss = new WebSocketServer({port: 9090})

const games = []
wss.on('connection', (connection, req) => {
    connection.on('message', (message) => {
        const data = JSON.parse(message)
        console.log('message', data)
        if (data.action === 'searching') {
            console.log('searching')
            const player = data.token
            let openGameFound = false
            for (let game of games) {
                if (game.white && !game.black) {
                    if (game.white !== player) {
                        console.log('found an opponent')
                        game.black = player
                        game.connections.push(connection)
                        openGameFound = true
                        connection.send(JSON.stringify({token: game.black, position: 'black', state: 'begin'}))
                        game.connections[0].send(JSON.stringify({state: 'begin'}))
                        break
                    }
                }
            }
            if (!openGameFound) {
                console.log('creating new game')
                const newGame = { 
                    id: uuidv4(),
                    white: player,
                    connections: [connection]
                }
                games.push(newGame)
                connection.send(JSON.stringify({token: newGame.white, position: 'white'}))
            }
        } else {
            console.log('move', data.token)
            for (let game of games) {
                if (game.white === data.token || game.black === data.token) {
                    for (connection of game.connections) {
                        connection.send(JSON.stringify({move: data.move, token: data.token}))
                    }
                }
            }
        }
    })
})