const uuidv4 = require('uuid/v4');

const WebSocketServer = require('ws').Server
const wss = new WebSocketServer({port: 3001})

const games = []
wss.on('connection', (connection, req) => {
    connection.on('message', (message) => {
        const data = JSON.parse(message)
        if (data.action === 'searching') {
            const player = data.token
            let openGameFound = false
            for (let game of games) {
                if (game.white && !game.black) {
                    if (game.white !== player) {
                        game.black = player
                        game.connections.push(connection)
                        openGameFound = true
                        connection.send(JSON.stringify({token: game.black, position: 'Black', state: 'begin'}))
                        game.connections[0].send(JSON.stringify({state: 'begin'}))
                        break
                    }
                }
            }
            if (!openGameFound) {
                const newGame = { 
                    id: uuidv4(),
                    white: player,
                    connections: [connection]
                }
                games.push(newGame)
                connection.send(JSON.stringify({token: newGame.white, position: 'White'}))
            }
        } else if (data.action === 'move') {
            for (let game of games) {
                if (game.white === data.token || game.black === data.token) {
                    for (connection of game.connections) {
                        connection.send(JSON.stringify({move: data.move, token: data.token}))
                    }
                }
            }
        } else if (data.action === 'promote_pawn') {
            for (let game of games) {
                if (game.white === data.token || game.black === data.token) {
                    for (connection of game.connections) {
                        connection.send(JSON.stringify({promote_pawn: data.move, token: data.token}))
                    }
                }
            }
        }
    })
})