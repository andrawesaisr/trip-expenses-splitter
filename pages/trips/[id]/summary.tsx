import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../../../components/Layout';
import TripSummary from '../../../components/TripSummary';
import { ITrip } from '../../../lib/models/Trip';
import { IExpense } from '../../../lib/models/Expense';
import { ISettlement } from '../../../lib/models/Settlement';

interface TripSummaryPageProps {
  trip: ITrip;
  expenses: IExpense[];
  initialSettlements: ISettlement[];
}

const TripSummaryPage: React.FC<TripSummaryPageProps> = ({ 
  trip, 
  expenses, 
  initialSettlements 
}) => {
  const router = useRouter();
  const [settlements, setSettlements] = useState<ISettlement[]>(initialSettlements);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSettlementUpdate = async (settlementId: string, status: 'pending' | 'paid' | 'partial', paidAmount?: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Update settlement
      const updateResponse = await fetch(`/api/settlements/${settlementId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          paidAmount,
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update settlement');
      }

      // Update local state
      setSettlements(prev => 
        prev.map(s => 
          s.id === settlementId 
            ? { ...s, status, paidAmount } as ISettlement
            : s
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settlement');
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <Layout title={`${trip.name} - Summary`}>
        <div className="max-w-4xl mx-auto">
          <div className="card bg-red-50 border-red-200">
            <div className="card-body text-center">
              <div className="text-red-600 text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Trip Summary</h2>
              <p className="text-red-700 mb-4">{error}</p>
              <button 
                onClick={() => router.push(`/trips/${trip._id}`)}
                className="btn btn-primary"
              >
                ← Back to Trip Details
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title={`${trip.name} - Summary`}
      description={`Complete financial summary for ${trip.name} with ${trip.people.length} participants`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📊 Trip Summary
            </h1>
            <p className="text-gray-600">
              Complete financial overview for <span className="font-semibold">{trip.name}</span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => router.push(`/trips/${trip._id}`)}
              className="btn btn-secondary"
            >
              ← Back to Trip
            </button>
            <button
              onClick={() => window.print()}
              className="btn btn-outline"
            >
              🖨️ Print Summary
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="card bg-blue-50 border-blue-200 mb-6">
            <div className="card-body">
              <div className="flex items-center gap-3">
                <span className="spinner"></span>
                <span className="text-blue-800">Updating settlement information...</span>
              </div>
            </div>
          </div>
        )}

        {/* Trip Summary Component */}
        <TripSummary
          trip={trip}
          expenses={expenses}
          settlements={settlements}
          onSettlementUpdate={handleSettlementUpdate}
        />
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;
  
  try {
    // Use the request headers to determine the correct base URL
    const { req } = context;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;
    
    // Fetch trip data
    const tripResponse = await fetch(`${baseUrl}/api/trips/${id}`);
    if (!tripResponse.ok) {
      throw new Error('Trip not found');
    }
    const tripData = await tripResponse.json();
    
    // Fetch expenses
    const expensesResponse = await fetch(`${baseUrl}/api/expenses?tripId=${id}`);
    if (!expensesResponse.ok) {
      throw new Error('Failed to fetch expenses');
    }
    const expensesData = await expensesResponse.json();
    
    // Fetch settlements
    let settlements = [];
    try {
      const settlementsResponse = await fetch(`${baseUrl}/api/settlements?tripId=${id}`);
      if (settlementsResponse.ok) {
        const settlementsData = await settlementsResponse.json();
        settlements = settlementsData.data || [];
      }
    } catch (error) {
      console.error('Error fetching settlements:', error);
      // Continue without settlements
    }
    
    return {
      props: {
        trip: tripData.data,
        expenses: expensesData.data || [],
        initialSettlements: settlements,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      notFound: true,
    };
  }
};

export default TripSummaryPage;