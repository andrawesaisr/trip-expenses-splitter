import React, { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import TripList from '../../components/TripList'
import { ITrip } from '../../lib/models/Trip'

interface TripsPageProps {
  initialTrips: ITrip[]
}

const TripsPage: React.FC<TripsPageProps> = ({ initialTrips }) => {
  const [trips, setTrips] = useState<ITrip[]>(initialTrips)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTrips(trips.filter(trip => trip._id !== tripId))
      } else {
        const error = await response.json()
        alert(`Error deleting trip: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting trip:', error)
      alert('Failed to delete trip')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout title="All Trips - Trip Manager" description="View and manage all your trips">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Trips</h1>
          <p className="text-gray-600">Organize and manage your travel adventures</p>
        </div>
        
        <TripList 
          trips={trips} 
          onDeleteTrip={handleDeleteTrip}
          isLoading={isLoading}
        />
      </div>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Use the request headers to determine the correct base URL
    const { req } = context
    const protocol = req.headers['x-forwarded-proto'] || 'http'
    const host = req.headers.host
    const baseUrl = `${protocol}://${host}`
    
    const response = await fetch(`${baseUrl}/api/trips`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch trips')
    }
    
    const data = await response.json()
    
    return {
      props: {
        initialTrips: data.data || []
      }
    }
  } catch (error) {
    console.error('Error fetching trips:', error)
    return {
      props: {
        initialTrips: []
      }
    }
  }
}

export default TripsPage