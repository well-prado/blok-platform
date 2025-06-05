import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Grid, List, Star, Download, Calendar, User, Tag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { workflowApi, type Workflow } from '../lib/api';
import { formatRelativeTime, truncateText } from '../lib/utils';

export default function WorkflowsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch workflows
  const { data: workflowsData, isLoading, error } = useQuery({
    queryKey: ['workflows', { searchQuery, category, sortBy, sortOrder }],
    queryFn: () => 
      searchQuery 
        ? workflowApi.search({
            query: searchQuery,
            category: category !== 'all' ? category : undefined,
            sortBy,
            sortOrder,
            limit: 20,
          })
        : workflowApi.list({
            sortBy,
            sortOrder,
            limit: 20,
          }),
  });

  const workflows = workflowsData?.workflows || [];

  const categories = [
    'all',
    'automation',
    'data-processing',
    'integration',
    'monitoring',
    'analytics',
    'communication',
    'other'
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'updated_at', label: 'Last Updated' },
    { value: 'downloadCount', label: 'Downloads' },
    { value: 'rating', label: 'Rating' },
    { value: 'name', label: 'Name' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Query will automatically refresh due to dependency
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-secondary-900">Error Loading Workflows</h2>
          <p className="mt-2 text-secondary-600">Unable to load workflows. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">Discover Workflows</h1>
          <p className="mt-2 text-lg text-secondary-600">
            Explore thousands of community-created workflows to automate your tasks
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="btn-outline flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
          </form>

          {/* Filters Panel */}
          {isFilterOpen && (
            <div className="card p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input w-full"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Sort by
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="input w-full"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Order
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    className="input w-full"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* View Controls */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-secondary-600">
              {isLoading ? 'Loading...' : `${workflows.length} workflows found`}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${
                  viewMode === 'grid' 
                    ? 'bg-primary-100 text-primary-600' 
                    : 'text-secondary-400 hover:text-secondary-600'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${
                  viewMode === 'list' 
                    ? 'bg-primary-100 text-primary-600' 
                    : 'text-secondary-400 hover:text-secondary-600'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-4 bg-secondary-200 rounded mb-4"></div>
                <div className="h-3 bg-secondary-200 rounded mb-2"></div>
                <div className="h-3 bg-secondary-200 rounded mb-4 w-3/4"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-secondary-200 rounded w-16"></div>
                  <div className="h-3 bg-secondary-200 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Workflows Grid */}
        {!isLoading && workflows.length > 0 && (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
                                     {workflows.map((workflow: Workflow) => (
              <WorkflowCard key={workflow.id || workflow._id} workflow={workflow} viewMode={viewMode} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && workflows.length === 0 && (
          <div className="text-center py-12">
            <div className="text-secondary-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No workflows found</h3>
            <p className="text-secondary-600 mb-6">
              {searchQuery 
                ? `No workflows match "${searchQuery}". Try adjusting your search terms.`
                : 'No workflows available at the moment.'}
            </p>
            <Link to="/workflows/create" className="btn-primary">
              Create the First Workflow
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

interface WorkflowCardProps {
  workflow: Workflow;
  viewMode: 'grid' | 'list';
}

function WorkflowCard({ workflow, viewMode }: WorkflowCardProps) {
  if (viewMode === 'list') {
    return (
      <Link to={`/workflows/${workflow._id}`} className="card-hover p-6 block">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">{workflow.name}</h3>
            <p className="text-secondary-600 mb-4">{truncateText(workflow.description, 150)}</p>
            
            <div className="flex items-center space-x-6 text-sm text-secondary-500">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                {workflow.createdBy}
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {formatRelativeTime(workflow.createdAt)}
              </div>
              <div className="flex items-center">
                <Download className="h-4 w-4 mr-1" />
                {workflow.downloadCount}
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1" />
                {workflow.rating.toFixed(1)} ({workflow.ratingCount})
              </div>
            </div>
          </div>
          
          <div className="ml-6">
            <span className="badge-primary">{workflow.category}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/workflows/${workflow._id}`} className="card-hover p-6 block">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-secondary-900 line-clamp-2">{workflow.name}</h3>
        <span className="badge-primary ml-2">{workflow.category}</span>
      </div>
      
      <p className="text-secondary-600 text-sm mb-4 line-clamp-3">
        {truncateText(workflow.description, 120)}
      </p>
      
      {/* Tags */}
      {workflow.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {workflow.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="badge-secondary text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </span>
          ))}
          {workflow.tags.length > 3 && (
            <span className="badge-secondary text-xs">+{workflow.tags.length - 3}</span>
          )}
        </div>
      )}
      
      <div className="flex items-center justify-between text-sm text-secondary-500">
        <div className="flex items-center">
          <User className="h-4 w-4 mr-1" />
          {workflow.createdBy}
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <Download className="h-4 w-4 mr-1" />
            {workflow.downloadCount}
          </div>
          <div className="flex items-center">
            <Star className="h-4 w-4 mr-1" />
            {workflow.rating.toFixed(1)}
          </div>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-secondary-400">
        Updated {formatRelativeTime(workflow.updatedAt)}
      </div>
    </Link>
  );
} 