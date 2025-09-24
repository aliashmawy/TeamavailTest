# TeamAvail Test Application

A Node.js Express application for team availability management with a complete CI/CD pipeline using Docker.

---

### Technologies Used

| Area | Tools |
| --- | --- |
| Version Control | Git |
| Scripting | Bash |
| Containerization | Docker |
| CI/CD | Bash script, Github Actions |
| Code Quality | ESLint, Prettier |
| Testing | Jest |
| Cloud | AWS |

---

## Running the Application Locally

### Prerequisites

- Node.js
- npm
- Docker
- Docker Compose

### Run the bash script

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

## Running the Application on AWS

### Prerequisites

- ECR repo created manually with initial image pushed
- Terraform Installed
- Make your own S3 for remote state and change `provider.tf`
- Save AWS Credentials as `Repository secrets` for github repository
- Replace your own `envs` in the workflow

### Provisioning Infrastructure

- Initializing terraform working directory and backend

```bash
cd terraform/
terraform init
```

- Provision Infrastructure

```bash
terraform apply
```

### Run Workflow

- Workflow runs automatically if there is a change in `src/` , `Dockerfile` , `docker-compose` or `package*.json`
- Or you can run workflow manually from the GUI by adding the `workflow_dispatch:`

---

## How the local pipeline works

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

## How the Github actions workflow works

### Job 1: Validate Code

- Step 1: Checkout Code
- Step 2: Setup Node 18 using `setup-node` action
- Step 3: Install Dependencies using `npm ci`
- Step 4: Check Code format
- Step 5: Fix Formatting if Step 4 failed only
- Step 6: Check Code Quality
- Step 7: Fix linting issues if Step 6 failed only
- Step 8: Testing Code

### Job 2: Build, Push and Deploy

- Step 1: Checkout Code
- Step 2: Access AWS using credentials
- Step 3: Login to ECR
- Step 4: Build and push image to ECR
- Step 5: Scan image with Trivy
- Step 6: Force Deployment for the ECS Service (If Trivy step was successful)

---

## Code Explanation

## Local

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

## Terraform and Workflow

### `ecs.tf`

- Created a task execution role for ECS to have permission to pull the private image from ECR
- Created a role to allow ECS to `GetSecretValue` because RDS DB password was configured using Secrets Manager
- Configured `DB_PASSWORD` env to fetch its value using Secret ARN

```json
"secrets": [
      { "name": "DB_PASSWORD", "valueFrom": "${aws_secretsmanager_secret.db_password.arn}" }
    ]
```

- Also added log configuration for the task definition to store logs in a `cloudwatch_log_group`

```json
"logConfiguration": { 
            "logDriver": "awslogs",
            "options": { 
               "awslogs-group" : "/ecs/${var.project_name}",
               "awslogs-region": "us-east-1",
               "awslogs-stream-prefix": "ecs"
            }
```

```hcl
resource "aws_cloudwatch_log_group" "ecs_logs" {
  name              = "/ecs/${var.project_name}"
  retention_in_days = 30

  tags = {
    Name        = "${var.project_name}-logs"
    Environment = var.environment
  }

```

- Configured an ALB to span the service’s tasks

```hcl
load_balancer {
    target_group_arn = aws_alb_target_group.app.id
    container_name   = "teamavail-app"
    container_port   = var.app_port
  }
```

### `rds.tf`

- Created a custom parameter group for RDS to fix an issue with SSL being forced

```hcl
resource "aws_db_parameter_group" "custom_parameter_group" {
  name   = "rds-pg"
  family = "postgres17"

  parameter {
    name  = "rds.force_ssl"
    value = 0
  }
}
```

- Defined DB password to be fetched from Secrets Manager

```hcl
  password             = data.aws_secretsmanager_secret_version.db_password.secret_string

```

### `ci,yaml`

- Made Push to be on specific Paths only

```yaml
on:
    #triggers only if change is in src/ and only in main or release branch
    push:
        branches:
            - main
        paths: 
            - "src/**"
            - "Dockerfile"
            - "docker-compose.yml"
            - "package*.json"
```

- Used **status check function `failure()` to run a specific step of previous step failed**

```yaml
- name: Fix formatting
  if: failure() && steps.format-check.conclusion == 'failure'
  run: npm run format
```

- Used Pre-built action to login AWS and ECR

```yaml
uses: aws-actions/configure-aws-credentials@v5
#########
uses: aws-actions/amazon-ecr-login@v2
```

- Configured Trivy to scan image after push

```yaml
- name: Run Trivy vulnerability scanner
          uses: aquasecurity/trivy-action@0.28.0
          with:
            image-ref: "${{ steps.login-ecr.outputs.registry }}/${{ env.AWS_ECR_REPO }}:latest"
            format: 'table'
            ignore-unfixed: true
            vuln-type: 'os,library'
            severity: 'CRITICAL,HIGH'
```

- Deployed new image using force deployment with AWS CLI, but it’s executed only if all previous steps are successful to ensure new image is pushed and scanned

```yaml
- name: Force deployment
          if: success()
          run: |
            aws ecs update-service --cluster ${{ env.ECS_CLUSTER }} --service ${{ env.ECS_SERVICE }} --force-new-deployment
```

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

---

### 4. ECS Permission denied

### Problem:

- ECS permission denied to pull the secrets from secret manager

### Solution

- Created a role that allow ECS to `GetSecretValue` from only the specified secret resource using its ARN

---

### 5. RDS Connectivity Issue

### Problem

- Couldn’t connect to RDS because the connection was not encrypted

### Why

- I didn’t use the CA Certificate for RDS in my definition for the DB_HOST

### Not Recommended Solution (For Testing)

- **Not Recommended:** Changed the `rds.force_ssl` from 1 to 0

### Recommended Solution

- Modify database connection config to include SSL

```jsx
const fs = require('fs');

const dbConfig = {  
  ssl: { 
    require: true,
    rejectUnauthorized: true,
    ca: fs.readFileSync('/pathto/rds-ca-cert.pem').toString(), 
  }
```

- Download the CA Certificate Bundle that matches your RDS instance and place it in project directory

---

### 6. Secret scheduled for deletion

### Problem

- Couldn’t create the same secret with the same name after i deleted it

### Why

- Every Deleted Secret is not automatically deleted but it’s scheduled for deletion for a specific period of time

### Solution

- Used another Secret name