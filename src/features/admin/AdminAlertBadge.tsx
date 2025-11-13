import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

/**
 * Badge that shows alert if metrics exceed thresholds
 */
export function AdminAlertBadge() {
  const [hasAlert, setHasAlert] = useState(false);

  useEffect(() => {
    checkAlerts();
    // Check every 5 minutes
    const interval = setInterval(checkAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkAlerts = async () => {
    try {
      // Get recent chat events (last 7 days)
      const sevenDaysAgo = Timestamp.fromMillis(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const eventsRef = collection(db, 'analytics');
      const q = query(
        eventsRef,
        where('eventType', '==', 'chat_complete'),
        where('timestamp', '>=', sevenDaysAgo),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const latencies: number[] = [];
      let withCitations = 0;
      let total = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.latencyMs) {
          latencies.push(data.latencyMs);
          total++;
        }
        if (data.hasCitations) {
          withCitations++;
        }
      });

      if (total === 0) {
        setHasAlert(false);
        return;
      }

      // Calculate metrics
      latencies.sort((a, b) => a - b);
      const p95: number = latencies.length > 0 
        ? (latencies[Math.floor(latencies.length * 0.95)] ?? 0)
        : 0;
      const hitRate = total > 0 ? (withCitations / total) * 100 : 0;

      // Alert if thresholds exceeded
      setHasAlert(p95 > 6000 || hitRate < 80);
    } catch (error) {
      console.error('Failed to check alerts:', error);
    }
  };

  if (!hasAlert) return null;

  return (
    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
      <AlertCircle className="w-3 h-3 text-white" />
    </span>
  );
}

