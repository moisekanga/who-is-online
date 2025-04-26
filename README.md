# Who Is Online

A real-time user presence tracking microservice that allows applications to monitor which users are currently online and their status.

## Overview

Who Is Online is a lightweight WebSocket-based microservice that provides real-time user presence tracking. It allows applications to:

- Track which users are currently online
- Monitor user status changes (online/offline)
- Get notifications when users connect or disconnect
- Check the last seen time for offline users
- Get a count of online users

The system uses WebSockets for real-time communication, making it perfect for applications that need to display user presence information such as chat applications, collaborative tools, or any platform where knowing who is currently active is important.

## Features

- **Real-time presence tracking**: Track who is online in real-time
- **Status management**: Users can set their status (online/offline)
- **Last seen tracking**: Automatically records when users were last active
- **User count**: Get the total number of online users
- **Status checking**: Check if a specific user is online
- **Persistent state**: User presence data is saved to disk and survives server restarts
- **Lightweight**: Minimal dependencies and efficient design

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- pnpm package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/who-is-online.git
   cd who-is-online
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env` file in the root directory:
   ```
   PORT=3050
   ENVIRONMENT=development
   ```

4. Start the server:
   ```bash
   pnpm run dev
   ```

## WebSocket API

The system provides a WebSocket API that can be integrated into any application. Connect to the WebSocket server at:

```
ws://localhost:3050/ws?userId=YOUR_USER_ID
```

### Client to Server Messages

| Message Type | Description | Example |
|--------------|-------------|---------|
| `get_online_count` | Get the number of online users | `{ "type": "get_online_count" }` |
| `check_user_status` | Check if a user is online | `{ "type": "check_user_status", "targetUserId": "123" }` |
| `get_all_users` | Get a list of all users | `{ "type": "get_all_users" }` |
| `set_status` | Set your status | `{ "type": "set_status", "status": "online" }` |
| `identify` | Set your username | `{ "type": "identify", "username": "john_doe" }` |

### Server to Client Messages

| Message Type | Description | Example |
|--------------|-------------|---------|
| `welcome` | Welcome message on connection | `{ "type": "welcome", "userId": "123", "message": "Connected to server" }` |
| `online_count` | Number of online users | `{ "type": "online_count", "count": 5, "timestamp": "2023-04-25T10:30:00Z" }` |
| `user_status` | Status of a specific user | `{ "type": "user_status", "userId": "123", "online": true, "lastSeen": "2023-04-25T10:30:00Z" }` |
| `all_users` | List of all users | `{ "type": "all_users", "users": [{"userId": "123", "status": "online"}], "timestamp": "2023-04-25T10:30:00Z" }` |
| `status_updated` | Confirmation of status update | `{ "type": "status_updated", "status": "online", "timestamp": "2023-04-25T10:30:00Z" }` |
| `user_status_change` | Notification of user status change | `{ "type": "user_status_change", "userId": "123", "status": "offline", "timestamp": "2023-04-25T10:30:00Z" }` |
| `error` | Error message | `{ "type": "error", "message": "Invalid request", "timestamp": "2023-04-25T10:30:00Z" }` |

## State Persistence

The system persists user presence data to disk in JSON format. This allows the server to recover its state after a restart. The state files are stored in the `data` directory:

- `user_state.json`: The main state file
- `user_state_backup.json`: A backup of the state file

## Logging

The system uses a comprehensive logging system with different log levels:

- **info**: General information messages
- **error**: Error messages
- **debug**: Detailed debug information (only shown in development)

Logs are written to both the console and log files in the `logs` directory.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Express and WebSocket
- Uses Winston for logging