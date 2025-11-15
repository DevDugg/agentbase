# Testing Strategy Skill

Design and implement comprehensive testing strategies for backend services.

## Capabilities

- Write unit tests for business logic
- Create integration tests for APIs
- Design e2e test scenarios
- Implement test fixtures and mocks
- Set up test databases
- Configure CI/CD test pipelines
- Test coverage analysis

## Testing Pyramid

```
        /\
       /  \  E2E Tests (Few)
      /____\
     /      \
    / Integr \  Integration Tests (Some)
   /__________\
  /            \
 /   Unit Tests \ Unit Tests (Many)
/________________\
```

## Test Examples

### Unit Tests
```typescript
import { describe, it, expect, vi } from 'vitest';
import { UserService } from './user.service';

describe('UserService', () => {
  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      const mockRepo = {
        create: vi.fn().mockResolvedValue({ id: '1', email: 'test@example.com' }),
        findByEmail: vi.fn().mockResolvedValue(null)
      };

      const service = new UserService(mockRepo);
      const result = await service.createUser({
        email: 'test@example.com',
        password: 'secure123'
      });

      expect(result).toHaveProperty('id');
      expect(result.email).toBe('test@example.com');
      expect(mockRepo.create).toHaveBeenCalledOnce();
    });

    it('should throw error if email already exists', async () => {
      const mockRepo = {
        findByEmail: vi.fn().mockResolvedValue({ id: '1', email: 'existing@example.com' })
      };

      const service = new UserService(mockRepo);

      await expect(
        service.createUser({ email: 'existing@example.com', password: 'pwd' })
      ).rejects.toThrow('Email already exists');
    });

    it('should hash password before storing', async () => {
      const mockRepo = {
        create: vi.fn(),
        findByEmail: vi.fn().mockResolvedValue(null)
      };

      const service = new UserService(mockRepo);
      await service.createUser({ email: 'test@example.com', password: 'plain' });

      const createCall = mockRepo.create.mock.calls[0][0];
      expect(createCall.password).not.toBe('plain');
      expect(createCall.password).toMatch(/^\$2[aby]\$/); // bcrypt hash
    });
  });
});
```

### Integration Tests
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { db } from '../database';

describe('Users API', () => {
  beforeAll(async () => {
    await db.migrate.latest();
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          username: 'newuser'
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('newuser@example.com');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'invalid-email',
          password: 'SecurePass123!'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 409 for duplicate email', async () => {
      await request(app)
        .post('/api/users')
        .send({ email: 'duplicate@example.com', password: 'pwd' });

      const response = await request(app)
        .post('/api/users')
        .send({ email: 'duplicate@example.com', password: 'pwd' })
        .expect(409);

      expect(response.body.error).toContain('already exists');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      const createRes = await request(app)
        .post('/api/users')
        .send({ email: 'getuser@example.com', password: 'pwd' });

      const response = await request(app)
        .get(`/api/users/${createRes.body.id}`)
        .expect(200);

      expect(response.body.id).toBe(createRes.body.id);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/users/99999')
        .expect(404);
    });
  });
});
```

### E2E Tests
```typescript
import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test('should register, login, and access protected route', async ({ request }) => {
    // 1. Register
    const registerRes = await request.post('/api/auth/register', {
      data: {
        email: 'e2e@example.com',
        password: 'SecurePass123!',
        username: 'e2euser'
      }
    });
    expect(registerRes.status()).toBe(201);

    // 2. Login
    const loginRes = await request.post('/api/auth/login', {
      data: {
        email: 'e2e@example.com',
        password: 'SecurePass123!'
      }
    });
    expect(loginRes.status()).toBe(200);
    const { token } = await loginRes.json();

    // 3. Access protected route
    const profileRes = await request.get('/api/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    expect(profileRes.status()).toBe(200);
    const profile = await profileRes.json();
    expect(profile.email).toBe('e2e@example.com');
  });
});
```

## Test Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.spec.ts',
        '**/*.test.ts'
      ]
    }
  }
});
```

## Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **Test Isolation**: Each test should be independent
3. **Use Fixtures**: Create reusable test data
4. **Mock External Services**: Don't call real APIs in tests
5. **Test Edge Cases**: Not just happy paths
6. **Descriptive Names**: Test names should explain what they test
7. **Fast Tests**: Keep unit tests under 100ms
