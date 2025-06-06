import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  Users,
  Download,
  Star,
  Activity,
  Calendar,
  RefreshCw,
  Eye,
  Zap
} from 'lucide-react';

import { formatNumber, formatDate } from '../lib/utils';

interface AnalyticsData {
  totalWorkflows: number;
  totalDownloads: number;
  totalUsers: number;
  averageRating: number;
  topCategories: Array<{ category: string; count: number; percentage: number }>;
  recentActivity: Array<{ date: string; workflows: number; downloads: number; users: number }>;
  popularWorkflows: Array<{
    id: string;
    name: string;
    downloads: number;
    rating: number;
    category: string;
  }>;
  userEngagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    averageSessionTime: number;
  };
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch analytics data
  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      // Simulate analytics data - in real implementation this would call analytics API
      const mockData: AnalyticsData = {
        totalWorkflows: 1247,
        totalDownloads: 15683,
        totalUsers: 892,
        averageRating: 4.3,
        topCategories: [
          { category: 'notification', count: 324, percentage: 26 },
          { category: 'data-processing', count: 287, percentage: 23 },
          { category: 'integration', count: 198, percentage: 16 },
          { category: 'automation', count: 156, percentage: 12 },
          { category: 'communication', count: 134, percentage: 11 },
          { category: 'other', count: 148, percentage: 12 },
        ],
        recentActivity: [
          { date: '2024-01-15', workflows: 23, downloads: 156, users: 45 },
          { date: '2024-01-14', workflows: 18, downloads: 134, users: 38 },
          { date: '2024-01-13', workflows: 31, downloads: 189, users: 52 },
          { date: '2024-01-12', workflows: 27, downloads: 167, users: 41 },
          { date: '2024-01-11', workflows: 19, downloads: 142, users: 36 },
          { date: '2024-01-10', workflows: 25, downloads: 178, users: 48 },
          { date: '2024-01-09', workflows: 22, downloads: 159, users: 43 },
        ],
        popularWorkflows: [
          { id: '1', name: 'Slack Notification System', downloads: 1234, rating: 4.8, category: 'notification' },
          { id: '2', name: 'CSV Data Processor', downloads: 987, rating: 4.6, category: 'data-processing' },
          { id: '3', name: 'API Sync Automation', downloads: 856, rating: 4.5, category: 'integration' },
          { id: '4', name: 'Email Campaign Manager', downloads: 743, rating: 4.4, category: 'communication' },
          { id: '5', name: 'File Backup System', downloads: 692, rating: 4.3, category: 'automation' },
        ],
        userEngagement: {
          dailyActiveUsers: 156,
          weeklyActiveUsers: 423,
          monthlyActiveUsers: 892,
          averageSessionTime: 18.5,
        },
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-secondary-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-secondary-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 flex items-center">
              <BarChart3 className="h-8 w-8 mr-3 text-primary-600" />
              Analytics Dashboard
            </h1>
            <p className="mt-2 text-lg text-secondary-600">
              Platform insights and performance metrics
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Time Range Filter */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
              className="input"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-outline flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Workflows"
            value={analyticsData?.totalWorkflows || 0}
            icon={<Zap className="h-8 w-8 text-blue-600" />}
            trend="+12%"
            trendUp={true}
          />
          <MetricCard
            title="Total Downloads"
            value={analyticsData?.totalDownloads || 0}
            icon={<Download className="h-8 w-8 text-green-600" />}
            trend="+8%"
            trendUp={true}
          />
          <MetricCard
            title="Active Users"
            value={analyticsData?.totalUsers || 0}
            icon={<Users className="h-8 w-8 text-purple-600" />}
            trend="+15%"
            trendUp={true}
          />
          <MetricCard
            title="Average Rating"
            value={analyticsData?.averageRating || 0}
            icon={<Star className="h-8 w-8 text-yellow-500" />}
            trend="+0.2"
            trendUp={true}
            isDecimal={true}
          />
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Category Distribution */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Workflow Categories
            </h3>
            <div className="space-y-3">
              {analyticsData?.topCategories.map((category) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                    <span className="text-sm font-medium text-secondary-900 capitalize">
                      {category.category.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-secondary-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-secondary-600 w-12 text-right">
                      {category.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Engagement */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              User Engagement
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">Daily Active Users</span>
                </div>
                <span className="text-lg font-bold text-secondary-900">
                  {formatNumber(analyticsData?.userEngagement.dailyActiveUsers || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Weekly Active Users</span>
                </div>
                <span className="text-lg font-bold text-secondary-900">
                  {formatNumber(analyticsData?.userEngagement.weeklyActiveUsers || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium">Monthly Active Users</span>
                </div>
                <span className="text-lg font-bold text-secondary-900">
                  {formatNumber(analyticsData?.userEngagement.monthlyActiveUsers || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Activity className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium">Avg. Session Time</span>
                </div>
                <span className="text-lg font-bold text-secondary-900">
                  {analyticsData?.userEngagement.averageSessionTime || 0}m
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Workflows */}
        <div className="card p-6 mb-8">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Most Popular Workflows
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="text-left py-3 px-4 font-medium text-secondary-900">Workflow</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-900">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-900">Downloads</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-900">Rating</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData?.popularWorkflows.map((workflow, index) => (
                  <tr key={workflow.id} className="border-b border-secondary-100">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-secondary-600">#{index + 1}</span>
                        <span className="font-medium text-secondary-900">{workflow.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="badge-secondary capitalize">
                        {workflow.category.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <Download className="h-4 w-4 text-secondary-500" />
                        <span className="font-medium">{formatNumber(workflow.downloads)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-medium">{workflow.rating}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Recent Activity Trends
          </h3>
          <div className="space-y-4">
            {analyticsData?.recentActivity.map((day) => (
              <div key={day.date} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-secondary-900 w-20">
                    {formatDate(day.date)}
                  </span>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-secondary-600">
                        {day.workflows} workflows
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Download className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-secondary-600">
                        {day.downloads} downloads
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-secondary-600">
                        {day.users} users
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend: string;
  trendUp: boolean;
  isDecimal?: boolean;
}

function MetricCard({ title, value, icon, trend, trendUp, isDecimal = false }: MetricCardProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-secondary-500">{title}</p>
          <p className="text-2xl font-bold text-secondary-900 mt-1">
            {isDecimal ? value.toFixed(1) : formatNumber(value)}
          </p>
          <div className="flex items-center mt-2">
            <TrendingUp
              className={`h-4 w-4 mr-1 ${
                trendUp ? 'text-green-600' : 'text-red-600'
              }`}
            />
            <span
              className={`text-sm font-medium ${
                trendUp ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend}
            </span>
            <span className="text-sm text-secondary-500 ml-1">vs last period</span>
          </div>
        </div>
        <div className="flex-shrink-0">{icon}</div>
      </div>
    </div>
  );
} 