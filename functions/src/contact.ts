import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { checkRateLimits } from './rateLimit';

// Admin is initialized in index.ts

interface ContactRequest {
  name: string;
  email: string;
  message: string;
  honeypot?: string; // Spam protection
}

/**
 * POST /api/contact
 * Contact form submission with rate limiting and spam protection
 */
export const contact = functions.https.onRequest(async (req, res) => {
  // CORS headers
  const allowedOrigins = [
    'https://askmwm.web.app',
    'https://askmwm.firebaseapp.com',
    'http://localhost:3000',
    'http://localhost:5173',
  ];
  
  const origin = req.headers.origin || '';
  if (allowedOrigins.includes(origin) || origin.includes('localhost')) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Rate limiting
    const rateLimit = await checkRateLimits(req);
    if (!rateLimit.allowed) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: rateLimit.reason || 'Too many requests',
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
      });
      return;
    }

    const body: ContactRequest = req.body;
    const { name, email, message, honeypot } = body;

    // Validation
    if (!name || !email || !message) {
      res.status(400).json({ error: 'Name, email, and message are required' });
      return;
    }

    // Spam protection: honeypot field should be empty
    if (honeypot && honeypot.trim() !== '') {
      // Silently reject (don't reveal it's a honeypot)
      res.status(200).json({ success: true });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email address' });
      return;
    }

    // Message length limit
    if (message.length > 5000) {
      res.status(400).json({ error: 'Message too long (max 5000 characters)' });
      return;
    }

    // Store in Firestore
    await admin.firestore().collection('leads').add({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    // TODO: Send email notification (via SendGrid, Mailgun, or Firebase Extensions)
    // For now, just log
    console.log(`New contact submission from ${email}`);

    res.json({ success: true, message: 'Message received' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      error: 'Failed to submit message',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

