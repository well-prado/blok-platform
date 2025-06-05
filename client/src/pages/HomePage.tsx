import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Users, Star, Code } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: Code,
      title: 'Workflow Builder',
      description: 'Create powerful workflows with our intuitive visual editor',
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Share, discover, and collaborate with developers worldwide',
    },
    {
      icon: Star,
      title: 'AI Powered',
      description: 'Generate workflows from natural language descriptions',
    },
    {
      icon: Zap,
      title: 'Multi-Runtime',
      description: 'Support for Node.js, Python, and Bun execution environments',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 px-4 py-20 md:py-32">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-secondary-900 mb-6">
            Build. Share.
            <span className="text-primary-600"> Discover.</span>
          </h1>
          <p className="text-xl md:text-2xl text-secondary-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            The revolutionary community platform for creating, sharing, and discovering 
            powerful workflows with AI-powered generation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/workflows"
              className="btn-primary text-lg px-8 py-4"
            >
              Explore Workflows
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/register"
              className="btn-outline text-lg px-8 py-4"
            >
              Join Community
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Why Choose Blok Community?
            </h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              Experience the future of workflow development with our cutting-edge platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-secondary-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of developers building the future of workflow automation
          </p>
          <Link
            to="/register"
            className="inline-flex items-center bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
          >
            Create Your Account
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
} 