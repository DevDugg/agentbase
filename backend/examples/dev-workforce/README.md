# Dev Workforce - Engineering Team Agents

This workforce consists of three specialized engineering agents designed to help with software development tasks.

## Agents

### 1. Backend Engineer 🔧
**Role:** Senior Backend Engineer
**Specialties:**
- Node.js & TypeScript development
- RESTful & GraphQL API design
- Database design and optimization (SQL & NoSQL)
- Microservices architecture
- Performance optimization
- Security best practices
- Testing strategies (unit, integration, e2e)

**Skills:**
- API Design - Complete endpoint design with OpenAPI specs
- Database Optimization - Query optimization, indexing, caching
- Testing Strategy - Comprehensive test suites and coverage

**Example Tasks:**
- "Design a RESTful API for user authentication"
- "Optimize this slow database query"
- "Help me implement rate limiting"
- "Review my API error handling"

### 2. DevOps Engineer 🚀
**Role:** Senior DevOps Engineer
**Specialties:**
- Kubernetes & Docker orchestration
- CI/CD pipeline design (GitHub Actions, GitLab CI)
- Cloud platforms (AWS, GCP, Azure)
- Infrastructure as Code (Terraform, Ansible)
- Monitoring & observability (Prometheus, Grafana)
- Security & compliance automation

**Skills:**
- Kubernetes Deployment - Production-ready K8s manifests
- CI/CD Pipeline - Automated testing and deployment
- Monitoring Setup - Complete observability stack

**Example Tasks:**
- "Set up a Kubernetes cluster with monitoring"
- "Help me debug a failing CI/CD pipeline"
- "Design a deployment strategy for my app"
- "Set up Prometheus alerts"

### 3. Frontend Engineer 🎨
**Role:** Senior Frontend Engineer
**Specialties:**
- React & TypeScript
- Modern web development (Vite, Next.js)
- UI/UX implementation
- Performance optimization (Core Web Vitals)
- Accessibility (WCAG 2.1 AA)
- State management (Redux, Zustand)
- Testing (Jest, React Testing Library, Playwright)

**Skills:**
- React Component Development - Production-ready components
- Performance Optimization - Bundle size, lazy loading, memoization
- Accessibility - WCAG compliance, screen reader support

**Example Tasks:**
- "Build a performant data table with sorting"
- "My React app is slow, how do I optimize it?"
- "Create an accessible modal component"
- "Help me implement infinite scroll"

## Setup

1. **Configure Environment Variables**

Create a `.env` file in the `backend` directory:

```bash
# Backend Engineer
BACKEND_API_KEY=sk-ant-api03-your-key-here
BACKEND_DISCORD_TOKEN=your-discord-bot-token-here

# DevOps Engineer
DEVOPS_API_KEY=sk-ant-api03-your-key-here
DEVOPS_DISCORD_TOKEN=your-discord-bot-token-here

# Frontend Engineer
FRONTEND_API_KEY=sk-ant-api03-your-key-here
FRONTEND_DISCORD_TOKEN=your-discord-bot-token-here

# Redis
REDIS_URL=redis://redis:6379
```

2. **Create Discord Bots**

For each agent, create a Discord bot at https://discord.com/developers/applications:
- Create application
- Go to Bot section
- Enable "Message Content Intent"
- Copy bot token
- Invite to your server with proper permissions

3. **Start the Dev Workforce**

```bash
cd backend
docker-compose -f docker-compose.dev-workforce.yml up --build
```

## Usage Examples

### In Discord

**Backend Engineer:**
```
@Backend How do I implement JWT authentication in Express?
@Backend Review this database schema for performance issues
@Backend Help me optimize this N+1 query problem
```

**DevOps Engineer:**
```
@DevOps Set up a CI/CD pipeline for my Node.js app
@DevOps My Kubernetes deployment is failing, help debug
@DevOps Configure Prometheus monitoring for my service
```

**Frontend Engineer:**
```
@Frontend Build an accessible dropdown menu component
@Frontend My bundle size is 2MB, how can I reduce it?
@Frontend Implement lazy loading for this route
```

## Agent Collaboration

These agents can work together on complex tasks:

**Example: Full-Stack Feature**
1. **Frontend** designs the UI components
2. **Backend** designs the API endpoints
3. **DevOps** sets up deployment pipeline

**Example: Performance Issue**
1. **Frontend** optimizes bundle size and rendering
2. **Backend** optimizes API queries and caching
3. **DevOps** sets up monitoring to track improvements

## Skills Directory

Each agent has a `.claude/skills/` directory with detailed guides:

**Backend:**
- `api-design.md` - RESTful API design patterns
- `database-optimization.md` - Query optimization and indexing
- `testing-strategy.md` - Test implementation guides

**DevOps:**
- `kubernetes-deploy.md` - Production K8s deployments
- `cicd-pipeline.md` - Complete CI/CD workflows
- `monitoring-setup.md` - Observability stack setup

**Frontend:**
- `react-component.md` - Component development patterns
- `performance-optimization.md` - Performance best practices
- `accessibility.md` - WCAG compliance guide

## Best Practices

1. **Be Specific:** Provide context about your tech stack and requirements
2. **Share Code:** Include relevant code snippets for better assistance
3. **Ask Follow-ups:** Agents can iterate on solutions
4. **Cross-Reference:** Tag multiple agents for multi-domain problems
5. **Provide Feedback:** Let agents know if solutions work or need adjustment

## Troubleshooting

**Agent not responding:**
- Check bot is online in Discord server member list
- Verify bot token is correct in `.env`
- Check container logs: `docker logs agentbase-backend`

**Slow responses:**
- Agents process sequentially, expect 5-30 second response times
- Complex questions may take longer
- Check Anthropic API rate limits

**Connection errors:**
- Ensure Redis is running: `docker ps | grep redis`
- Check network connectivity: `docker network inspect agent-network`
- Verify API keys are valid

## Cost Estimation

Based on typical usage:
- ~1000 messages/month per agent
- Average 500 tokens per request/response
- Estimated cost: **$15-30/month** for all three agents

Using Claude Sonnet 4.5 API pricing.

## License

MIT
