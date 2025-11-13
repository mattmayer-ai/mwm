import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

type TimeRange = '7d' | '30d' | '90d';

interface ChatMetrics {
  p50Latency: number;
  p95Latency: number;
  retrievalHitRate: number; // % of answers with ≥1 citation
  totalChats: number;
  avgCitations: number;
}

export function hasAlert(metrics: ChatMetrics | null): boolean {
  if (!metrics) return false;
  return metrics.p95Latency > 6000 || metrics.retrievalHitRate < 80;
}

export function MetricsDisplay() {
  const [metrics, setMetrics] = useState<ChatMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  useEffect(() => {
    loadMetrics();
  }, [timeRange]);

  const loadMetrics = async () => {
    try {
      // Calculate time range cutoff
      const now = Date.now();
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const cutoff = Timestamp.fromMillis(now - daysAgo * 24 * 60 * 60 * 1000);

      // Query recent chat events within time range
      const eventsRef = collection(db, 'analytics');
      const q = query(
        eventsRef,
        where('eventType', '==', 'chat_complete'),
        where('timestamp', '>=', cutoff),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );

      const snapshot = await getDocs(q);
      const latencies: number[] = [];
      let withCitations = 0;
      let totalCitations = 0;
      let total = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.latencyMs) {
          latencies.push(data.latencyMs);
          total++;
        }
        if (data.citationCount !== undefined) {
          if (data.citationCount > 0) {
            withCitations++;
          }
          totalCitations += data.citationCount || 0;
        }
      });

      // Calculate percentiles
      latencies.sort((a, b) => a - b);
      const p50: number = latencies.length > 0 
        ? latencies[Math.floor(latencies.length * 0.5)] ?? 0
        : 0;
      const p95: number = latencies.length > 0 
        ? latencies[Math.floor(latencies.length * 0.95)] ?? 0
        : 0;

      const hitRate = total > 0 ? (withCitations / total) * 100 : 0;
      const avgCitations = total > 0 ? totalCitations / total : 0;

      setMetrics({
        p50Latency: p50,
        p95Latency: p95,
        retrievalHitRate: hitRate,
        totalChats: total,
        avgCitations: avgCitations,
      });
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading metrics...</div>;
  }

  if (!metrics || metrics.totalChats === 0) {
    return (
      <div className="text-sm text-gray-500">
        No metrics available yet. Metrics will appear after chat usage.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Chat Metrics</h3>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-gray-500 dark:text-gray-400">p50 Latency</div>
          <div className={`text-lg font-semibold ${metrics.p50Latency > 3000 ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
            {metrics.p50Latency.toFixed(0)}ms
          </div>
        </div>
        <div>
          <div className="text-gray-500 dark:text-gray-400">p95 Latency</div>
          <div className={`text-lg font-semibold ${metrics.p95Latency > 6000 ? 'text-red-600 dark:text-red-400' : ''}`}>
            {metrics.p95Latency.toFixed(0)}ms
          </div>
        </div>
        <div>
          <div className="text-gray-500 dark:text-gray-400">Retrieval Hit Rate</div>
          <div className={`text-lg font-semibold ${metrics.retrievalHitRate < 80 ? 'text-red-600 dark:text-red-400' : ''}`}>
            {metrics.retrievalHitRate.toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-gray-500 dark:text-gray-400">Avg Citations</div>
          <div className="text-lg font-semibold">{metrics.avgCitations.toFixed(1)}</div>
        </div>
        <div className="col-span-2">
          <div className="text-gray-500 dark:text-gray-400">Total Chats</div>
          <div className="text-lg font-semibold">{metrics.totalChats}</div>
        </div>
      </div>
    </div>
  );
}

