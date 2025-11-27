import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { checkRateLimits } from './rateLimit';

// Admin is initialized in index.ts

/**
 * POST /api/contact
 * Contact form submission with rate limiting and spam protection
 */
export const contact = functions.https.onRequest(async (req, res) => {
  // CORS
  const allowed = [
    'https://askmwm.web.app',
    'https://askmwm.firebaseapp.com',
    'http://localhost:5173',
  ];
  const origin = req.headers.origin || '';
  if (allowed.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  try {
    // Rate limiting (with error handling - don't block if rate limit check fails)
    let rateLimit;
    try {
      rateLimit = await checkRateLimits(req);
      if (!rateLimit.allowed) {
        res.status(429).json({
          error: 'RATE_LIMIT',
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
        });
        return;
      }
    } catch (rateLimitError) {
      // Log but don't block - rate limiting is best-effort
      console.warn('Rate limit check failed, allowing request:', rateLimitError);
      // Continue with the request
    }

    const body = req.body || {};
    // Ensure all values are strings, handling null/undefined
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const message = String(body.message || '').trim();
    const hp = String(body.hp || '').trim();

    // Honeypot check
    if (hp) {
      res.status(200).json({ ok: true }); // honeypot
      return;
    }

    // Validate payload and log failures
    if (!name || !/^[^@]+@[^@]+\.[^@]+$/.test(email) || message.length < 10) {
      console.log('CONTACT invalid', {
        name: name || '(empty)',
        nameLen: name.length,
        email: email || '(empty)',
        msgLen: message.length,
        bodyKeys: Object.keys(body),
      });
      res.status(400).json({ error: 'INVALID_INPUT' });
      return;
    }

    // Message length limit
    if (message.length > 5000) {
      res.status(400).json({ error: 'Message too long (max 5000 characters)' });
      return;
    }

    // Store in Firestore
    await admin.firestore().collection('leads').add({
      name,
      email: email.toLowerCase(),
      message,
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
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to submit message',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

