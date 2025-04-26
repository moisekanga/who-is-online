# Who Is Online - Technical Design Document

This document provides a comprehensive technical overview of the Who Is Online system architecture, components, and implementation details. It is intended for developers who want to understand the system design or implement a similar system in another programming language.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Data Structures](#data-structures)
5. [Communication Protocol](#communication-protocol)
6. [State Management](#state-management)
7. [Error Handling](#error-handling)
8. [Scalability Considerations](#scalability-considerations)
9. [Implementation Guidelines](#implementation-guidelines)
10. [Sequence Diagrams](#sequence-diagrams)

## System Overview

Who Is Online is a real-time user presence tracking system that allows applications to monitor which users are currently online and their status. The system uses WebSockets for real-time bidirectional communication between clients and the server.

### Key Features

- Real-time presence tracking
- User status management (online/offline)
- Last seen tracking
- Online user counting
- Status checking for specific users
- Persistent state storage

## Architecture

The system follows a client-server architecture with WebSockets as the primary communication protocol. The architecture consists of the following layers:

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐    │
│  │ Web Browser │   │ Mobile App  │   │ Desktop Client  │    │
│  └─────────────┘   └─────────────┘   └─────────────────┘    │
└───────────────────────────┬─────────────────────────────────┘
                            │ WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Server Layer                           │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐    │
│  │ HTTP Server │   │ WebSocket   │   │ Express/Web     │    │
│  │             │◄──┤ Server      │   │ Framework       │    │
│  └─────────────┘   └─────────────┘   └─────────────────┘    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐    │
│  │ WebSocket   │   │ User        │   │ State           │    │
│  │ Handler     │   │ Presence    │   │ Management      │    │
│  └─────────────┘   └─────────────┘   └─────────────────┘    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Persistence Layer                       │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐    │
│  │ File System │   │ Logging     │   │ (Optional DB)   │    │
│  │ Storage     │   │ System      │   │                 │    │
│  └─────────────┘   └─────────────┘   └─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. HTTP Server

The HTTP server handles standard HTTP requests and hosts the WebSocket server.

**Responsibilities:**
- Serve static files (if needed)
- Host the WebSocket server
- Handle API requests (if needed)

**Pseudocode:**
```
function createServer(port):
    httpServer = createHTTPServer()
    
    // Configure routes if needed
    httpServer.addRoute("/api/users", handleUsersRequest)
    
    // Start listening
    httpServer.listen(port)
    
    return httpServer
```

### 2. WebSocket Server

The WebSocket server manages WebSocket connections and routes messages to the appropriate handlers.

**Responsibilities:**
- Accept and manage WebSocket connections
- Extract user ID from connection parameters
- Route incoming messages to handlers
- Broadcast messages to connected clients
- Handle connection lifecycle (open, close, error)

**Pseudocode:**
```
function createWebSocketServer(httpServer):
    wsServer = new WebSocketServer({ server: httpServer, path: "/ws" })
    
    // Set up connection handler
    wsServer.onConnection(handleConnection)
    
    return wsServer
    
function handleConnection(socket, request):
    // Extract user ID from URL parameters
    userId = extractUserIdFromURL(request.url)
    
    // Validate user ID
    if (!isValidUserId(userId)):
        socket.send(errorMessage("Invalid user ID"))
        socket.close()
        return
    
    // Set up event handlers
    socket.onMessage(handleMessage)
    socket.onClose(handleDisconnection)
    socket.onError(handleError)
    
    // Process new connection
    processNewConnection(socket, userId)
```

### 3. WebSocket Handler

The WebSocket handler processes incoming messages and implements the business logic for the presence system.

**Responsibilities:**
- Parse and validate incoming messages
- Execute business logic based on message type
- Generate response messages
- Manage user presence state

**Pseudocode:**
```
function handleMessage(data, socket):
    try:
        // Parse message
        message = parseJSON(data)
        
        // Get user ID
        userId = socket.userId
        
        // Handle message based on type
        switch (message.type):
            case "get_online_count":
                handleGetOnlineCount(socket)
                break
                
            case "check_user_status":
                handleCheckUserStatus(socket, message.targetUserId)
                break
                
            case "get_all_users":
                handleGetAllUsers(socket)
                break
                
            case "set_status":
                handleSetStatus(socket, userId, message.status)
                break
                
            default:
                socket.send(errorMessage("Unknown message type"))
    catch (error):
        logError("Error handling message", error)
        socket.send(errorMessage("Error processing message"))
```

### 4. User Presence

The User Presence component manages the state of each user in the system.

**Responsibilities:**
- Track user status (online/offline)
- Record last seen timestamps
- Maintain connection information
- Count online users

**Pseudocode:**
```
class UserPresence:
    // Static properties
    static onlineCount = 0
    
    // Constructor
    constructor(userId, connectionId):
        this.userId = userId
        this.connectionId = connectionId
        this._status = "online"
        this._lastSeen = currentDateTime()
        this.username = null
        
        // Increment online count
        UserPresence.incrementOnlineCount()
    
    // Methods
    setStatus(newStatus):
        if (newStatus === "online" || newStatus === "offline"):
            // Only update if status is changing
            if (this._status !== newStatus):
                // Update online count
                if (newStatus === "online"):
                    UserPresence.incrementOnlineCount()
                else:
                    UserPresence.decrementOnlineCount()
                
                // Set new status
                this._status = newStatus
    
    getStatus():
        return this._status
    
    setLastSeen():
        this._lastSeen = currentDateTime()
    
    getLastSeen():
        return this._lastSeen
```

### 5. State Management

The State Management component handles persistence of the system state.

**Responsibilities:**
- Save state to disk
- Load state from disk
- Handle recovery from failures
- Manage state file integrity

**Pseudocode:**
```
function saveState():
    try:
        // Create data directory if it doesn't exist
        ensureDirectoryExists(dataDirectory)
        
        // Define file paths
        mainFilePath = joinPath(dataDirectory, "user_state.json")
        backupFilePath = joinPath(dataDirectory, "user_state_backup.json")
        tempFilePath = joinPath(dataDirectory, "user_state.json.tmp")
        
        // Convert user map to serializable object
        userState = {}
        for each (userId, user) in USER_MAP:
            userState[userId] = {
                userId: user.userId,
                connectionId: user.connectionId,
                status: user.getStatus(),
                lastSeen: user.getLastSeen(),
                username: user.username
            }
        
        // Write to temporary file
        writeFile(tempFilePath, serializeJSON(userState))
        
        // Create backup if main file exists
        if fileExists(mainFilePath):
            renameFile(mainFilePath, backupFilePath)
        
        // Rename temporary file to main file
        renameFile(tempFilePath, mainFilePath)
        
        logInfo("State saved successfully")
    catch (error):
        logError("Error saving state", error)

function loadState():
    try:
        // Check if main file exists
        if fileExists(mainFilePath):
            data = readFile(mainFilePath)
            userState = parseJSON(data)
            
            // Restore state
            for each (userId, userData) in userState:
                user = new UserPresence(userData.userId, userData.connectionId)
                user.setStatus(userData.status || "offline")
                if userData.lastSeen:
                    user._lastSeen = parseDateTime(userData.lastSeen)
                user.username = userData.username
                USER_MAP.set(userId, user)
            
            logInfo("State loaded successfully")
        else if fileExists(backupFilePath):
            // Try to recover from backup
            logWarn("Main state file not found, recovering from backup")
            // Similar recovery logic as above
        else:
            logInfo("No saved state found")
    catch (error):
        logError("Error loading state", error)
        // Try to recover from backup if main file failed
```

### 6. Logging System

The Logging System records system events and errors.

**Responsibilities:**
- Log system events
- Log errors and warnings
- Configure log levels based on environment
- Write logs to files and console

**Pseudocode:**
```
class Logger:
    constructor(options):
        this.logLevel = options.logLevel || "info"
        this.logToConsole = options.logToConsole || true
        this.logToFile = options.logToFile || true
        this.logDirectory = options.logDirectory || "./logs"
        
        // Create log directory if it doesn't exist
        ensureDirectoryExists(this.logDirectory)
    
    log(level, message, metadata):
        // Check if we should log this level
        if !shouldLog(this.logLevel, level):
            return
        
        // Create log entry
        entry = {
            timestamp: currentDateTime(),
            level: level,
            message: message,
            metadata: metadata
        }
        
        // Log to console if enabled
        if this.logToConsole:
            logToConsole(entry)
        
        // Log to file if enabled
        if this.logToFile:
            logToFile(entry, level)
    
    info(message, metadata):
        this.log("info", message, metadata)
    
    error(message, error, metadata):
        this.log("error", message, { ...metadata, error: error.message, stack: error.stack })
    
    debug(message, metadata):
        this.log("debug", message, metadata)
```

## Data Structures

### User Presence Object

```
UserPresence {
    // Public properties
    userId: String           // Unique identifier for the user
    connectionId: String     // Identifier for the connection
    username: String         // Optional username
    
    // Private properties
    _status: String          // "online" or "offline"
    _lastSeen: DateTime      // When the user was last seen
    
    // Static properties
    static onlineCount: Integer  // Count of online users
    
    // Methods
    setStatus(newStatus)
    getStatus()
    setLastSeen()
    getLastSeen()
    updateConnectionId(connectionId)
    setUsername(username)
    
    // Static methods
    static getOnlineCount()
    static incrementOnlineCount()
    static decrementOnlineCount()
}
```

### Connection Maps

```
USER_MAP: Map<userId, UserPresence>
CONNECTION_MAP: Map<connectionId, WebSocketConnection>
```

### Message Structure

```
ClientMessage {
    type: String             // Message type
    userId: String           // User ID
    [additional fields based on message type]
}

ServerMessage {
    type: String             // Message type
    timestamp: DateTime      // When the message was sent
    [additional fields based on message type]
}
```

## Communication Protocol

The system uses a JSON-based message protocol for communication between clients and the server.

### Client to Server Messages

| Message Type | Description | Fields | Example |
|--------------|-------------|--------|---------|
| `get_online_count` | Get the number of online users | None | `{ "type": "get_online_count", "userId": "123" }` |
| `check_user_status` | Check if a user is online | `targetUserId` | `{ "type": "check_user_status", "userId": "123", "targetUserId": "456" }` |
| `get_all_users` | Get a list of all users | None | `{ "type": "get_all_users", "userId": "123" }` |
| `set_status` | Set your status | `status` | `{ "type": "set_status", "userId": "123", "status": "online" }` |
| `identify` | Set your username | `username` | `{ "type": "identify", "userId": "123", "username": "john_doe" }` |

### Server to Client Messages

| Message Type | Description | Fields | Example |
|--------------|-------------|--------|---------|
| `welcome` | Welcome message on connection | `userId`, `message` | `{ "type": "welcome", "userId": "123", "message": "Connected to server" }` |
| `online_count` | Number of online users | `count` | `{ "type": "online_count", "count": 5, "timestamp": "..." }` |
| `user_status` | Status of a specific user | `userId`, `online`, `lastSeen` | `{ "type": "user_status", "userId": "456", "online": true, "timestamp": "..." }` |
| `all_users` | List of all users | `users` | `{ "type": "all_users", "users": [...], "timestamp": "..." }` |
| `status_updated` | Confirmation of status update | `status` | `{ "type": "status_updated", "status": "online", "timestamp": "..." }` |
| `user_status_change` | Notification of user status change | `userId`, `status` | `{ "type": "user_status_change", "userId": "456", "status": "offline", "timestamp": "..." }` |
| `error` | Error message | `message` | `{ "type": "error", "message": "Invalid request", "timestamp": "..." }` |

## State Management

The system persists its state to disk to survive server restarts. The state is saved in a JSON file with the following structure:

```json
{
  "user-123": {
    "userId": "user-123",
    "connectionId": "conn-456",
    "status": "online",
    "lastSeen": "2023-04-25T10:30:00.000Z",
    "username": "john_doe"
  },
  "user-456": {
    "userId": "user-456",
    "connectionId": "conn-789",
    "status": "offline",
    "lastSeen": "2023-04-25T11:45:00.000Z",
    "username": "jane_smith"
  }
}
```

### State Persistence Algorithm

```
function save_state():
    1. Create data directory if it doesn't exist
    2. Define paths for main file, backup file, and temporary file
    3. Convert USER map to serializable object
    4. Write serialized object to temporary file
    5. If main file exists, create backup
    6. Rename temporary file to main file
    7. Log success or failure

function load_state():
    1. Check if main file exists
    2. If yes, read and parse file
    3. If no, check if backup file exists
    4. If backup exists, read and parse backup file
    5. For each user in parsed data:
        a. Create UserPresence object
        b. Set properties from saved data
        c. Add to USER map
    6. Log success or failure
```

## Error Handling

The system implements comprehensive error handling at multiple levels:

### Connection Level

- Handle WebSocket connection errors
- Detect and clean up stale connections
- Gracefully handle unexpected disconnections

### Message Level

- Validate incoming message format
- Handle malformed JSON
- Validate required fields
- Handle unknown message types

### State Level

- Use safe write pattern for state files
- Implement backup and recovery mechanisms
- Handle file system errors

### Logging

- Log all errors with stack traces
- Use different log levels based on severity
- Write logs to both console and files

## Scalability Considerations

While the current implementation is designed for a single server, here are considerations for scaling the system:

### Horizontal Scaling

To scale horizontally across multiple servers:

1. **Shared State**: Implement a shared state mechanism using Redis or a similar in-memory database
2. **Message Broker**: Use a message broker like RabbitMQ or Kafka for cross-server communication
3. **Load Balancer**: Add a load balancer in front of the WebSocket servers
4. **Sticky Sessions**: Implement sticky sessions to ensure clients connect to the same server

### Vertical Scaling

To improve performance on a single server:

1. **Connection Pooling**: Implement connection pooling for database connections
2. **Optimized Data Structures**: Use efficient data structures for in-memory storage
3. **Batched Operations**: Batch disk writes to reduce I/O overhead
4. **Compression**: Implement WebSocket compression

## Implementation Guidelines

This section provides language-agnostic guidelines for implementing the system.

### Server Implementation

```
// Pseudocode for server implementation
function startServer(port):
    httpServer = createHTTPServer()
    wsServer = createWebSocketServer(httpServer)
    
    // Set up HTTP routes if needed
    httpServer.route("/api/*", handleAPIRequest)
    
    // Set up WebSocket handler
    wsServer.onConnection(handleWebSocketConnection)
    
    // Start the server
    httpServer.listen(port)
    log("Server started on port " + port)

function handleWebSocketConnection(socket, request):
    // Extract user ID from URL parameters
    userId = extractUserIdFromURL(request.url)
    
    // Validate user ID
    if (!isValidUserId(userId)):
        socket.send(errorMessage("Invalid user ID"))
        socket.close()
        return
    
    // Generate connection ID
    connectionId = generateUniqueId()
    
    // Check if user already exists
    userPresence = USER_MAP.get(userId)
    if (userPresence):
        // Update existing user
        userPresence.setStatus("online")
        userPresence.updateConnectionId(connectionId)
    else:
        // Create new user
        userPresence = new UserPresence(userId, connectionId)
        USER_MAP.set(userId, userPresence)
    
    // Store connection
    CONNECTION_MAP.set(connectionId, socket)
    
    // Save state
    saveState()
    
    // Send welcome message
    socket.send(welcomeMessage(userId))
    
    // Set up event handlers
    socket.onMessage(handleMessage)
    socket.onClose(() => handleDisconnection(userId, connectionId))
    socket.onError(() => handleError(userId, connectionId))
    
    // Broadcast updated user list
    broadcastUserList()
```

### Message Handling

```
// Pseudocode for message handling
function handleMessage(data, socket):
    try:
        // Parse message
        message = parseJSON(data)
        
        // Get user ID and connection ID
        userId = socket.userId
        
        // Handle message based on type
        switch (message.type):
            case "get_online_count":
                handleGetOnlineCount(socket)
                break
                
            case "check_user_status":
                handleCheckUserStatus(socket, message.targetUserId)
                break
                
            case "get_all_users":
                handleGetAllUsers(socket)
                break
                
            case "set_status":
                handleSetStatus(socket, userId, message.status)
                break
                
            case "identify":
                handleIdentify(socket, userId, message.username)
                break
                
            default:
                socket.send(errorMessage("Unknown message type"))
    catch (error):
        log.error("Error handling message", error)
        socket.send(errorMessage("Error processing message"))

function handleGetOnlineCount(socket):
    socket.send({
        type: "online_count",
        count: UserPresence.getOnlineCount(),
        timestamp: currentDateTime()
    })

function handleCheckUserStatus(socket, targetUserId):
    targetUser = USER_MAP.get(targetUserId)
    isOnline = targetUser && targetUser.getStatus() === "online"
    
    socket.send({
        type: "user_status",
        userId: targetUserId,
        online: isOnline,
        lastSeen: targetUser ? targetUser.getLastSeen() : null,
        timestamp: currentDateTime()
    })

function handleGetAllUsers(socket):
    users = []
    
    for each (userId, user) in USER_MAP:
        users.push({
            userId: userId,
            status: user.getStatus(),
            lastSeen: user.getLastSeen(),
            username: user.username
        })
    
    socket.send({
        type: "all_users",
        users: users,
        timestamp: currentDateTime()
    })

function handleSetStatus(socket, userId, status):
    user = USER_MAP.get(userId)
    
    if (user):
        user.setStatus(status)
        
        if (status === "offline"):
            user.setLastSeen()
        
        saveState()
        
        socket.send({
            type: "status_updated",
            status: status,
            timestamp: currentDateTime()
        })
        
        broadcastStatusChange(userId, status)
    }
```

### Disconnection Handling

```
// Pseudocode for disconnection handling
function handleDisconnection(userId, connectionId):
    try:
        // Get user
        user = USER_MAP.get(userId)
        
        if (user):
            // Update status to offline
            user.setStatus("offline")
            user.setLastSeen()
            
            // Broadcast status change
            broadcastStatusChange(userId, "offline")
        
        // Remove connection
        CONNECTION_MAP.delete(connectionId)
        
        // Save state
        saveState()
        
        log("Client disconnected", { userId, connectionId })
    catch (error):
        log.error("Error handling disconnection", error)
    }

function broadcastStatusChange(userId, status):
    message = {
        type: "user_status_change",
        userId: userId,
        status: status,
        timestamp: currentDateTime()
    }
    
    for each (connection) in CONNECTION_MAP.values():
        if (connection.readyState === OPEN):
            connection.send(message)
    }
```

## Sequence Diagrams

### Connection Sequence

```
Client                    Server                    UserPresence
  |                         |                           |
  | Connect (userId)        |                           |
  |------------------------>|                           |
  |                         | Check if user exists      |
  |                         |-------------------------->|
  |                         |                           |
  |                         | Create/Update user        |
  |                         |-------------------------->|
  |                         |                           |
  |                         | Save state                |
  |                         |-------------------------->|
  |                         |                           |
  | Welcome message         |                           |
  |<------------------------|                           |
  |                         |                           |
  | Broadcast user list     |                           |
  |<------------------------|                           |
  |                         |                           |
```

### Status Change Sequence

```
Client                    Server                    UserPresence
  |                         |                           |
  | set_status              |                           |
  |------------------------>|                           |
  |                         | Update status             |
  |                         |-------------------------->|
  |                         |                           |
  |                         | Update online count       |
  |                         |-------------------------->|
  |                         |                           |
  |                         | Save state                |
  |                         |-------------------------->|
  |                         |                           |
  | status_updated          |                           |
  |<------------------------|                           |
  |                         |                           |
  | Broadcast status change |                           |
  |<------------------------|                           |
  |                         |                           |
```

### Disconnection Sequence

```
Client                    Server                    UserPresence
  |                         |                           |
  | Disconnect              |                           |
  |------------------------>|                           |
  |                         | Set status to offline     |
  |                         |-------------------------->|
  |                         |                           |
  |                         | Update last seen          |
  |                         |-------------------------->|
  |                         |                           |
  |                         | Decrement online count    |
  |                         |-------------------------->|
  |                         |                           |
  |                         | Save state                |
  |                         |-------------------------->|
  |                         |                           |
  |                         | Broadcast status change   |
  |<------------------------|                           |
  |                         |                           |
```

---

This technical design document provides a comprehensive overview of the Who Is Online system architecture and implementation details. Developers can use this document to understand the system design or implement a similar system in another programming language.
