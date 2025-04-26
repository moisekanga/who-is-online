const uuid = require("uuid")
const path = require("path")
const fs = require("fs")

const logger = require("../utility/logger")
const {getUser} = require("./lib/api/user")
const { UserPresence} = require("./lib/model/user_presence") // import UserPresence class from user.js file
const USER = new Map() // <userId, UserPresence>
const CONNECTION = new Map() // <connectionId, Connection>


const websocketHandler = (ws) => {
    ws.on("connection", (socket,req) => {
        try {
            // extract the user from the socket
            const connectionId = `conn-${uuid.v4()}`
            const userIdParams = Number(req.url.split('=')[1])
            logger.debug(userIdParams)
            const {id} = getUser(userIdParams)
            const userId = id

            // Avoid mutating the socket object directly
            const enhancedSocket = Object.assign(Object.create(socket), {
                userId: id,
                connectionId,
                connectionTime: new Date()
            })

            // Store the connection
            CONNECTION.set(connectionId, enhancedSocket)

            // Check if user already exists in the USER map
            let userPresence = USER.get(userId)

            if (userPresence) {
                // User exists, update their status and connection
                logger.info("Existing user reconnected", { userId, connectionId })
                userPresence.setStatus("online")
                // Update the connection ID for the existing user
                userPresence.updateConnectionId(connectionId)
            } else {
                // User doesn't exist, create a new UserPresence instance
                logger.info("New user connected", { userId, connectionId })
                userPresence = new UserPresence(userId, connectionId)
                USER.set(userId, userPresence)
            }

            // Move state saving to after successful connection setup
            save_state()

            // Log is already handled in the if/else block above

            socket.on("message", function(data) {
                handleMessage(socket, data);
            })
            socket.on("close", () => handleDisconnection(userId, connectionId))
            socket.on("error", (err) => {
                logger.error("WebSocket error", err)
                cleanup(userId, connectionId)
            })
        } catch (error) {
            logger.error("Error in connection handler", error)
            socket.terminate()
        }
    })
}

const handleMessage = (socket,data) => {
    try {
        const message = JSON.parse(data);
        

        logger.info("Message received", {
            type: message.type,
            userId: message.userId
        });

        // Extract socket information
        const userId = socket.userId;

        switch (message.type) {
            case 'get_online_count':
                // Return the count of online users
               let result =  sendToClient(socket, {
                    type: 'online_count',
                    count: UserPresence.getOnlineCount(),
                    timestamp: new Date().toISOString()
                });
                logger.debug(`Sent online count ${result} ${ UserPresence.getOnlineCount() }`);
                break;

            case 'check_user_status':
                // Check if a specific user is online
                if (!message.targetUserId) {
                    sendToClient(socket, {
                        type: 'error',
                        message: 'Missing targetUserId parameter',
                        timestamp: new Date().toISOString()
                    });
                    break;
                }

                

                const targetUser = USER.get(Number(message.targetUserId));
                const isOnline = targetUser && targetUser.getStatus() === 'online';
                

                sendToClient(socket, {
                    type: 'user_status',
                    userId: message.targetUserId,
                    online: isOnline,
                    lastSeen: targetUser ? targetUser.getLastSeen() : null,
                    timestamp: new Date().toISOString()
                });

                logger.debug("Checked user status", {
                    targetUserId: message.targetUserId,
                    online: isOnline
                });
                break;

            case 'get_all_users':
                // Return a list of all users and their statuses
                const users = [];
                USER.forEach((user, id) => {
                    users.push({
                        userId: id,
                        status: user.getStatus(),
                        lastSeen: user.getLastSeen()
                    });
                });

                sendToClient(socket, {
                    type: 'all_users',
                    users: users,
                    timestamp: new Date().toISOString()
                });

                logger.debug("Sent all users", { count: users.length });
                break;

            default:
                logger.debug("Unknown message type", { type: message.type });
                sendToClient(socket, {
                    type: 'error',
                    message: `Unknown message type: ${message.type}`,
                    timestamp: new Date().toISOString()
                });
        }
    } catch (error) {
        logger.error("Invalid message format or processing error", {
            data,
            error: error.message,
            stack: error.stack
        });

        try {
            // Try to send error back to client
            sendToClient(this, {
                type: 'error',
                message: 'Server error processing message',
                timestamp: new Date().toISOString()
            });
        } catch (sendError) {
            logger.error("Failed to send error message to client", { error: sendError.message });
        }
    }
}

const broadcast = (message) => {
    try {
        const serializedMessage = JSON.stringify(message)
        CONNECTION.forEach((socket) => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(serializedMessage)
            }
        })
        logger.debug("Message broadcast", {
            recipients: CONNECTION.size,
            messageType: message.type
        })
    } catch (error) {
        logger.error("Broadcast failed", error)
    }
}

const save_state = () => {
    try {
        const dataDir = path.join(__dirname, "../data")
        const filePath = path.join(dataDir, "user_state.json")
        const backupPath = path.join(dataDir, "user_state_backup.json")
        const tempPath = path.join(dataDir, "user_state.json.tmp")

        // Ensure directory exists
        !fs.existsSync(dataDir) && fs.mkdirSync(dataDir, { recursive: true })

        // Serialize state with error handling
        const userState = Object.fromEntries(USER)
        const serializedState = JSON.stringify(userState, null, 2)

        // Atomic write with proper error handling
        fs.writeFileSync(tempPath, serializedState, 'utf8')
        fs.existsSync(filePath) && fs.renameSync(filePath, backupPath)
        fs.renameSync(tempPath, filePath)

        logger.debug("State saved", { userCount: USER.size })
    } catch (error) {
        logger.error("Error saving state", error)
        // Attempt to restore from backup if write fails
        restoreFromBackup()
    }
}

const restoreFromBackup = () => {
    try {
        const backupPath = path.join(__dirname, "../data/user_state_backup.json")
        if (fs.existsSync(backupPath)) {
            const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
            USER.clear()
            Object.entries(backup).forEach(([userId, user]) => {
                USER.set(userId, new UserPresence(user.userId, user.connectionId))
            })
            logger.info("State restored from backup")
        }
    } catch (error) {
        logger.error("Failed to restore from backup", error)
    }
}

const handleDisconnection = (userId, connectionId) => {
    try {
        const user = USER.get(userId);
        if (user) {
            // Only update status if currently online
            if (user.getStatus() === "online") {
                user.setStatus("offline");
                // Note: The setStatus method will handle decrementing the online count
            }

            user.setLastSeen();

            // Broadcast status change to all clients
            broadcast({
                type: 'user_status_change',
                userId: userId,
                status: 'offline',
                timestamp: new Date().toISOString(),
                onlineCount: UserPresence.getOnlineCount()
            });
        }

        CONNECTION.delete(connectionId);
        save_state();

        logger.info("Client disconnected", {
            userId,
            connectionId,
            onlineCount: UserPresence.getOnlineCount()
        });
    } catch (error) {
        logger.error("Error in disconnection handler", error);
    }
}

const cleanup = (userId, connectionId) => {
    // Get the user before deleting to check status
    const user = USER.get(userId);

    // If user was online, decrement the online count
    if (user && user.getStatus() === 'online') {
        UserPresence.decrementOnlineCount();
    }

    USER.delete(userId);
    CONNECTION.delete(connectionId);
    save_state();
}

/**
 * Send a message to a specific client
 * @param {WebSocket} socket - The client socket
 * @param {Object} message - The message to send
 * @returns {boolean} Success status
 */
const sendToClient = (socket, message) => {
    try {
        if (socket ) { // WebSocket.OPEN = 1
            logger.debug("Sending message to client", { type: message.type, userId: socket.userId });
            socket.send(JSON.stringify(message));
            return true;
        }
        return false;
    } catch (error) {
        logger.error("Error sending message to client", { error: error.message });
        return false;
    }
}

module.exports = websocketHandler
