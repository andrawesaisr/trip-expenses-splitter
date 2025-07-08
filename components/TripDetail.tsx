import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ITrip, IPerson } from '../lib/models/Trip'
import { useExpenses } from '../hooks/useExpenses'
import { ExpenseForm } from './ExpenseForm'
import { ExpenseList } from './ExpenseList'
import { ExpenseSummary } from './ExpenseSummary'
import { Expense } from '../types/expense'

interface TripDetailProps {
  trip: ITrip
  onUpdateTrip?: (tripId: string, updatedTrip: { name: string; people: IPerson[] }) => void
  onDeleteTrip?: (tripId: string) => void
  isLoading?: boolean
}

const TripDetail: React.FC<TripDetailProps> = ({ 
  trip, 
  onUpdateTrip, 
  onDeleteTrip, 
  isLoading = false 
}) => {
  const [editingPerson, setEditingPerson] = useState<number | null>(null)
  const [newPerson, setNewPerson] = useState<IPerson>({ name: '', email: '' })
  const [isAddingPerson, setIsAddingPerson] = useState(false)
  const [editPersonData, setEditPersonData] = useState<IPerson>({ name: '', email: '' })
  
  // Expense management state
  const [activeTab, setActiveTab] = useState<'summary' | 'expenses'>('summary')
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  
  // Use the expenses hook
  const { expenses, loading: expensesLoading, error: expensesError, fetchExpenses, createExpense, updateExpense, deleteExpense } = useExpenses(String(trip._id))

  // Fetch expenses when component mounts
  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const handleAddPerson = () => {
    if (!newPerson.name.trim()) return
    
    const updatedPeople = [...trip.people, { ...newPerson, name: newPerson.name.trim() }]
    onUpdateTrip?.(String(trip._id), { name: trip.name, people: updatedPeople })
    setNewPerson({ name: '', email: '' })
    setIsAddingPerson(false)
  }

  const handleEditPerson = (index: number) => {
    setEditingPerson(index)
    setEditPersonData(trip.people[index])
  }

  const handleSavePerson = () => {
    if (!editPersonData.name.trim() || editingPerson === null) return
    
    const updatedPeople = trip.people.map((person, index) => 
      index === editingPerson ? { ...editPersonData, name: editPersonData.name.trim() } : person
    )
    onUpdateTrip?.(String(trip._id), { name: trip.name, people: updatedPeople })
    setEditingPerson(null)
    setEditPersonData({ name: '', email: '' })
  }

  const handleDeletePerson = (index: number) => {
    if (trip.people.length <= 1) {
      alert('Cannot delete the last person in a trip')
      return
    }
    
    if (confirm('Are you sure you want to remove this person from the trip?')) {
      const updatedPeople = trip.people.filter((_, i) => i !== index)
      onUpdateTrip?.(String(trip._id), { name: trip.name, people: updatedPeople })
    }
  }

  const handleCreateExpense = async (expenseData: any) => {
    try {
      await createExpense(expenseData)
      setShowExpenseForm(false)
    } catch (error) {
      console.error('Error creating expense:', error)
    }
  }

  const handleUpdateExpense = async (expenseId: string, expenseData: any) => {
    try {
      await updateExpense(expenseId, expenseData)
      setEditingExpense(null)
      setShowExpenseForm(false)
    } catch (error) {
      console.error('Error updating expense:', error)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(expenseId)
      } catch (error) {
        console.error('Error deleting expense:', error)
      }
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setShowExpenseForm(true)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{trip.name}</h1>
          <p className="text-gray-600">
            {trip.people.length} participant{trip.people.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href={`/trips/${String(trip._id)}/summary`} className="btn btn-primary">
            📊 View Summary
          </Link>
          <Link href={`/trips/${String(trip._id)}/edit`} className="btn btn-secondary">
            ✏️ Edit Trip
          </Link>
          {onDeleteTrip && (
            <button
              onClick={() => onDeleteTrip(String(trip._id))}
              className="btn btn-danger"
              disabled={isLoading}
            >
              {isLoading ? <span className="spinner"></span> : '🗑️ Delete'}
            </button>
          )}
        </div>
      </div>

      {/* Participants Section */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">👥 Participants</h2>
            <button
              onClick={() => setIsAddingPerson(true)}
              className="btn btn-primary btn-sm"
            >
              ➕ Add Person
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trip.people.map((person, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                {editingPerson === index ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={editPersonData.name}
                      onChange={(e) => setEditPersonData(prev => ({ ...prev, name: e.target.value }))}
                      className="form-input flex-1"
                      placeholder="Name"
                    />
                    <input
                      type="email"
                      value={editPersonData.email || ''}
                      onChange={(e) => setEditPersonData(prev => ({ ...prev, email: e.target.value }))}
                      className="form-input flex-1"
                      placeholder="Email (optional)"
                    />
                    <button onClick={handleSavePerson} className="btn btn-success btn-sm">
                      ✅
                    </button>
                    <button onClick={() => setEditingPerson(null)} className="btn btn-secondary btn-sm">
                      ❌
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{person.name}</div>
                        {person.email && (
                          <div className="text-sm text-gray-500">{person.email}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditPerson(index)}
                        className="btn btn-outline btn-sm"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeletePerson(index)}
                        className="btn btn-danger btn-sm"
                        disabled={trip.people.length <= 1}
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add Person Form */}
          {isAddingPerson && (
            <div className="mt-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
              <h3 className="font-medium text-blue-900 mb-3">Add New Participant</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPerson.name}
                  onChange={(e) => setNewPerson(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input flex-1"
                  placeholder="Name (required)"
                />
                <input
                  type="email"
                  value={newPerson.email || ''}
                  onChange={(e) => setNewPerson(prev => ({ ...prev, email: e.target.value }))}
                  className="form-input flex-1"
                  placeholder="Email (optional)"
                />
                <button onClick={handleAddPerson} className="btn btn-success">
                  ➕ Add
                </button>
                <button onClick={() => setIsAddingPerson(false)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expenses Section */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">💰 Expenses</h2>
            <button
              onClick={() => setShowExpenseForm(true)}
              className="btn btn-primary btn-sm"
            >
              ➕ Add Expense
            </button>
          </div>
        </div>
        <div className="card-body">
          {/* Tab Navigation */}
          <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'summary'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Summary
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'expenses'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 All Expenses
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'summary' ? (
            <ExpenseSummary
              expenses={expenses}
              tripParticipants={trip.people.map(p => p.name)}
              loading={expensesLoading}
              error={expensesError}
            />
          ) : (
            <ExpenseList
              expenses={expenses}
              participants={trip.people.map(p => p.name)}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
              loading={expensesLoading}
              error={expensesError}
            />
          )}
        </div>
      </div>

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h3>
              <ExpenseForm
                tripId={String(trip._id)}
                participants={trip.people.map(p => p.name)}
                onSubmit={editingExpense ? 
                  (data) => handleUpdateExpense(String(editingExpense._id), data) : 
                  handleCreateExpense
                }
                onCancel={() => {
                  setShowExpenseForm(false)
                  setEditingExpense(null)
                }}
                initialData={editingExpense || undefined}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TripDetail