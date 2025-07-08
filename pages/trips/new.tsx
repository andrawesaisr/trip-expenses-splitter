import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import TripForm from '../../components/TripForm'
import { IPerson } from '../../lib/models/Trip'

const NewTripPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (tripData: { name: string; people: IPerson[] }) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData),
      })

      const result = await response.json()

      if (response.ok) {
        router.push(`/trips/${result.data._id}`)
      } else {
        alert(`Error creating trip: ${result.error}`)
      }
    } catch (error) {
      console.error('Error creating trip:', error)
      alert('Failed to create trip')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout title="Create New Trip - Trip Manager" description="Create a new trip and add participants">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Trip</h1>
          <p className="text-gray-600">Plan your next adventure and invite participants</p>
        </div>
        
        <TripForm 
          onSubmit={handleSubmit}
          submitLabel="Create Trip"
          isLoading={isLoading}
        />
      </div>
    </Layout>
  )
}

export default NewTripPage