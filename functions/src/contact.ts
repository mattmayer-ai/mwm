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
    const { name = '', email = '', message = '', hp = '' } = body;

    // Honeypot check
    if (hp) {
      res.status(200).json({ ok: true }); // honeypot
      return;
    }

    // Validate payload and log failures
    if (!name.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(email) || message.trim().length < 10) {
      console.log('CONTACT invalid', {
        nameLen: name.length,
        email,
        msgLen: message.length,
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
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to submit message',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

