import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

interface Miss {
  id: string;
  question: string;
  reason: string;
  tone?: string;
  latencyMs?: number;
  promptVersion?: string;
  timestamp: string;
}

export function TopMissesTable() {
  const [misses, setMisses] = useState<Miss[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMisses();
  }, []);

  const loadMisses = async () => {
    try {
      // Get negative feedback
      const feedbackRef = collection(db, 'feedback');
      const feedbackQuery = query(
        feedbackRef,
        where('verdict', '==', 'down'),
        orderBy('timestamp', 'desc'),
        limit(20)
      );

      const feedbackSnapshot = await getDocs(feedbackQuery);
      const feedbackMisses: Miss[] = [];

      feedbackSnapshot.forEach((doc) => {
        const data = doc.data();
        feedbackMisses.push({
          id: doc.id,
          question: data.question || 'Unknown',
          reason: data.note || 'No note provided',
          timestamp: data.timestamp || new Date().toISOString(),
        });
      });

      // Get chats with no citations (last 7 days)
      const sevenDaysAgo = Timestamp.fromMillis(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const analyticsRef = collection(db, 'analytics');
      const noCitationsQuery = query(
        analyticsRef,
        where('eventType', '==', 'chat_complete'),
        where('hasCitations', '==', false),
        where('timestamp', '>=', sevenDaysAgo),
        orderBy('timestamp', 'desc'),
        limit(20)
      );

      const analyticsSnapshot = await getDocs(noCitationsQuery);
      const noCitationMisses: Miss[] = [];

      analyticsSnapshot.forEach((doc) => {
        const data = doc.data();
        noCitationMisses.push({
          id: doc.id,
          question: 'No citation returned',
          reason: 'Retrieval failed or insufficient context',
          tone: data.tone,
          latencyMs: data.latencyMs,
          promptVersion: data.promptVersion || '1.0',
          timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
      });

      // Combine and sort by timestamp
      const allMisses = [...feedbackMisses, ...noCitationMisses]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20);

      setMisses(allMisses);
    } catch (error) {
      console.error('Failed to load misses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading misses...</div>;
  }

  if (misses.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No misses found. Great job! 🎉
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Top Misses (Last 7 Days)</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left p-2 text-gray-600 dark:text-gray-400">Question</th>
              <th className="text-left p-2 text-gray-600 dark:text-gray-400">Reason</th>
              <th className="text-left p-2 text-gray-600 dark:text-gray-400">Tone</th>
              <th className="text-left p-2 text-gray-600 dark:text-gray-400">Latency</th>
              <th className="text-left p-2 text-gray-600 dark:text-gray-400">Time</th>
            </tr>
          </thead>
          <tbody>
            {misses.map((miss) => (
              <tr key={miss.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="p-2 text-gray-700 dark:text-gray-300 max-w-xs truncate">
                  {miss.question}
                </td>
                <td className="p-2 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                  {miss.reason}
                </td>
                <td className="p-2 text-gray-600 dark:text-gray-400">
                  {miss.tone || '—'}
                </td>
                <td className="p-2 text-gray-600 dark:text-gray-400">
                  {miss.latencyMs ? `${miss.latencyMs}ms` : '—'}
                </td>
                <td className="p-2 text-gray-500 dark:text-gray-500">
                  {new Date(miss.timestamp).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

