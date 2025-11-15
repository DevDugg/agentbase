# API Design Skill

Design RESTful or GraphQL APIs following industry best practices.

## Capabilities

- Design complete API endpoints with proper HTTP methods
- Create OpenAPI/Swagger specifications
- Design request/response schemas
- Define error responses and status codes
- Implement versioning strategies
- Design pagination, filtering, and sorting
- Security considerations (auth, rate limiting)

## Usage

When a user asks for API design help, provide:
1. Complete endpoint definitions
2. Request/response examples
3. HTTP status codes
4. Error handling
5. Authentication requirements
6. OpenAPI specification when relevant

## Example

```yaml
openapi: 3.0.0
info:
  title: Users API
  version: 1.0.0

paths:
  /api/v1/users:
    get:
      summary: List users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
    post:
      summary: Create user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserInput'
      responses:
        '201':
          description: Created
        '400':
          description: Validation error
        '409':
          description: User already exists

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        username:
          type: string
        createdAt:
          type: string
          format: date-time
```
