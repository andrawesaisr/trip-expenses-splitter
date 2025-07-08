import React, { useState } from 'react'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import TripDetail from '../../../components/TripDetail'
import { ITrip, IPerson } from '../../../lib/models/Trip'

interface TripDetailPageProps {
  trip: ITrip | null
  error?: string
}

const TripDetailPage: React.FC<TripDetailPageProps> = ({ trip, error }) => {
  const [currentTrip, setCurrentTrip] = useState<ITrip | null>(trip)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  if (error || !currentTrip) {
    return (
      <Layout title="Trip Not Found - Trip Manager">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Trip Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The trip you are looking for does not exist.'}</p>
          <button
            onClick={() => router.push('/trips')}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Back to Trips
          </button>
        </div>
      </Layout>
    )
  }

  const handleUpdateTrip = async (tripId: string, updatedTrip: { name: string; people: IPerson[] }) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTrip),
      })

      const result = await response.json()

      if (response.ok) {
        setCurrentTrip(result.data)
      } else {
        alert(`Error updating trip: ${result.error}`)
      }
    } catch (error) {
      console.error('Error updating trip:', error)
      alert('Failed to update trip')
    } finally {
      setIsLoading(false)
    }
  }

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
        router.push('/trips')
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
    <Layout 
      title={`${currentTrip.name} - Trip Manager`} 
      description={`View details for ${currentTrip.name} trip with ${currentTrip.people.length} participants`}
    >
      <TripDetail
        trip={currentTrip}
        onUpdateTrip={handleUpdateTrip}
        onDeleteTrip={handleDeleteTrip}
        isLoading={isLoading}
      />
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!
  
  try {
    // Use the request headers to determine the correct base URL
    const { req } = context
    const protocol = req.headers['x-forwarded-proto'] || 'http'
    const host = req.headers.host
    const baseUrl = `${protocol}://${host}`
    
    const response = await fetch(`${baseUrl}/api/trips/${id}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        return {
          props: {
            trip: null,
            error: 'Trip not found'
          }
        }
      }
      throw new Error('Failed to fetch trip')
    }
    
    const data = await response.json()
    
    return {
      props: {
        trip: data.data
      }
    }
  } catch (error) {
    console.error('Error fetching trip:', error)
    return {
      props: {
        trip: null,
        error: 'Failed to load trip'
      }
    }
  }
}

export default TripDetailPage