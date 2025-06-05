// MongoDB initialization script for Blok Platform
db = db.getSiblingDB('blok_platform');

// Create workflows collection
db.createCollection('workflows');
db.createCollection('user_favorites');
db.createCollection('workflow_comments');
db.createCollection('workflow_ratings');
db.createCollection('categories');

// Create indexes
db.workflows.createIndex({ 'createdBy': 1 });
db.workflows.createIndex({ 'isPublic': 1 });
db.workflows.createIndex({ 'category': 1 });
db.workflows.createIndex({ 'createdAt': -1 });
db.workflows.createIndex({ 'name': 'text', 'description': 'text' });

db.user_favorites.createIndex({ 'userId': 1, 'workflowId': 1 }, { unique: true });
db.workflow_comments.createIndex({ 'workflowId': 1 });
db.workflow_ratings.createIndex({ 'workflowId': 1, 'userId': 1 }, { unique: true });

// Insert sample categories
db.categories.insertMany([
  { name: 'Data Processing', description: 'Workflows for data transformation and processing' },
  { name: 'API Integration', description: 'Workflows for integrating with external APIs' },
  { name: 'Machine Learning', description: 'AI and ML-related workflows' },
  { name: 'Database Operations', description: 'Database query and management workflows' },
  { name: 'Automation', description: 'General automation and task workflows' }
]);

print('MongoDB initialized for Blok Platform!'); 