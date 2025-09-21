# TeamAvail Test Application

A Node.js Express application for team availability management with a complete CI/CD pipeline using Docker.

---

## Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- Docker
- Docker Compose

### Technologies Used

| Area | Tools |
| --- | --- |
| Version Control | Git |
| Scripting | Bash |
| Containerization | Docker |
| CI/CD | Bash script |
| Code Quality | ESLint, Prettier |
| Testing | Jest |

---

### Running the Application

### Using the CI Script

```bash
chmod +x ci.sh
./ci.sh
```

### This script will:

- Check prerequisites (Node.js, npm, Docker, Docker Compose)
- Install dependencies
- Check and auto-fix code formatting using prettier
- Check and auto-fix code quality (linting)
- Run tests using jest (if test files exist)
- Build a Docker image
- Start the application using Docker Compose

---

## How the pipeline works

### 1. Prerequisite Checks

- Verifies that `node`, `npm`, `docker`, and `docker-compose` are installed.
- Using `command
- Stops immediately if any are missing.

### **2. Install Dependencies**

- Runs `npm install` to ensure all required packages are installed.

### **3. Code Formatting Check**

- Runs `npm run format:check` to verify formatting.
- If issues are found, runs `npm run format` to fix them automatically.

### **4. Code Quality (Linting)**

- Runs `npm run lint` to detect linting issues.
- If issues are found, attempts auto-fix with `npm run lint:fix`.

### **5. Testing**

- Detects test files (`.test.js` or `.spec.js`).
- Runs `npm run test` if tests exist.
- Skips if no tests are found.

### **6. Build Docker Image**

- Builds the application Docker image (`teamavail-test:latest`).

### **7. Start Application**

- Starts services with `docker-compose up -d`.
- Exposes the app on `http://localhost:3000`.
- Provides instructions to stop (`docker-compose down`).

---

## Code Explanation

### `Dockerfile`

- Used `node:18-alpine` as my base image and made sure it had all `libs` required, we can use `slim` for future upgrades that requires  some addons or libs that is not in the `alpine` one.
- Copied only `package.json` before copying the rest of the code to make it layer-cached and to make rebuilds faster if code changes
- Used `npm ci` to run clean installation and cleared cache because in docker file images we won’t need it unless we repeatedly installed dependencies manually
- Gave pre-built `node` user permission for the `/app` file only for security best practices

### `Docker-Compose`

- Used `postgres:15-alpine` image to be my postgres db
- Set DB ENVs for the db container and then passed it to the app container
- Created a `healthcheck` that uses `pg_isready` to make the app container wait until `service_healthy` is fulfilled
- Created a volume for postgres db default directory `/var/lib/postgresql/data`
- Created a network for the 2 containers to be able to talk to eachother

### `ci.sh`

- Started the script with `set -e` to make it exit immediately if any command fails
- Created a `separator()` function to print clear section headers in the logs, making the output easier to read.
- Used `command -v` to check if a tool is installed or not by verifying if it’s in `$PATH` or not
- Installed dependencies using `npm install` so that all required packages are available before building or testing.
- Checked code formatting with `npm run format:check`. If formatting issues were found, the script automatically fixed them with `npm run format`.
- Checked code quality using `npm run lint`. If linting issues were found, it attempted to fix them automatically with `npm run lint:fix`.
- Verified if test files (`.test.js` or `.spec.js`) exist. If they do, the script ran `npm run test` to execute all tests. If no tests are found, this step is skipped.
- Built the Docker image `teamavail-test:latest` and started the application with `docker-compose up -d` to be in the background.

---

## Problems & Solutions

### **1. Postgres Database Initialization Delay**

### **Problem:**

- When running `docker-compose up`, the application failed to connect to the database with the error:

```bash
Error initializing database: Error: connect ECONNREFUSED 172.21.0.2:5432.
```

### Why:

This happened because Postgres was still initializing and not yet ready to accept connections when the app started.

### **Solution:**

- Added a **health check** for the Postgres service using `pg_isready`.
- Configured the application service to depend on the Postgres health status (`depends_on: condition: service_healthy`), ensuring the app only starts once the database is ready.

---

### 2. **ESLint Browser Globals Error**

### **Problem:**

- When running linting, ESLint reported errors like `'document' is not defined` in `script.js`.

### Why:

- This happened because ESLint, by default, assumes a Node.js environment and does not recognize browser-specific globals such as `document` and `window`.

### **Solution:**

Added the following directive at the top of `script.js` to tell ESLint that this file runs in a browser environment:

```jsx
/* eslint-env browser */

```

---

### 3. **CI Script Error Handling**

### **Problem:**

- Initial CI script didn't handle errors gracefully and lacked proper status reporting.

### **Solution:**

- Created prerequisite checks before running pipeline steps