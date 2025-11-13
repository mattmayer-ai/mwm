interface ToneBadgeProps {
  tone: 'professional' | 'narrative' | 'personal';
}

export function ToneBadge({ tone }: ToneBadgeProps) {
  const labels = {
    professional: 'Professional',
    narrative: 'Narrative mode · concise',
    personal: 'Personal mode · content note',
  };

  const colors = {
    professional: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    narrative: 'bg-brand-blue/10 dark:bg-brand-blue-dark/20 text-brand-blue dark:text-brand-blue/80',
    personal: 'bg-brand-pink/10 dark:bg-brand-pink-dark/20 text-brand-pink dark:text-brand-pink',
  };

  if (tone === 'professional') {
    return null; // Don't show badge for default tone
  }

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${colors[tone]}`}>
      {labels[tone]}
    </div>
  );
}

