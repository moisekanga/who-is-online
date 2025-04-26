class UserPresence {
    // Private fields
    #status;
    #lastSeen;

    // Static counter for online users
    static #onlineCount = 0;

    /**
     * Get the current count of online users
     * @returns {number} The number of online users
     */
    static getOnlineCount() {
        return UserPresence.#onlineCount;
    }

    /**
     * Increment the online user count
     */
    static incrementOnlineCount() {
        UserPresence.#onlineCount++;
        return UserPresence.#onlineCount;
    }

    /**
     * Decrement the online user count
     */
    static decrementOnlineCount() {
        if (UserPresence.#onlineCount > 0) {
            UserPresence.#onlineCount--;
        }
        return UserPresence.#onlineCount;
    }

    constructor(userId, connectionId) {
        this.userId = userId;
        this.connectionId = connectionId;
        this.#status = "online"; // online || offline
        this.#lastSeen = null;

        // Increment online count when a new user connects with online status
        UserPresence.incrementOnlineCount();
    }

    setStatus(newStatus) {
        // Only update if the status is actually changing
        if (newStatus === "online" || newStatus === "offline") {
            if (this.#status !== newStatus) {
                // Update online count based on status change
                if (newStatus === "online") {
                    UserPresence.incrementOnlineCount();
                } else if (newStatus === "offline") {
                    UserPresence.decrementOnlineCount();
                }

                // Set the new status
                this.#status = newStatus;
            }
        }
    }

    getStatus() {
        return this.#status;
    }

    setLastSeen() {
        // set lastSeen to current time
        this.#lastSeen = new Date();
    }

    getLastSeen() {
        return this.#lastSeen;
    }

    /**
     * Update the connection ID for this user
     * @param {string} connectionId - The new connection ID
     */
    updateConnectionId(connectionId) {
        this.connectionId = connectionId;
    }

    // Method to get serializable representation for state persistence
    toJSON() {
        return {
            userId: this.userId,
            connectionId: this.connectionId,
            status: this.#status,
            lastSeen: this.#lastSeen
        };
    }
}

module.exports = { UserPresence }
