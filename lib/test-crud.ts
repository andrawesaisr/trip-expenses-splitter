import connectToDatabase from './mongodb'
import { Trip, Expense } from './models'
import { seedDatabase, clearDatabase, getDatabaseStats } from './seed'

async function testCRUDOperations() {
  try {
    console.log('🧪 Starting CRUD Operations Test\n')
    
    // Connect to database
    await connectToDatabase()
    console.log('✅ Database connected successfully')
    
    // Clear existing data
    await clearDatabase(true)
    console.log('')
    
    // Test Trip CRUD operations
    console.log('🏖️  Testing Trip CRUD Operations')
    console.log('================================')
    
    // Create a new trip
    const newTrip = new Trip({
      name: 'Test Trip to Tokyo',
      people: [
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Smith', email: 'jane@example.com' },
        { name: 'Mike Johnson' }
      ]
    })
    
    await newTrip.save()
    console.log('✅ Trip created:', newTrip.name)
    
    // Read the trip
    const retrievedTrip = await Trip.findById(newTrip._id)
    console.log('✅ Trip retrieved:', retrievedTrip?.name)
    
    // Update the trip
    const updatedTrip = await Trip.findByIdAndUpdate(
      newTrip._id,
      { name: 'Updated Trip to Tokyo' },
      { new: true }
    )
    console.log('✅ Trip updated:', updatedTrip?.name)
    
    // Test Expense CRUD operations
    console.log('\n💰 Testing Expense CRUD Operations')
    console.log('==================================')
    
    // Create a new expense
    const newExpense = new Expense({
      tripId: newTrip._id,
      paidBy: 'John Doe',
      amount: 150.75,
      description: 'Hotel booking',
      sharedBy: ['John Doe', 'Jane Smith', 'Mike Johnson'],
      category: 'accommodation',
      date: new Date()
    })
    
    await newExpense.save()
    console.log('✅ Expense created:', newExpense.description, `- $${newExpense.amount}`)
    
    // Read the expense with population
    const retrievedExpense = await Expense.findById(newExpense._id).populate('tripId', 'name')
    console.log('✅ Expense retrieved:', retrievedExpense?.description)
    console.log('   Trip:', retrievedExpense?.tripId?.name)
    
    // Test expense split calculation
    const splits = retrievedExpense?.calculateSplit()
    console.log('✅ Expense splits calculated:', splits)
    
    // Update the expense
    const updatedExpense = await Expense.findByIdAndUpdate(
      newExpense._id,
      { amount: 200.00, description: 'Hotel booking (updated)' },
      { new: true }
    )
    console.log('✅ Expense updated:', updatedExpense?.description, `- $${updatedExpense?.amount}`)
    
    // Test database seeding
    console.log('\n🌱 Testing Database Seeding')
    console.log('===========================')
    
    const seedResult = await seedDatabase({ clearExisting: true, verbose: true })
    console.log('✅ Database seeded:', seedResult.message)
    
    // Test database stats
    console.log('\n📊 Testing Database Stats')
    console.log('==========================')
    
    const stats = await getDatabaseStats()
    console.log('✅ Database stats:')
    console.log('   Trips:', stats.trips)
    console.log('   Expenses:', stats.expenses)
    console.log('   Total Amount:', `$${stats.totalAmount}`)
    
    // Test advanced queries
    console.log('\n🔍 Testing Advanced Queries')
    console.log('============================')
    
    // Find all trips with expenses
    const tripsWithExpenses = await Trip.aggregate([
      {
        $lookup: {
          from: 'expenses',
          localField: '_id',
          foreignField: 'tripId',
          as: 'expenses'
        }
      },
      {
        $project: {
          name: 1,
          peopleCount: { $size: '$people' },
          expenseCount: { $size: '$expenses' },
          totalAmount: { $sum: '$expenses.amount' }
        }
      }
    ])
    
    console.log('✅ Trips with expense summary:')
    tripsWithExpenses.forEach(trip => {
      console.log(`   ${trip.name}: ${trip.peopleCount} people, ${trip.expenseCount} expenses, $${trip.totalAmount}`)
    })
    
    // Find expenses by category
    const expensesByCategory = await Expense.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ])
    
    console.log('✅ Expenses by category:')
    expensesByCategory.forEach(category => {
      console.log(`   ${category._id}: ${category.count} expenses, $${category.totalAmount}`)
    })
    
    // Test validation errors
    console.log('\n⚠️  Testing Validation')
    console.log('======================')
    
    try {
      const invalidTrip = new Trip({
        name: '',
        people: []
      })
      await invalidTrip.save()
    } catch (error) {
      console.log('✅ Trip validation error caught:', error instanceof Error ? error.message : error)
    }
    
    try {
      const invalidExpense = new Expense({
        tripId: newTrip._id,
        paidBy: 'Invalid Person',
        amount: -50,
        sharedBy: []
      })
      await invalidExpense.save()
    } catch (error) {
      console.log('✅ Expense validation error caught:', error instanceof Error ? error.message : error)
    }
    
    console.log('\n🎉 All CRUD operations completed successfully!')
    
  } catch (error) {
    console.error('❌ Error during CRUD operations:', error)
    throw error
  }
}

// Export for use in API routes or scripts
export { testCRUDOperations }

// Run if this file is executed directly
if (require.main === module) {
  testCRUDOperations()
    .then(() => {
      console.log('\n✅ Test completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error)
      process.exit(1)
    })
}