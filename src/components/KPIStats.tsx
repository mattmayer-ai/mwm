interface KPIStatsProps {
  outcomes: Array<{
    metric: string;
    baseline?: string;
    result?: string;
    delta?: string;
  }>;
}

export function KPIStats({ outcomes }: KPIStatsProps) {
  if (outcomes.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 mb-8">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Key Outcomes</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {outcomes.slice(0, 3).map((outcome, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{outcome.metric}</div>
            {outcome.delta && (
              <div className="text-2xl font-bold text-brand-blue dark:text-brand-blue/80">{outcome.delta}</div>
            )}
            {outcome.baseline && outcome.result && (
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {outcome.baseline} → {outcome.result}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

