# TeamAvail Test Application

A Node.js Express application for team availability management with a complete CI/CD pipeline using Docker.

### Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- Docker
- Docker Compose

### Running the Application

### Using the CI Script

```bash
./ci.sh

```

This script will:

- Check prerequisites (Node.js, npm, Docker, Docker Compose)
- Install dependencies
- Check and auto-fix code formatting
- Check and auto-fix code quality (linting)
- Run tests (if test files exist)
- Build a Docker image
- Start the application using Docker Compose

## Project Structure

```
TeamavailTest/
├── server.js              # Main Express server
├── database.js            # PostgreSQL database configuration
├── package.json           # Dependencies and scripts
├── Dockerfile             # Docker image configuration
├── docker-compose.yml     # Docker Compose configuration
├── ci.sh                  # Advanced CI/CD pipeline script
├── .eslintrc.js          # ESLint configuration
├── .prettierrc           # Prettier configuration
├── .gitignore            # Git ignore rules
├── public/               # Static frontend files
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── input/                # Input JSON files
│   ├── names.json
│   ├── selection.json
│   └── status.json
├── output/               # Output directory (legacy)
└── __tests__/            # Test files
    └── server.test.js

```

---

## Development

### Code Quality

The project uses:

- **ESLint** for code linting
- **Prettier** for code formatting
- **Jest** for testing

## Docker

### Dockerfile Features

- Uses Node.js 18 Alpine for smaller image size
- Multi-stage build for optimization
- Root user (as requested)
- Proper layer caching

### Docker Compose

The `docker-compose.yml` includes:

- Application service
- PostgreSQL service
- Volume mounts for data persistence
- Network configuration
- Optional Redis and PostgreSQL services (commented out)

## Testing

The application includes comprehensive tests:

- **Unit tests** for server endpoints
- **Integration tests** for API functionality

## Configuration

### Environment Variables

- `NODE_ENV` - Environment (production/development)
- `PORT` - Server port (default: 3000)
- `DB_HOST` - Database host (default: postgres)
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name (default: teamavail)
- `DB_USER` - Database user (default: teamavail)
- `DB_PASSWORD` - Database password (default: teamavail_password)

### Docker Configuration

- **Port**: 3000
- **Volumes**: `./output` and `./input` mounted
- **User**: Root user (as requested)

---

## Problems & Solutions

### 1. **CI Script Error Handling**

**Problem:** Initial CI script didn't handle errors gracefully and lacked proper status reporting.

**Solution:**

- Created prerequisite checks before running pipeline steps

### 2. **PostgreSQL Database Integration**

**Problem:** Application was using file-based storage (history.json) which is not suitable for production and doesn't provide data persistence across container restarts.

**Solution:**

- Added PostgreSQL database service to docker-compose.yml
- Created database.js with connection pooling and proper error handling
- Updated server.js to use database instead of file system

### 3. **Missing Development Dependencies**

**Problem:** The original `package.json` lacked essential development tools for linting, formatting, and testing.

**Solution:**

- Added comprehensive dev dependencies: ESLint, Prettier, Jest, Supertest, Nodemon
- Created proper configuration files (`.eslintrc.js`, `.prettierrc`)
- Set up Jest configuration for testing with coverage
