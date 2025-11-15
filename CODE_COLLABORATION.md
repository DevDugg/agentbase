# Code Writing and Collaboration Guide

Your Discord agents now have full code writing and Git collaboration capabilities!

## What Changed

Each agent (Backend, DevOps, Frontend) can now:

- **Read and write files** in their workspace
- **Clone Git repositories**
- **Commit and push changes**
- **Run build tools and tests**
- **Execute bash commands**

## How to Use

### 1. Clone a Repository

```
@Backend Clone https://github.com/yourusername/your-repo.git
```

The agent will clone the repo to its workspace (`/agent-workspace/your-repo`)

### 2. Make Code Changes

```
@Backend In the todo-app repo, create a new API endpoint for user authentication
```

The agent will:
- Read existing code
- Write new files or modify existing ones
- Follow best practices for the language/framework
- Consider security and error handling

### 3. Run Tests and Build

```
@Backend Run the tests in the todo-app repository
```

The agent can execute:
- `npm test`, `npm run build`
- `pytest`, `cargo test`
- Any bash command you specify

### 4. Commit and Push Changes

```
@Backend Commit the authentication changes and push to the main branch
```

The agent will:
- Check git status
- Add changed files
- Create a commit with a descriptive message
- Push to the remote repository

## Multi-Agent Collaboration

Have agents work together on the same repository:

```
@DevOps Clone https://github.com/yourusername/fullstack-app.git

@Backend In fullstack-app, create a new REST API for user profiles with PostgreSQL

@Frontend In fullstack-app, create a React component to display user profiles using the new API

@DevOps In fullstack-app, create a Dockerfile and docker-compose.yml to run the full stack
```

Each agent works in their own isolated workspace (`/agent-workspace`) but can access the same repository.

## Available Tools

### File Operations
- `read_file` - Read file contents
- `write_file` - Create or update files
- `list_directory` - List files and directories

### Git Operations
- `git_clone` - Clone a repository
- `git_status` - Check repository status
- `git_commit` - Commit changes with message
- `git_push` - Push to remote repository

### Command Execution
- `bash_command` - Run any bash command (npm, pip, docker, etc.)

## Examples

### Backend: Create a New API Endpoint

```
@Backend Clone https://github.com/mycompany/api-server.git and create a new endpoint for fetching user analytics
```

### Frontend: Build a Component

```
@Frontend In the dashboard repo, create a responsive data table component with sorting and filtering
```

### DevOps: Setup CI/CD

```
@DevOps In the app repo, create a GitHub Actions workflow for testing and deploying to production
```

### Full Stack Feature

```
@Backend Create a new microservice for handling payments with Stripe integration

@Frontend Build a checkout flow UI that calls the payment microservice

@DevOps Create Kubernetes manifests to deploy both services
```

## Security Notes

- Agents can only access files within their `/agent-workspace` directory
- Path traversal outside the workspace is blocked
- Each agent has an isolated workspace
- Git credentials: Use SSH keys or personal access tokens in your Git URLs

## Tips

1. **Be specific**: "Create an Express API with JWT authentication" works better than "make an API"
2. **Provide context**: Mention the repository name and file paths when relevant
3. **Sequential tasks**: For complex work, break it into steps
4. **Test early**: Ask agents to run tests after making changes
5. **Review code**: Always review agent-generated code before deploying to production

## Troubleshooting

### Agent can't find repository
Make sure you've cloned it first:
```
@Backend Clone https://github.com/user/repo.git
```

### Permission denied on Git push
Ensure your repository URL includes credentials or use SSH:
```
https://username:token@github.com/user/repo.git
git@github.com:user/repo.git
```

### Command fails
Check the error message. Agents will report errors from failed commands.

---

**Your AI developer workforce is ready to code! 🚀**