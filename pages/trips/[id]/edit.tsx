import React, { useState } from 'react'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import TripForm from '../../../components/TripForm'
import { ITrip, IPerson } from '../../../lib/models/Trip'

interface EditTripPageProps {
  trip: ITrip | null
  error?: string
}

const EditTripPage: React.FC<EditTripPageProps> = ({ trip, error }) => {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  if (error || !trip) {
    return (
      <Layout title="Trip Not Found - Trip Manager">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Trip Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The trip you are trying to edit does not exist.'}</p>
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

  const handleSubmit = async (tripData: { name: string; people: IPerson[] }) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/trips/${trip._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData),
      })

      const result = await response.json()

      if (response.ok) {
        router.push(`/trips/${trip._id}`)
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

  return (
    <Layout 
      title={`Edit ${trip.name} - Trip Manager`} 
      description={`Edit trip details and participants for ${trip.name}`}
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Trip</h1>
          <p className="text-gray-600">Update trip details and manage participants</p>
        </div>
        
        <TripForm 
          onSubmit={handleSubmit}
          initialData={trip}
          submitLabel="Update Trip"
          isLoading={isLoading}
        />

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push(`/trips/${trip._id}`)}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!
  
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001'
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

export default EditTripPage