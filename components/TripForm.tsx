import React, { useState, useEffect } from 'react'
import { ITrip, IPerson } from '../lib/models/Trip'

interface TripFormProps {
  onSubmit: (tripData: { name: string; people: IPerson[] }) => void
  onCancel?: () => void
  initialData?: ITrip
  isLoading?: boolean
  submitLabel?: string
  title?: string
}

const TripForm: React.FC<TripFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
  submitLabel = 'Create Trip',
  title = 'Create New Trip'
}) => {
  const [tripName, setTripName] = useState(initialData?.name || '')
  const [people, setPeople] = useState<IPerson[]>(
    initialData?.people || [{ name: '', email: '' }]
  )
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (initialData) {
      setTripName(initialData.name)
      setPeople(initialData.people.length > 0 ? initialData.people : [{ name: '', email: '' }])
    }
  }, [initialData])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    // Validate trip name
    if (!tripName.trim()) {
      newErrors.tripName = 'Trip name is required'
    } else if (tripName.length > 100) {
      newErrors.tripName = 'Trip name must be less than 100 characters'
    }

    // Validate people
    const validPeople = people.filter(person => person.name.trim())
    if (validPeople.length === 0) {
      newErrors.people = 'At least one participant is required'
    }

    // Validate individual people
    people.forEach((person, index) => {
      if (person.name.trim() && person.email && !isValidEmail(person.email)) {
        newErrors[`email_${index}`] = 'Please enter a valid email address'
      }
    })

    // Check for duplicate names
    const names = validPeople.map(p => p.name.trim().toLowerCase())
    const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index)
    if (duplicateNames.length > 0) {
      newErrors.people = 'Participant names must be unique'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const validPeople = people
      .filter(person => person.name.trim())
      .map(person => ({
        name: person.name.trim(),
        email: person.email?.trim() || ''
      }))

    onSubmit({
      name: tripName.trim(),
      people: validPeople
    })
  }

  const handlePersonChange = (index: number, field: keyof IPerson, value: string) => {
    const newPeople = [...people]
    newPeople[index] = { ...newPeople[index], [field]: value }
    setPeople(newPeople)
    
    // Clear specific errors when user starts typing
    if (errors[`email_${index}`]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[`email_${index}`]
        return newErrors
      })
    }
  }

  const addPerson = () => {
    setPeople([...people, { name: '', email: '' }])
  }

  const removePerson = (index: number) => {
    if (people.length > 1) {
      setPeople(people.filter((_, i) => i !== index))
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-1">
            {initialData ? 'Update your trip details' : 'Start planning your next adventure'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="card-body space-y-6">
          {/* Trip Name */}
          <div className="form-group">
            <label htmlFor="tripName" className="form-label">
              ✈️ Trip Name
            </label>
            <input
              type="text"
              id="tripName"
              value={tripName}
              onChange={(e) => {
                setTripName(e.target.value)
                if (errors.tripName) {
                  setErrors(prev => ({ ...prev, tripName: '' }))
                }
              }}
              className={`form-input ${errors.tripName ? 'border-red-500' : ''}`}
              placeholder="e.g., Summer Road Trip 2024"
              maxLength={100}
              disabled={isLoading}
            />
            {errors.tripName && <div className="form-error">{errors.tripName}</div>}
            <div className="form-help">
              Give your trip a memorable name ({tripName.length}/100)
            </div>
          </div>

          {/* Participants */}
          <div className="form-group">
            <div className="flex items-center justify-between mb-4">
              <label className="form-label mb-0">
                👥 Participants
              </label>
              <button
                type="button"
                onClick={addPerson}
                className="btn btn-primary btn-sm"
                disabled={isLoading}
              >
                ➕ Add Person
              </button>
            </div>
            
            {errors.people && <div className="form-error mb-4">{errors.people}</div>}
            
            <div className="space-y-4">
              {people.map((person, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {person.name.charAt(0).toUpperCase() || (index + 1)}
                    </div>
                    <span className="font-medium text-gray-700">
                      Participant {index + 1}
                    </span>
                    {people.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePerson(index)}
                        className="btn btn-danger btn-sm ml-auto"
                        disabled={isLoading}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        value={person.name}
                        onChange={(e) => handlePersonChange(index, 'name', e.target.value)}
                        className="form-input"
                        placeholder="Name (required)"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        value={person.email || ''}
                        onChange={(e) => handlePersonChange(index, 'email', e.target.value)}
                        className={`form-input ${errors[`email_${index}`] ? 'border-red-500' : ''}`}
                        placeholder="Email (optional)"
                        disabled={isLoading}
                      />
                      {errors[`email_${index}`] && (
                        <div className="form-error">{errors[`email_${index}`]}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="form-help">
              Add all the people who will be joining this trip. You can add more later.
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>{submitLabel}</span>
                </>
              )}
            </button>
            
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default TripForm