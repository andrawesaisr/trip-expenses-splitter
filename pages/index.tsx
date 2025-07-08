import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Layout from '../components/Layout'

interface ConnectionStatus {
  isConnected: boolean
  message: string
}

export default function Home() {
  const [dbStatus, setDbStatus] = useState<ConnectionStatus>({
    isConnected: false,
    message: 'Checking connection...'
  })

  useEffect(() => {
    // Test database connection
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setDbStatus({
          isConnected: data.success,
          message: data.message
        })
      })
      .catch(() => {
        setDbStatus({
          isConnected: false,
          message: 'Failed to connect to database'
        })
      })
  }, [])

  const features = [
    {
      icon: '🗺️',
      title: 'Plan Your Trips',
      description: 'Create and organize trips with detailed information and participant management.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '👥',
      title: 'Manage Participants',
      description: 'Add, edit, and remove trip participants with ease. Keep everyone organized.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: '💰',
      title: 'Split Expenses',
      description: 'Track shared expenses and calculate who owes what with smart settlement suggestions.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: '📊',
      title: 'Trip Analytics',
      description: 'View comprehensive summaries and export trip data for your records.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: '📱',
      title: 'Mobile Friendly',
      description: 'Access your trip information from any device with our responsive design.',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: '🔒',
      title: 'Secure & Reliable',
      description: 'Your data is safe with MongoDB and built-in validation systems.',
      color: 'from-gray-500 to-gray-700'
    }
  ]

  return (
    <Layout title="Trip Manager - Organize Your Adventures" description="Plan and manage your trips with participants and expenses">
      <div className="animate-fade-in">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 text-balance">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Trip Manager
              </span>
              <div className="text-4xl md:text-5xl mt-2">
                ✈️ Plan Better Together
              </div>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto text-balance">
              Organize your adventures, manage participants, track expenses, and split costs fairly. 
              Everything you need for stress-free group travel.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/trips/new" className="btn btn-primary btn-lg">
                🚀 Create Your First Trip
              </Link>
              <Link href="/trips" className="btn btn-outline btn-lg">
                📋 View All Trips
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">Simple</div>
                <div className="text-gray-600">Easy to use interface</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">Smart</div>
                <div className="text-gray-600">Intelligent expense splitting</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">Secure</div>
                <div className="text-gray-600">Your data protected</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-xl text-gray-600">Powerful features to make group travel planning effortless</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="card card-hover group">
                <div className="card-body text-center">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-3xl">{feature.icon}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Card */}
        <div className="card max-w-4xl mx-auto">
          <div className="card-body">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">System Status</h2>
              <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full ${
                dbStatus.isConnected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  dbStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="font-medium">{dbStatus.message}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-blue-600">⚙️</span>
                  Technology Stack
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
                    Next.js 14 with TypeScript
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
                    MongoDB with Mongoose ODM
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
                    Tailwind CSS styling
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
                    Responsive design
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-purple-600">🚀</span>
                  Features
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
                    Complete trip management
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
                    Expense tracking & splitting
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
                    Smart settlement calculations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
                    Export & reporting
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl opacity-90 mb-6">
              Join thousands of travelers who trust Trip Manager for their group adventures
            </p>
            <Link href="/trips/new" className="btn bg-white text-blue-600 hover:bg-gray-100 btn-lg">
              Create Your First Trip Now
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}