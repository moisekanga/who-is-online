class UserPresence {
    // Private fields
    #status;
    #lastSeen;

    constructor(userId, connectionId) {
        this.userId = userId;
        this.connectionId = connectionId;
        this.#status = "online"; // online || offline
        this.#lastSeen = null;
    }

    setStatus(newStatus) {
        if (newStatus === "online" || newStatus === "offline") {
            this.#status = newStatus;
        }
        // change status state
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
