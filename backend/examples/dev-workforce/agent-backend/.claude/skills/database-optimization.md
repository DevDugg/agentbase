# Database Optimization Skill

Optimize database queries, schema design, and indexing strategies.

## Capabilities

- Analyze slow queries and provide optimizations
- Design efficient database schemas
- Create appropriate indexes
- Implement query optimization techniques
- Handle N+1 query problems
- Design caching strategies
- Optimize joins and aggregations

## Common Optimizations

### 1. Index Creation
```sql
-- Single column index
CREATE INDEX idx_users_email ON users(email);

-- Composite index
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at DESC);

-- Partial index
CREATE INDEX idx_active_users ON users(email) WHERE active = true;

-- Covering index
CREATE INDEX idx_users_lookup ON users(id) INCLUDE (username, email);
```

### 2. Query Optimization
```typescript
// ❌ N+1 Problem
const users = await User.findAll();
for (const user of users) {
  user.orders = await Order.findAll({ where: { userId: user.id } });
}

// ✅ Eager Loading
const users = await User.findAll({
  include: [{
    model: Order,
    as: 'orders'
  }]
});

// ✅ Batch Loading
const userIds = users.map(u => u.id);
const orders = await Order.findAll({
  where: { userId: { [Op.in]: userIds } }
});
const ordersByUser = groupBy(orders, 'userId');
```

### 3. Pagination
```typescript
// ❌ Offset pagination (slow for large datasets)
const users = await User.findAll({
  offset: (page - 1) * limit,
  limit: limit
});

// ✅ Cursor pagination (efficient)
const users = await User.findAll({
  where: {
    id: { [Op.gt]: lastSeenId }
  },
  limit: limit,
  order: [['id', 'ASC']]
});
```

### 4. Caching
```typescript
async function getUserOrders(userId: string) {
  const cacheKey = `user:${userId}:orders`;

  // Try cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Query database
  const orders = await Order.findAll({
    where: { userId },
    include: ['items']
  });

  // Cache for 5 minutes
  await redis.setEx(cacheKey, 300, JSON.stringify(orders));

  return orders;
}
```

## Analysis Process

When optimizing:
1. Identify slow queries using EXPLAIN ANALYZE
2. Check for missing indexes
3. Look for N+1 problems
4. Consider data volume and growth
5. Implement appropriate caching
6. Monitor query performance
