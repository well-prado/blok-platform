# System Patterns - Blok Community Platform

## Architecture Overview

### Microservices Architecture Pattern
The platform implements a microservices architecture that aligns with Blok's philosophy of modular, testable, and observable systems. Each service is responsible for a specific domain and can be developed, deployed, and scaled independently.

**Core Services:**
- **User Management Service**: Authentication, authorization, profiles, reputation
- **Content Management Service**: Workflows, nodes, versions, metadata
- **Search Service**: Indexing, querying, AI-powered recommendations
- **AI Service**: OpenManus integration, natural language processing, generation
- **Community Service**: Comments, ratings, social features, moderation
- **Analytics Service**: Usage tracking, performance metrics, insights
- **Notification Service**: Email, webhooks, real-time notifications

### Event-Driven Architecture Pattern
Services communicate through an event-driven pattern using message queues and event streams. This ensures loose coupling while maintaining data consistency and system resilience.

**Event Types:**
- **User Events**: Registration, profile updates, authentication
- **Content Events**: Workflow creation, updates, deletions, forks
- **Community Events**: Comments, ratings, follows, shares
- **AI Events**: Generation requests, training data updates, model improvements
- **System Events**: Health checks, performance metrics, errors

### CQRS (Command Query Responsibility Segregation)
Separate read and write models optimize for different access patterns:
- **Command Side**: Optimized for consistency and business logic validation
- **Query Side**: Optimized for fast retrieval and complex filtering
- **Event Store**: Maintains complete audit trail and enables event sourcing

## Data Architecture Patterns

### Polyglot Persistence Strategy
Different storage technologies are used based on data characteristics and access patterns:

**PostgreSQL (Primary Relational Data)**
- User accounts, authentication, authorization
- Workflow metadata, relationships, versions
- Community data (comments, ratings, relationships)
- Transactional consistency for critical operations

**MongoDB (Document Storage)**
- Workflow definitions (JSON/YAML/TOML)
- Node configurations and metadata
- AI training data and model artifacts
- Flexible schema for evolving data structures

**Redis (Caching and Session Management)**
- Session storage and management
- Cache frequently accessed data
- Real-time features (notifications, presence)
- Rate limiting and throttling

**Elasticsearch (Search and Analytics)**
- Full-text search across all content
- Complex filtering and faceted search
- Analytics and reporting data
- AI-powered recommendation features

### Data Consistency Patterns

**Eventual Consistency for Non-Critical Data**
- Community features (likes, comments, views)
- Analytics and metrics
- Search indexes and recommendations
- Non-critical user preferences

**Strong Consistency for Critical Data**
- User authentication and authorization
- Workflow ownership and permissions
- Financial transactions and subscriptions
- Security-sensitive operations

**Saga Pattern for Distributed Transactions**
- Multi-step operations across services
- Compensation actions for failure scenarios
- Workflow publishing and approval processes
- User registration and onboarding flows

## Component Interaction Patterns

### API Gateway Pattern
A unified entry point for all client requests that provides:
- **Authentication and Authorization**: JWT token validation and user context
- **Rate Limiting**: Per-user and per-endpoint throttling
- **Request Routing**: Intelligent routing to appropriate microservices
- **Response Aggregation**: Combining data from multiple services
- **Monitoring and Logging**: Centralized request tracking and analytics

### Service Mesh Architecture
Istio service mesh provides:
- **Traffic Management**: Load balancing, circuit breaking, retries
- **Security**: mTLS encryption, service-to-service authentication
- **Observability**: Distributed tracing, metrics collection, logging
- **Policy Enforcement**: Access control, quota management, security policies

### Circuit Breaker Pattern
Resilience patterns for handling service failures:
- **Fail Fast**: Immediate failure detection and response
- **Graceful Degradation**: Partial functionality during outages
- **Automatic Recovery**: Self-healing capabilities and health checks
- **Bulkhead Isolation**: Preventing cascading failures across services

## Frontend Architecture Patterns

### Micro-Frontend Architecture
The frontend is composed of independent, deployable modules:

**Core Shell Application**
- Navigation and layout management
- Authentication and user context
- Shared component libraries
- Common utilities and services

**Feature Modules**
- **Discovery Module**: Search, browse, recommendations
- **Editor Module**: Workflow creation and editing
- **Community Module**: Social features and interactions
- **Profile Module**: User management and settings
- **AI Assistant Module**: Chat interface and generation tools

### State Management Patterns

**Zustand for Local State**
- Component-level state management
- Minimal boilerplate and excellent TypeScript support
- Optimized re-rendering and performance
- Easy integration with React hooks

**React Query for Server State**
- Data fetching, caching, and synchronization
- Optimistic updates and background refresh
- Error handling and retry logic
- Offline support and cache persistence

**Event Sourcing for Complex State**
- Workflow editor state management
- Collaborative editing capabilities
- Undo/redo functionality
- Real-time synchronization across users

### Component Architecture Patterns

**Atomic Design Methodology**
- **Atoms**: Basic UI elements (buttons, inputs, icons)
- **Molecules**: Simple component combinations (search bars, cards)
- **Organisms**: Complex components (headers, workflow editors)
- **Templates**: Page-level layouts and structures
- **Pages**: Complete application views with real content

**Compound Component Pattern**
- Complex components with multiple related sub-components
- Workflow editor with panels, canvas, and toolbars
- Search interface with filters, results, and pagination
- User profiles with tabs, content, and actions

## AI Integration Patterns

### OpenManus Integration Architecture
**Streaming Response Pattern**
- Real-time workflow generation with progressive updates
- WebSocket connections for immediate feedback
- Incremental parsing and validation
- User interaction during generation process

**Context Management Pattern**
- Conversation history and session persistence
- Project context and user preferences
- Workflow state and modification history
- Personalized recommendations and suggestions

**Training Data Pipeline**
- Anonymized interaction data collection
- Batch processing for model training
- A/B testing for model improvements
- Feedback loop integration

### AI-Powered Features

**Semantic Search Pattern**
- Vector embeddings for content similarity
- Hybrid search combining keywords and semantics
- Personalized ranking based on user behavior
- Real-time index updates and optimization

**Recommendation Engine Pattern**
- Collaborative filtering based on user behavior
- Content-based filtering using metadata
- Hybrid approaches combining multiple signals
- Real-time personalization and adaptation

**Natural Language Processing Pattern**
- Intent recognition and entity extraction
- Context-aware response generation
- Multi-turn conversation management
- Error handling and clarification requests

### Critical Blok Framework Workflow Syntax (VERIFIED)
**Context Variable Patterns (ESSENTIAL)**
- **Strings**: `"${ctx.request.body.field}"` - Direct string interpolation
- **Numbers/Booleans/Objects**: `"js/ctx.request.body.field"` - JavaScript evaluation
- **Arrays/Objects from vars**: `"js/ctx.vars.generated_patterns"` - Variable access

**Common Request Patterns:**
- Body data: `"${ctx.request.body.email}"`, `"${ctx.request.body.username}"`
- Query params: `"${ctx.request.query.limit}"`, `"js/ctx.request.query.count"`
- Path params: `"${ctx.request.params.id}"`, `"${ctx.request.params.workflowId}"`
- Numbers: `"js/ctx.request.body.count"`, `"js/ctx.request.body.rating"`
- Booleans: `"js/ctx.request.body.overwrite"`, `"js/ctx.request.body.isPublic"`

**Working Examples from Auth System:**
```json
"inputs": {
  "operation": "register",
  "email": "${ctx.request.body.email}",
  "password": "${ctx.request.body.password}",
  "username": "${ctx.request.body.username}"
}
```

**Key Rules:**
- Always use `ctx.request.body` NOT `ctx.body`
- String interpolation for simple strings
- JavaScript evaluation for complex data types
- Each workflow JSON file becomes an endpoint (filename = URL path)
- Always use `"path": "/"` unless expecting parameters

**CRITICAL: Server Startup Commands**
- **NEVER** use `pnpm start` or `node dist/index.js` for development
- **ALWAYS** use `pnpm dev` to start the development server
- The dev command properly handles hot reloading and workflow registration
- Using the wrong startup command causes workflow registration failures

## Security Architecture Patterns

### Zero Trust Security Model
- **Identity Verification**: Multi-factor authentication for all users
- **Least Privilege Access**: Minimal permissions for each operation
- **Continuous Monitoring**: Real-time security event analysis
- **Network Segmentation**: Isolated services with controlled communication

### Defense in Depth Strategy
**Perimeter Security**
- Web Application Firewall (WAF)
- DDoS protection and rate limiting
- SSL/TLS encryption for all communications
- Content Security Policy (CSP) headers

**Application Security**
- Input validation and sanitization
- SQL injection and XSS prevention
- Secure coding practices and code reviews
- Dependency scanning and vulnerability management

**Data Security**
- Encryption at rest and in transit
- Database access controls and audit logging
- Personal data anonymization and pseudonymization
- Secure backup and recovery procedures

### API Security Patterns

**OAuth 2.0 / OpenID Connect**
- Standardized authentication and authorization
- Token-based access control
- Scope-based permissions
- Refresh token rotation and security

**API Rate Limiting**
- Per-user and per-endpoint quotas
- Sliding window and token bucket algorithms
- Graceful degradation under load
- Premium tier rate limit increases

**Request Validation**
- Schema validation for all inputs
- Type checking and format validation
- Business rule enforcement
- Audit logging for security events

## Performance and Scalability Patterns

### Caching Strategy
**Multi-Level Caching**
- **CDN**: Static assets and public content
- **Application Cache**: Frequently accessed data
- **Database Query Cache**: Expensive query results
- **Session Cache**: User context and preferences

**Cache Invalidation Patterns**
- **Time-based expiration**: Automatic cache refresh
- **Event-based invalidation**: Cache updates on data changes
- **Manual cache control**: Administrative cache management
- **Conditional requests**: ETag and Last-Modified headers

### Database Optimization Patterns

**Read Replicas**
- Geographic distribution for global access
- Load balancing across multiple replicas
- Eventual consistency for read operations
- Failover capabilities for high availability

**Sharding Strategy**
- Horizontal partitioning by user ID
- Consistent hashing for data distribution
- Cross-shard query optimization
- Automatic rebalancing and migration

**Connection Pooling**
- Efficient database connection management
- Connection limits and timeout handling
- Health checks and automatic recovery
- Performance monitoring and optimization

These patterns provide a solid foundation for building a scalable, maintainable, and secure platform that can grow with the community and adapt to changing requirements. 