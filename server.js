const http = require("http")
const WebSocket = require("ws")
const express = require("express")
const websocketHandler = require("./src/websocker_handler")
const logger = require("./utility/logger")
require("dotenv").config()

// Import the app router
const appRouter = require("./src/app")

// Create Express app
const app = express()

// Use the router
app.use(appRouter)

// Create HTTP server
const server = http.createServer(app)

const PORT = process.env.PORT || 3050


server.listen(PORT,() => {
    logger.info(`Server listening on ${PORT}`)
})

const websocketServer = new WebSocket.Server({ server })


websocketHandler(websocketServer)