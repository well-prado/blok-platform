# Technical Context - Blok Community Platform

## Current Technology Stack

### Blok Framework Foundation
The project is built on the Blok framework (formerly Nanoservice-ts), which provides:
- **Modular Architecture**: Node-based workflow composition
- **Multi-Runtime Support**: Node.js (current), Python, Bun (planned)
- **Built-in Observability**: Prometheus metrics integration
- **CLI-First Development**: `nanoctl` for project management
- **Type Safety**: Full TypeScript support with strong typing

### Existing Project Structure
```
blok-platform/
├── src/
│   ├── nodes/              # Custom node implementations
│   ├── workflows/          # Workflow definitions (JSON/YAML/TOML)
│   ├── runner/             # Workflow execution engine
│   ├── Nodes.ts           # Node registry
│   ├── Workflows.ts       # Workflow registry
│   ├── AppRoutes.ts       # HTTP routing configuration
│   └── index.ts           # Application entry point
├── docs/                   # Comprehensive documentation
├── infra/                  # Infrastructure and deployment configs
├── public/                 # Static assets
└── package.json           # Dependencies and scripts
```

### Current Dependencies Analysis

**Core Framework**
- `@nanoservice-ts/runner`: Workflow execution engine
- `@nanoservice-ts/shared`: Common types and utilities
- `@nanoservice-ts/api-call`: HTTP request node
- `@nanoservice-ts/if-else`: Conditional logic node
- `@nanoservice-ts/helper`: Utility functions

**Web Framework**
- `express`: HTTP server framework
- `cors`: Cross-origin resource sharing
- `body-parser`: Request body parsing
- `uuid`: Unique identifier generation

**AI Integration** 
- `ai`: Vercel AI SDK for model integrations
- `@ai-sdk/openai`: OpenAI provider for AI SDK

**Data Storage**
- `pg`: PostgreSQL client
- `mongodb`: MongoDB driver
- Currently missing: Redis for caching

**Development Tools**
- `typescript`: Static typing and compilation
- `nanoctl`: Blok CLI for development workflows
- `copyfiles`: Asset copying during build
- `rimraf`: Cross-platform file deletion

**Monitoring & Observability**
- `@opentelemetry/*`: OpenTelemetry instrumentation
- Prometheus metrics collection (built into Blok)
- Missing: Grafana dashboards, distributed tracing

## Required Technology Additions

### Frontend Stack (Critical Missing Components)
The current project lacks a frontend implementation. Required additions:

**React Ecosystem**
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.8.0",
  "@types/react": "^18.0.0",
  "@types/react-dom": "^18.0.0"
}
```

**State Management**
```json
{
  "zustand": "^4.4.0",
  "@tanstack/react-query": "^4.29.0",
  "react-hook-form": "^7.45.0"
}
```

**UI Framework**
```json
{
  "tailwindcss": "^3.3.0",
  "@headlessui/react": "^1.7.0",
  "@heroicons/react": "^2.0.0",
  "framer-motion": "^10.16.0"
}
```

**Build Tools**
```json
{
  "vite": "^4.4.0",
  "@vitejs/plugin-react": "^4.0.0",
  "vite-tsconfig-paths": "^4.2.0"
}
```

### Backend Enhancements

**Additional Database Support**
```json
{
  "redis": "^4.6.0",
  "ioredis": "^5.3.0",
  "@elastic/elasticsearch": "^8.8.0"
}
```

**Enhanced AI Integration**
```json
{
  "langchain": "^0.0.120",
  "pinecone-client": "^1.0.0",
  "openai": "^4.0.0"
}
```

**Real-time Features**
```json
{
  "socket.io": "^4.7.0",
  "ws": "^8.13.0"
}
```

**Message Queue & Events**
```json
{
  "bullmq": "^4.10.0",
  "kafkajs": "^2.2.0"
}
```

## Development Environment Setup

### Prerequisites
- **Node.js**: >=18.0.0 (as specified in engines)
- **pnpm**: Package manager (preferred over npm/yarn)
- **Docker**: For local infrastructure services
- **PostgreSQL**: Primary database
- **MongoDB**: Document storage
- **Redis**: Caching layer

### Local Development Workflow
1. **Environment Setup**:
   ```bash
   pnpm install
   cp .env.example .env.local
   docker compose -f infra/docker-compose.yml up -d
   ```

2. **Development Server**:
   ```bash
   pnpm dev  # Uses nanoctl dev
   ```

3. **Infrastructure Development**:
   ```bash
   pnpm infra:dev  # Docker with hot reload
   ```

### Current Build Process
```bash
# Production build
pnpm build  # TypeScript compilation + asset copying

# Development build with watch
pnpm infra:build  # TypeScript watch mode
```

## Technical Constraints and Considerations

### Blok Framework Constraints
**Runtime Limitations**
- Primary support for Node.js 18+
- Python and Bun support in development
- Memory and CPU limits based on node implementations
- Single-threaded execution model per workflow

**Workflow Definition Constraints**
- JSON schema validation for workflow definitions
- Node input/output type safety requirements
- Limited to supported trigger types (HTTP, future: gRPC, events)
- Stateless node execution (state must be managed externally)

**Integration Constraints**
- Must integrate with atomic-canvas for visual editing
- OpenManus AI agent compatibility requirements
- CLI tool compatibility for development workflows
- Prometheus metrics format requirements

### Database Architecture Constraints

**PostgreSQL Requirements**
- ACID compliance for critical data
- Complex relational queries for community features
- Full-text search capabilities (or Elasticsearch integration)
- Geographic distribution considerations

**MongoDB Requirements**
- Flexible schema for evolving workflow definitions
- JSON document storage and querying
- GridFS for large file storage (workflow assets)
- Replication and sharding for scalability

**Redis Requirements**
- Session management and caching
- Real-time feature support (pub/sub)
- Rate limiting and throttling
- Temporary data storage (AI generation state)

### AI Integration Constraints

**OpenManus Requirements**
- Streaming response support for real-time generation
- Context management across conversation sessions
- Training data format compatibility
- Model versioning and rollback capabilities

**Performance Constraints**
- AI response time targets (<2 seconds for simple requests)
- Concurrent AI session limits
- Model memory and computation requirements
- Training data privacy and anonymization

### Security Constraints

**Authentication Requirements**
- Multi-factor authentication support
- OAuth provider integration (GitHub, Google)
- JWT token management and rotation
- Session security and timeout handling

**Data Protection**
- GDPR and CCPA compliance requirements
- Data encryption at rest and in transit
- Audit logging for all sensitive operations
- User consent management for AI training data

**API Security**
- Rate limiting per user and endpoint
- Input validation and sanitization
- CORS policy management
- API key management for integrations

## Infrastructure Requirements

### Container Strategy
```dockerfile
# Multi-stage build for production optimization
FROM node:18-alpine AS builder
FROM node:18-alpine AS runtime
# Health checks and monitoring
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3
```

### Kubernetes Deployment Pattern
- **Microservices**: Individual service deployments
- **ConfigMaps**: Environment-specific configuration
- **Secrets**: Sensitive data management
- **Ingress**: Load balancing and SSL termination
- **HPA**: Horizontal Pod Autoscaling based on metrics

### Monitoring and Observability
**Required Monitoring Stack**
- Prometheus for metrics collection
- Grafana for visualization and alerting
- Jaeger for distributed tracing
- ELK Stack for centralized logging

**Custom Metrics**
- Workflow execution time and success rates
- AI generation quality and performance
- User engagement and retention metrics
- Community content creation and interaction rates

### Development vs Production Differences

**Development Environment**
- Local database instances in Docker
- Hot reload for rapid development
- Relaxed security constraints
- Mock AI services for offline development

**Production Environment**
- Managed database services (AWS RDS, MongoDB Atlas)
- CDN for static asset delivery
- Full security stack implementation
- High availability and disaster recovery

## Migration Strategy

### Phase 1: Foundation Setup
1. **Frontend Bootstrap**: React application with basic routing
2. **Database Setup**: PostgreSQL and MongoDB with initial schemas
3. **API Gateway**: Express server with authentication middleware
4. **Development Environment**: Docker compose for local development

### Phase 2: Core Features
1. **User Management**: Authentication, profiles, basic authorization
2. **Content Management**: Workflow storage and retrieval
3. **Basic Search**: PostgreSQL full-text search
4. **AI Integration**: Basic OpenManus connection

### Phase 3: Advanced Features
1. **Real-time Features**: WebSockets for live collaboration
2. **Advanced Search**: Elasticsearch integration
3. **Community Features**: Social interactions and moderation
4. **Performance Optimization**: Caching, CDN, monitoring

### Technical Debt Management
- **Code Quality**: ESLint, Prettier, SonarQube integration
- **Testing Strategy**: Unit, integration, and E2E testing
- **Documentation**: Automated API docs with OpenAPI
- **Dependency Management**: Regular security updates and version management

This technical foundation provides a clear path from the current Blok framework implementation to a full-featured community platform. 