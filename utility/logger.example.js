/**
 * Example usage of the logger utility
 */

const logger = require('./logger');

// Basic usage examples
function demonstrateLogger() {
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
  
  // Request logging example (for Express/HTTP applications)
  const mockRequest = {
    method: 'POST',
    url: '/api/users',
    params: { id: '123' },
    query: { filter: 'active' },
    body: {
      username: 'john_doe',
      password: 'secret123', // This will be redacted in the logs
      email: 'john@example.com'
    }
  };
  
  logger.request(mockRequest, { requestId: 'req-123-abc' });
}

// Run the demonstration
demonstrateLogger();

/**
 * How to use the logger in your application:
 * 
 * 1. Import the logger:
 *    const logger = require('./utility/logger');
 * 
 * 2. Use the appropriate log level:
 *    - logger.info('Info message', { optional: 'metadata' });
 *    - logger.error('Error message', errorObject);
 *    - logger.debug('Debug message', { detailed: 'debug info' });
 *    - logger.request(req, { additional: 'context' });
 * 
 * 3. Log files will be stored in the 'logs' directory:
 *    - combined.log: Contains all log entries
 *    - error.log: Contains only error level entries
 * 
 * 4. Debug messages will only appear in the console in development environment
 */
