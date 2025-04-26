// DOM Elements
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const userSelect = document.getElementById('user-select');
const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const statusOnlineBtn = document.getElementById('status-online-btn');
const statusOfflineBtn = document.getElementById('status-offline-btn');
const currentStatus = document.getElementById('current-status');
const checkUserSelect = document.getElementById('check-user-select');
const checkStatusBtn = document.getElementById('check-status-btn');
const statusResult = document.getElementById('status-result');
const refreshUsersBtn = document.getElementById('refresh-users-btn');
const usersList = document.getElementById('users-list');
const onlineCountElement = document.getElementById('online-count');
const activityLog = document.getElementById('activity-log');
const clearLogBtn = document.getElementById('clear-log-btn');

// WebSocket connection
let socket = null;
let userId = null;
let userName = null;

// Connect to WebSocket server
function connect() {
    userId = userSelect.value;
    
    if (!userId) {
        logActivity('error', 'Please select a user to connect as.');
        return;
    }
    
    userName = userSelect.options[userSelect.selectedIndex].text;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    const port = WS_PORT || 3050;
    
    const wsUrl = `${protocol}//${host}:${port}/ws?userId=${userId}`;
    
    logActivity('system', `Connecting as ${userName}...`);
    
    try {
        socket = new WebSocket(wsUrl);
        
        // Connection opened
        socket.addEventListener('open', () => {
            updateConnectionStatus(true);
            logActivity('success', `Connected as ${userName}`);
            
            // Get initial data
            sendMessage('get_online_count');
            sendMessage('get_all_users');
        });
        
        // Listen for messages
        socket.addEventListener('message', (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log("Received message:", message);
                handleServerMessage(message);
            } catch (error) {
                logActivity('error', `Error parsing message: ${error.message}`);
                console.error('Error parsing message:', error);
            }
        });
        
        // Connection closed
        socket.addEventListener('close', () => {
            updateConnectionStatus(false);
            logActivity('system', 'Disconnected from server');
        });
        
        // Connection error
        socket.addEventListener('error', (event) => {
            updateConnectionStatus(false);
            logActivity('error', 'WebSocket connection error');
            console.error('WebSocket error:', event);
        });
    } catch (error) {
        logActivity('error', `Connection error: ${error.message}`);
        console.error('Connection error:', error);
    }
}

// Disconnect from WebSocket server
function disconnect() {
    if (socket) {
        socket.close();
        socket = null;
    }
}

// Send a message to the server
function sendMessage(type, data = {}) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        const message = {
            type,
            userId,
            ...data
        };
        logActivity(message)
        socket.send(JSON.stringify(message));
        logActivity('info', `Sent ${type} request--`);
    } else {
        logActivity('error', 'Cannot send message: not connected');
    }
}

// Handle messages from the server
function handleServerMessage(message) {
    console.log('Received message:', message);
    
    switch (message.type) {
        case 'welcome':
            logActivity('success', `Server: ${message.message}`);
            break;
            
        case 'online_count':
            onlineCountElement.textContent = message.count;
            logActivity('info', `Online users count: ${message.count}`);
            break;
            
        case 'user_status':
            displayUserStatus(message);
            break;
            
        case 'all_users':
            console.log(message)
            displayAllUsers(message.users);
            logActivity('info', `Received list of ${message.users.length} users`);
            break;
            
        case 'status_updated':
            currentStatus.textContent = message.status;
            logActivity('success', `Your status updated to: ${message.status}`);
            break;
            
        case 'user_status_change':
            // Refresh data when a user's status changes
            sendMessage('get_online_count');
            sendMessage('get_all_users');
            logActivity('info', `User ${message.userId} is now ${message.status}`);
            break;
            
        case 'error':
            logActivity('error', `Server error: ${message.message}`);
            break;
            
        default:
            logActivity('info', `Received message of type: ${message.type}`);
    }
}

// Display user status
function displayUserStatus(statusData) {
    const userName = checkUserSelect.options[checkUserSelect.selectedIndex].text;
    const status = statusData.online ? 'online' : 'offline';
    const lastSeen = statusData.lastSeen ? new Date(statusData.lastSeen).toLocaleString() : 'Never';
    
    statusResult.innerHTML = `
        <div class="user-status ${status}">
            <span class="status-indicator ${status}"></span>
            <span>${userName} is ${status.toUpperCase()}</span>
        </div>
        ${!statusData.online ? `<div class="user-last-seen">Last seen: ${lastSeen}</div>` : ''}
    `;
    
    statusResult.classList.add('show');
    
    logActivity('info', `${userName} is ${status}${!statusData.online ? ` (Last seen: ${lastSeen})` : ''}`);
}

// Display all users
function displayAllUsers(users) {
    if (!users || users.length === 0) {
        usersList.innerHTML = '<li class="user-item placeholder">No users found</li>';
        return;
    }
    
    usersList.innerHTML = '';
    
    users.forEach(user => {
        const status = user.status === 'online' ? 'online' : 'offline';
        const lastSeen = user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'Never';
        const isCurrentUser = user.userId === userId;
        
        // Get initials for avatar
        const userIdNum = parseInt(user.userId);
        const userNames = ['John D', 'Jane S', 'Bob J', 'Alice W', 'Charlie B'];
        const userName = userNames[userIdNum - 1] || `User ${user.userId}`;
        const initials = userName.split(' ').map(n => n[0]).join('');
        
        const li = document.createElement('li');
        li.className = 'user-item';
        li.innerHTML = `
            <div class="user-avatar">${initials}</div>
            <div class="user-info">
                <div class="user-name">${userName}${isCurrentUser ? ' (You)' : ''}</div>
                <div class="user-status ${status}">
                    <span class="status-indicator ${status}"></span>
                    <span>${status}</span>
                </div>
                ${status === 'offline' ? `<div class="user-last-seen">Last seen: ${lastSeen}</div>` : ''}
            </div>
        `;
        
        usersList.appendChild(li);
    });
}

// Update connection status UI
function updateConnectionStatus(isConnected) {
    if (isConnected) {
        statusIndicator.classList.remove('offline');
        statusIndicator.classList.add('online');
        statusText.textContent = 'Connected';
        
        // Update button states
        connectBtn.disabled = true;
        disconnectBtn.disabled = false;
        userSelect.disabled = true;
        statusOnlineBtn.disabled = false;
        statusOfflineBtn.disabled = false;
        checkUserSelect.disabled = false;
        checkStatusBtn.disabled = false;
        refreshUsersBtn.disabled = false;
        
        // Set current status
        currentStatus.textContent = 'Online';
    } else {
        statusIndicator.classList.remove('online');
        statusIndicator.classList.add('offline');
        statusText.textContent = 'Disconnected';
        
        // Update button states
        connectBtn.disabled = false;
        disconnectBtn.disabled = true;
        userSelect.disabled = false;
        statusOnlineBtn.disabled = true;
        statusOfflineBtn.disabled = true;
        checkUserSelect.disabled = true;
        checkStatusBtn.disabled = true;
        refreshUsersBtn.disabled = true;
        
        // Reset UI elements
        currentStatus.textContent = 'Not connected';
        statusResult.classList.remove('show');
        usersList.innerHTML = '<li class="user-item placeholder">No data available</li>';
        onlineCountElement.textContent = '0';
    }
}

// Log activity to the activity log
function logActivity(type, message) {
    const now = new Date();
    const timestamp = now.toLocaleTimeString();
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.innerHTML = `
        <span class="timestamp">${timestamp}</span>
        <span class="message">${message}</span>
    `;
    
    activityLog.appendChild(logEntry);
    activityLog.scrollTop = activityLog.scrollHeight;
}

// Clear the activity log
function clearActivityLog() {
    activityLog.innerHTML = '';
    logActivity('system', 'Activity log cleared');
}

// Event listeners
connectBtn.addEventListener('click', connect);
disconnectBtn.addEventListener('click', disconnect);

statusOnlineBtn.addEventListener('click', () => {
    sendMessage('set_status', { status: 'online' });
});

statusOfflineBtn.addEventListener('click', () => {
    sendMessage('set_status', { status: 'offline' });
});

checkStatusBtn.addEventListener('click', () => {
    const targetUserId = checkUserSelect.value;
    if (targetUserId) {
        sendMessage('check_user_status', { targetUserId });
    } else {
        logActivity('error', 'Please select a user to check');
    }
});

refreshUsersBtn.addEventListener('click', () => {
    sendMessage('get_all_users');
});

clearLogBtn.addEventListener('click', clearActivityLog);

// Initialize
updateConnectionStatus(false);
