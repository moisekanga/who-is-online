# Logging Utility

A reusable logging system for the Who-Is-Online application that provides both file and console logging with environment-based configuration.

## Features

- Log levels: info, error, and debug
- File logging for all levels (stored in the `/logs` directory)
- Console logging with colorized output
- Environment-based configuration (debug messages only shown in development)
- Request logging with automatic sanitization of sensitive data
- Structured logging with timestamps and metadata support

## Usage

### Basic Usage

```javascript
const logger = require('./utility/logger');

// Info level - always logged in all environments
logger.info('This is an informational message');
logger.info('User logged in successfully', { userId: '123', username: 'john_doe' });

// Error level - always logged in all environments
try {
  throw new Error('Something went wrong');
} catch (error) {
  logger.error('Failed to process request', error);
}

// Debug level - only logged in development environment
logger.debug('Detailed debug information', { 
  data: { key: 'value' }, 
  processingTime: '150ms' 
});
```

### Request Logging (for Express applications)

```javascript
const express = require('express');
const logger = require('./utility/logger');
const app = express();

// Middleware to log all requests
app.use((req, res, next) => {
  logger.request(req);
  next();
});

app.get('/api/users', (req, res) => {
  logger.info('Fetching users');
  // Your code here
  res.json({ users: [] });
});
```

## Configuration

The logger uses the `ENVIRONMENT` variable from your `.env` file to determine the logging behavior:

- In development (`ENVIRONMENT=development`): Debug messages are shown in the console
- In production (`ENVIRONMENT=production`): Debug messages are suppressed in the console

## Log Files

Log files are stored in the `/logs` directory:

- `combined.log`: Contains all log entries
- `error.log`: Contains only error level entries

## Example

See `logger.example.js` for a complete demonstration of the logger's capabilities.
