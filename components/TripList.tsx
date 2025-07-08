import React from 'react'
import Link from 'next/link'
import { ITrip } from '../lib/models/Trip'

interface TripListProps {
  trips: ITrip[]
  onDeleteTrip?: (tripId: string) => void
  isLoading?: boolean
}

const TripList: React.FC<TripListProps> = ({ trips, onDeleteTrip, isLoading = false }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getParticipantText = (count: number) => {
    if (count === 1) return '1 participant'
    return `${count} participants`
  }

  if (trips.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">✈️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No trips yet</h2>
        <p className="text-gray-600 mb-8">
          Start planning your first adventure!
        </p>
        <Link href="/trips/new" className="btn btn-primary btn-lg">
          🚀 Create Your First Trip
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Trips</h2>
          <p className="text-gray-600">
            {trips.length} trip{trips.length !== 1 ? 's' : ''} planned
          </p>
        </div>
        <Link href="/trips/new" className="btn btn-primary">
          ➕ Create New Trip
        </Link>
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip) => (
          <div key={String(trip._id)} className="card card-hover group">
            <div className="card-body">
              {/* Trip Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {trip.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Created {formatDate(trip.createdAt.toString())}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold group-hover:scale-105 transition-transform">
                  {trip.name.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Participants */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">👥 Participants</span>
                  <span className="badge badge-primary">
                    {getParticipantText(trip.people.length)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trip.people.slice(0, 3).map((person, index) => (
                    <div key={index} className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
                      <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-gray-700">{person.name}</span>
                    </div>
                  ))}
                  {trip.people.length > 3 && (
                    <span className="text-xs text-gray-500 px-2 py-1">
                      +{trip.people.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/trips/${String(trip._id)}`}
                  className="btn btn-primary btn-sm flex-1"
                >
                  👁️ View Details
                </Link>
                <Link
                  href={`/trips/${String(trip._id)}/summary`}
                  className="btn btn-secondary btn-sm"
                >
                  📊
                </Link>
                <Link
                  href={`/trips/${String(trip._id)}/edit`}
                  className="btn btn-outline btn-sm"
                >
                  ✏️
                </Link>
                {onDeleteTrip && (
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${trip.name}"?`)) {
                        onDeleteTrip(String(trip._id))
                      }
                    }}
                    className="btn btn-danger btn-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? <span className="spinner"></span> : '🗑️'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">
          Ready to plan another adventure?
        </p>
        <Link href="/trips/new" className="btn btn-primary">
          ➕ Create New Trip
        </Link>
      </div>
    </div>
  )
}

export default TripList