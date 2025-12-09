export function formatTimeRemaining(closedAt: string): string {
  const now = new Date();
  const end = new Date(closedAt);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Closed';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${days}d ${hours}h ${minutes}m`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getDrawStatus(state: string, closedAt: string): 'open' | 'soldOut' | 'closed' | 'canceled' | 'entered' {
  if (state === 'canceled') return 'canceled';
  if (state === 'soldOut') return 'soldOut';
  if (state === 'closed' || new Date(closedAt) < new Date()) return 'closed';
  return 'open';
}

