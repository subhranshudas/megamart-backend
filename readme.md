# MegaMart Backend

## Tech stack

Node JS, Express JS, Redis, MongoDB, Zod

## Architecture

The MegaMart Backend is built using a modern Node.js stack with the following components:

1. **Server**: Express.js

   - Handles HTTP requests and routing
   - Middleware management

2. **Database**:

   - Primary Database: MongoDB
     - Used for storing persistent data
   - Caching: Redis
     - Used for session management and potentially caching frequently accessed data

3. **Authentication**:

   - Passport.js for authentication strategies
   - express-session for session management
   - connect-redis for Redis-based session storage

4. **Data Validation**:

   - Zod for schema validation and type checking

5. **Security**:

   - bcrypt for password hashing

6. **Environment Configuration**:

   - dotenv for managing environment variables

7. **Development Tools**:
   - nodemon for auto-restarting the server during development

## Todos

- Add a standard logging library
