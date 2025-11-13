import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Generate or retrieve session ID
 */
function getSessionId(): string {
  const key = 'mwm_session_id';
  let sessionId = localStorage.getItem(key);
  
  if (!sessionId) {
    // Generate a short hash-like ID
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, sessionId);
  }
  
  return sessionId;
}

interface AnalyticsEvent {
  type: 'page_view' | 'chat_start' | 'chat_message' | 'citation_click' | 'contact_submit' | 'resume_download';
  sessionId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log analytics event to Firestore
 */
export async function logEvent(
  type: AnalyticsEvent['type'],
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const event: AnalyticsEvent = {
      type,
      sessionId: getSessionId(),
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
    };

    await addDoc(collection(db, 'analytics'), event);
  } catch (error) {
    // Fail silently in production, but log in dev
    if (import.meta.env.DEV) {
      console.error('Analytics error:', error);
    }
  }
}

/**
 * Track page view
 */
export function trackPageView(path: string): void {
  logEvent('page_view', { path });
}

/**
 * Track chat start (first message in session)
 */
export function trackChatStart(): void {
  logEvent('chat_start');
}

/**
 * Track chat message
 */
export function trackChatMessage(): void {
  logEvent('chat_message');
}

/**
 * Track citation click
 */
export function trackCitationClick(slug: string, sectionId: string): void {
  logEvent('citation_click', { slug, sectionId });
}

/**
 * Track contact form submission
 */
export function trackContactSubmit(): void {
  logEvent('contact_submit');
}

/**
 * Track resume download
 */
export function trackResumeDownload(): void {
  logEvent('resume_download');
}

