import { ITrip } from '../models/Trip';
import { formatCurrency } from './currency';

interface ParticipantBalance {
  participant: { name: string; email?: string };
  totalPaid: number;
  fairShare: number;
  balance: number;
}

interface Settlement {
  from: { name: string; email?: string };
  to: { name: string; email?: string };
  amount: number;
  id: string;
  status?: 'pending' | 'paid' | 'partially_paid';
  paidAmount?: number;
  paidAt?: Date;
}

export class SettlementExporter {
  static async exportToPDF(
    trip: ITrip,
    balances: ParticipantBalance[],
    settlements: Settlement[]
  ): Promise<void> {
    // For now, we'll use a simpler approach since jsPDF requires additional setup
    // In a real implementation, you would install jsPDF and jsPDF-autotable
    
    // Calculate totals
    const totalExpenses = balances.reduce((sum, b) => sum + b.totalPaid, 0);
    const totalSettlements = settlements.reduce((sum, s) => sum + s.amount, 0);
    
    // Create PDF content as HTML for printing
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Settlement Report - ${trip.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 30px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .table th { background-color: #f2f2f2; }
          .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
          .positive { color: #28a745; }
          .negative { color: #dc3545; }
          .zero { color: #6c757d; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Settlement Report</h1>
          <h2>${trip.name}</h2>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="section">
          <div class="summary">
            <h3>Trip Summary</h3>
            <p><strong>Total Expenses:</strong> ${formatCurrency(totalExpenses)}</p>
            <p><strong>Participants:</strong> ${trip.people.length}</p>
            <p><strong>Average per Person:</strong> ${formatCurrency(totalExpenses / trip.people.length)}</p>
          </div>
        </div>
        
        <div class="section">
          <h3>Participant Balances</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Total Paid</th>
                <th>Fair Share</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${balances.map(b => `
                <tr>
                  <td>${b.participant.name}</td>
                  <td>${formatCurrency(b.totalPaid)}</td>
                  <td>${formatCurrency(b.fairShare)}</td>
                  <td class="${b.balance > 0 ? 'positive' : b.balance < 0 ? 'negative' : 'zero'}">
                    ${formatCurrency(Math.abs(b.balance))}
                  </td>
                  <td>${b.balance > 0 ? 'Gets back' : b.balance < 0 ? 'Owes' : 'Settled'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h3>Required Settlements</h3>
          ${settlements.length === 0 ? '<p>No settlements needed - all balances are even!</p>' : `
            <table class="table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${settlements.map(s => `
                  <tr>
                    <td>${s.from.name}</td>
                    <td>${s.to.name}</td>
                    <td>${formatCurrency(s.amount)}</td>
                    <td>${s.status === 'paid' ? 'PAID' : 'PENDING'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
        
        <div class="section">
          <p><em>This report was generated automatically. Please verify all amounts before making payments.</em></p>
        </div>
      </body>
      </html>
    `;
    
    // Create a new window with the PDF content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(pdfContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Give the content time to load, then print
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  }
  
  static exportToCSV(
    trip: ITrip,
    balances: ParticipantBalance[],
    settlements: Settlement[]
  ): void {
    const totalExpenses = balances.reduce((sum, b) => sum + b.totalPaid, 0);
    
    // Create CSV content
    let csvContent = `Settlement Report - ${trip.name}\n`;
    csvContent += `Generated on: ${new Date().toLocaleDateString()}\n`;
    csvContent += `Total Expenses: ${formatCurrency(totalExpenses)}\n`;
    csvContent += `Participants: ${trip.people.length}\n\n`;
    
    // Participant Balances
    csvContent += `Participant Balances\n`;
    csvContent += `Name,Email,Total Paid,Fair Share,Balance,Status\n`;
    
    balances.forEach(balance => {
      const status = balance.balance > 0 ? 'Gets back' : balance.balance < 0 ? 'Owes' : 'Settled';
      csvContent += `${balance.participant.name},${balance.participant.email || ''},${balance.totalPaid},${balance.fairShare},${Math.abs(balance.balance)},${status}\n`;
    });
    
    csvContent += `\n`;
    
    // Required Settlements
    csvContent += `Required Settlements\n`;
    if (settlements.length === 0) {
      csvContent += `No settlements needed - all balances are even!\n`;
    } else {
      csvContent += `From,To,Amount,Status\n`;
      settlements.forEach(settlement => {
        csvContent += `${settlement.from.name},${settlement.to.name},${settlement.amount},${settlement.status === 'paid' ? 'PAID' : 'PENDING'}\n`;
      });
    }
    
    // Download the CSV
    this.downloadCSV(csvContent, `settlement-${trip.name.replace(/\s+/g, '-')}-${Date.now()}.csv`);
  }
  
  private static downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
  
  static exportToJSON(
    trip: ITrip,
    balances: ParticipantBalance[],
    settlements: Settlement[]
  ): void {
    const data = {
      trip: {
        name: trip.name,
        participants: trip.people.length,
        generatedAt: new Date().toISOString()
      },
      summary: {
        totalExpenses: balances.reduce((sum, b) => sum + b.totalPaid, 0),
        averagePerPerson: balances.reduce((sum, b) => sum + b.totalPaid, 0) / trip.people.length,
        settlementsNeeded: settlements.length
      },
      participantBalances: balances.map(b => ({
        name: b.participant.name,
        email: b.participant.email,
        totalPaid: b.totalPaid,
        fairShare: b.fairShare,
        balance: b.balance,
        status: b.balance > 0 ? 'creditor' : b.balance < 0 ? 'debtor' : 'settled'
      })),
      settlements: settlements.map(s => ({
        from: s.from.name,
        to: s.to.name,
        amount: s.amount,
        status: s.status || 'pending'
      }))
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `settlement-${trip.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }
}