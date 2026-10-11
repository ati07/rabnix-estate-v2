// Utility for formatting Indian Currency (Crore, Lakh, Thousands)
export function formatIndianCurrency(amount: number): string {
  if (!amount || isNaN(amount)) return '₹0';
  
  if (amount >= 10000000) {
    const cr = (amount / 10000000).toFixed(2).replace(/\.00$/, '');
    return `₹${cr} Cr`;
  }
  if (amount >= 100000) {
    const lac = (amount / 100000).toFixed(2).replace(/\.00$/, '');
    return `₹${lac} Lac`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatIndianNumber(num: number): string {
  if (!num || isNaN(num)) return '0';
  return num.toLocaleString('en-IN');
}
