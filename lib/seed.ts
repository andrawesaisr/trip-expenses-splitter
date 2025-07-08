import connectToDatabase from './mongodb'
import { Trip, Expense } from './models'
import { Types } from 'mongoose'

interface SeedOptions {
  clearExisting?: boolean
  verbose?: boolean
}

export async function seedDatabase(options: SeedOptions = {}) {
  const { clearExisting = false, verbose = false } = options
  
  try {
    // Connect to database
    await connectToDatabase()
    
    if (verbose) {
      console.log('🌱 Starting database seeding...')
    }
    
    // Clear existing data if requested
    if (clearExisting) {
      await Trip.deleteMany({})
      await Expense.deleteMany({})
      if (verbose) {
        console.log('🧹 Cleared existing data')
      }
    }
    
    // Create sample trips
    const trips = await createSampleTrips(verbose)
    
    // Create sample expenses
    await createSampleExpenses(trips, verbose)
    
    if (verbose) {
      console.log('✅ Database seeding completed successfully!')
    }
    
    return {
      success: true,
      message: 'Database seeded successfully',
      tripsCreated: trips.length
    }
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

async function createSampleTrips(verbose: boolean) {
  const sampleTrips = [
    {
      name: 'Weekend in Paris',
      people: [
        { name: 'Alice Johnson', email: 'alice@example.com' },
        { name: 'Bob Smith', email: 'bob@example.com' },
        { name: 'Charlie Brown', email: 'charlie@example.com' }
      ]
    },
    {
      name: 'Ski Trip to Alps',
      people: [
        { name: 'David Wilson', email: 'david@example.com' },
        { name: 'Emma Davis', email: 'emma@example.com' },
        { name: 'Frank Miller', email: 'frank@example.com' },
        { name: 'Grace Taylor', email: 'grace@example.com' }
      ]
    },
    {
      name: 'Beach Holiday in Bali',
      people: [
        { name: 'Henry Anderson', email: 'henry@example.com' },
        { name: 'Ivy Martinez', email: 'ivy@example.com' }
      ]
    }
  ]
  
  const createdTrips = []
  
  for (const tripData of sampleTrips) {
    try {
      const trip = new Trip(tripData)
      await trip.save()
      createdTrips.push(trip)
      
      if (verbose) {
        console.log(`🏖️  Created trip: ${trip.name} with ${trip.people.length} people`)
      }
    } catch (error) {
      console.error(`Error creating trip ${tripData.name}:`, error)
    }
  }
  
  return createdTrips
}

async function createSampleExpenses(trips: any[], verbose: boolean) {
  const sampleExpenses = [
    // Paris trip expenses
    {
      tripIndex: 0,
      expenses: [
        {
          paidBy: 'Alice Johnson',
          amount: 150.00,
          description: 'Hotel accommodation for 2 nights',
          sharedBy: ['Alice Johnson', 'Bob Smith', 'Charlie Brown'],
          category: 'accommodation',
          date: new Date('2024-01-15')
        },
        {
          paidBy: 'Bob Smith',
          amount: 75.50,
          description: 'Dinner at Le Bistro',
          sharedBy: ['Alice Johnson', 'Bob Smith', 'Charlie Brown'],
          category: 'food',
          date: new Date('2024-01-15')
        },
        {
          paidBy: 'Charlie Brown',
          amount: 45.00,
          description: 'Metro tickets',
          sharedBy: ['Alice Johnson', 'Bob Smith', 'Charlie Brown'],
          category: 'transportation',
          date: new Date('2024-01-16')
        }
      ]
    },
    // Ski trip expenses
    {
      tripIndex: 1,
      expenses: [
        {
          paidBy: 'David Wilson',
          amount: 200.00,
          description: 'Ski equipment rental',
          sharedBy: ['David Wilson', 'Emma Davis', 'Frank Miller', 'Grace Taylor'],
          category: 'entertainment',
          date: new Date('2024-02-10')
        },
        {
          paidBy: 'Emma Davis',
          amount: 320.00,
          description: 'Chalet rental',
          sharedBy: ['David Wilson', 'Emma Davis', 'Frank Miller', 'Grace Taylor'],
          category: 'accommodation',
          date: new Date('2024-02-10')
        },
        {
          paidBy: 'Frank Miller',
          amount: 80.00,
          description: 'Groceries for the week',
          sharedBy: ['David Wilson', 'Emma Davis', 'Frank Miller', 'Grace Taylor'],
          category: 'food',
          date: new Date('2024-02-11')
        }
      ]
    },
    // Bali trip expenses
    {
      tripIndex: 2,
      expenses: [
        {
          paidBy: 'Henry Anderson',
          amount: 500.00,
          description: 'Flight tickets',
          sharedBy: ['Henry Anderson', 'Ivy Martinez'],
          category: 'transportation',
          date: new Date('2024-03-01')
        },
        {
          paidBy: 'Ivy Martinez',
          amount: 120.00,
          description: 'Beachside resort (per night)',
          sharedBy: ['Henry Anderson', 'Ivy Martinez'],
          category: 'accommodation',
          date: new Date('2024-03-01')
        }
      ]
    }
  ]
  
  let totalExpenses = 0
  
  for (const tripExpenses of sampleExpenses) {
    const trip = trips[tripExpenses.tripIndex]
    if (!trip) continue
    
    for (const expenseData of tripExpenses.expenses) {
      try {
        const expense = new Expense({
          ...expenseData,
          tripId: trip._id
        })
        await expense.save()
        totalExpenses++
        
        if (verbose) {
          console.log(`💰 Created expense: ${expense.description} - $${expense.amount} (${expense.category})`)
        }
      } catch (error) {
        console.error(`Error creating expense ${expenseData.description}:`, error)
      }
    }
  }
  
  if (verbose) {
    console.log(`📊 Total expenses created: ${totalExpenses}`)
  }
}

// Utility function to clear all data
export async function clearDatabase(verbose: boolean = false) {
  try {
    await connectToDatabase()
    
    const tripCount = await Trip.countDocuments()
    const expenseCount = await Expense.countDocuments()
    
    await Trip.deleteMany({})
    await Expense.deleteMany({})
    
    if (verbose) {
      console.log(`🧹 Cleared ${tripCount} trips and ${expenseCount} expenses`)
    }
    
    return {
      success: true,
      message: `Cleared ${tripCount} trips and ${expenseCount} expenses`,
      cleared: { trips: tripCount, expenses: expenseCount }
    }
    
  } catch (error) {
    console.error('❌ Error clearing database:', error)
    throw error
  }
}

// Utility function to get database stats
export async function getDatabaseStats() {
  try {
    await connectToDatabase()
    
    const tripCount = await Trip.countDocuments()
    const expenseCount = await Expense.countDocuments()
    
    // Calculate total expenses amount
    const totalAmountResult = await Expense.aggregate([
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ])
    
    const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].totalAmount : 0
    
    return {
      trips: tripCount,
      expenses: expenseCount,
      totalAmount: totalAmount
    }
    
  } catch (error) {
    console.error('❌ Error getting database stats:', error)
    throw error
  }
}