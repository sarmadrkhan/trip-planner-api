# Trip Planner API

A robust REST API for searching and managing travel trips, built with NestJS, TypeScript, and MongoDB. This project includes code with comprehensive testing and proper error handling while following best practices.

## Features

### Features Implemented
- **Trip Search** - Search trips by origin and destination with sorting
  - Sort by fastest (duration)
  - Sort by cheapest (cost)
  - Support for 50 places 
- **Cache** - Results caching for performance
- **Docker** - Containerization with Docker Compose for easy deployment
- **Trip Management** - Save, list, and delete trips
- **Pagination** - Offset pagination for saved trips with metadata
- **Advanced Validation** - Case-insensitive IATA codes, comprehensive input validation
- **Security** - Sensitive data redaction in logs & rate limiting
- **Documentation** - Interactive API documentation with Swagger & Scalar

## Tech Stack

- **Framework**: NestJS 11
- **Language**: TypeScript 5.7 (strict mode)
- **Database**: MongoDB 8.0 with Mongoose
- **Caching**: In-memory cache
- **Validation**: class-validator, class-transformer
- **Documentation**: OpenAPI/Swagger + Scalar
- **Testing**: Jest
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Node.js 24.x or higher
- Docker & Docker Compose (for MongoDB)
- npm or yarn

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd trip-planner-api

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add external API url and key
EXTERNAL_API_URL=external_api_url
EXTERNAL_API_KEY=external_api_key
```

### 3. Start MongoDB

```bash
# Start MongoDB using Docker Compose
docker compose up mongodb -d
```

### 4. Run the Application

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Documentation

Once the application is running, a complete and interactive API documentation is available at:

- **Scalar UI**: http://localhost:3000/api/docs/scalar
- **Swagger UI**: http://localhost:3000/api/docs/swagger

## Testing

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run E2E tests (requires MongoDB)
npm run test:e2e

# Test rate limiting (requires app to be running, run this in a new terminal)
npm run test:rate-limit
```

## Docker Setup

```bash
# Build and start all services
docker compose up --build

# Run in detached mode
docker compose up -d

# Stop all services
docker compose down
```

**Current Test Coverage: ~75% (core logic 100% covered)**

## Architecture & Design Decisions

### Why Offset-based Pagination?

I implemented pagination only for saved trips (not search results) using offset strategy i.e skip/limit:

- Search results are NOT paginated because they're already filtered by origin/destination so low number of results and users need to see all options to compare for better UX
- Saved trips ARE paginated because this collection can grow indefinitely over time
- Offset-based pagination chosen for simplicity and familiarity (cursor-based would be better for production scale)

### Caching Strategy

- In-memory caching used for trip search results (5-minute TTL)
- Cache key structure: `trips:{origin}:{destination}:{sort_by}`
- Redis would be recommended for production horizontal scaling

### Case Normalization

- IATA codes are automatically converted to uppercase at the DTO level
- Provides better UX without requiring frontend validation
- Uses `@Transform` decorator for automatic conversion

### Security

- Sensitive fields (API keys, tokens) are redacted from logs
- Input validation on all endpoints
- Global exception filter for consistent error responses

### Rate Limiting

The API implements rate limiting to prevent abuse:

- **Limit**: 100 requests per minute per IP address
- **Window**: 60 seconds (rolling)
- **Headers**: Rate limit information included in response headers

### Database Design

- MongoDB ObjectId (`_id`) used as primary key for saved trips
- `tripId` from external API stored separately for reference and duplicate prevention

### Improvements for Production

1. **Cursor-based Pagination**: Replace offset-based with cursor-based for better performance at scale
2. **Redis Caching**: Replace in-memory cache with Redis for distributed caching
3. **Monitoring**: Add Application Performance Monitoring like Datadog
4. **Structured Logging**: Implement centralized logging and audit trails
5. **Authentication**: Add JWT-based authentication for user-specific saved trips
6. **Database Indexing**: Add compound indexes on frequently queried fields

## Code Quality

- **TypeScript Strict Mode**: Enabled for type safety
- **ESLint**: Enforced with no `any` types allowed
- **Prettier**: Consistent code formatting
- **Test Coverage**: 75%+ with comprehensive unit and E2E tests

## Known Issues

### npm audit Warnings

- 3 moderate severity vulnerabilities in `lodash` (transitive dependency from `@nestjs/config` and `@nestjs/swagger`)
- **Assessment**: Safe to ignore. Lodash is only used during development/build by NestJS internals, not exposed to runtime or user input
- **Why not fixed**: Running `npm audit fix --force` would downgrade `@nestjs/config` from 4.x to 1.x (major breaking change)
- **Production recommendation**: Monitor for NestJS updates that resolve this dependency issue
