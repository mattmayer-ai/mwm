import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Anthropic from '@anthropic-ai/sdk';

// Admin is initialized in index.ts
import { retrieveCandidates, rerankCandidates } from './retrieval';
import { buildSystemPrompt, buildUserPrompt, extractCitations, type TonePreset } from './prompts';
import { pickTone } from './tone';
import { checkRateLimits } from './rateLimit';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  scope?: string; // Optional docId to scope retrieval
}

/**
 * POST /api/chat
 * RAG-powered chat endpoint with citations
 */
export const chat = functions.https.onRequest(async (req, res) => {
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

  const startTime = Date.now();

  try {
    // Log request for debugging
    console.log('Chat request received:', {
      method: req.method,
      headers: {
        'content-type': req.headers['content-type'],
        origin: req.headers.origin,
      },
      bodyType: typeof req.body,
      bodyKeys: req.body ? Object.keys(req.body) : null,
    });

    // Rate limiting (with error handling - don't block if rate limit check fails)
    let rateLimit;
    try {
      rateLimit = await checkRateLimits(req);
      if (!rateLimit.allowed) {
        res.status(429).json({
          error: 'Rate limit exceeded',
          message: rateLimit.reason || 'Too many requests',
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
        });
        return;
      }
    } catch (rateLimitError) {
      // Log but don't block - rate limiting is best-effort
      console.warn('Rate limit check failed, allowing request:', rateLimitError);
      // Continue with the request
    }

    // Parse and validate request body
    let body: ChatRequest;
    try {
      body = req.body;
      if (!body || typeof body !== 'object') {
        console.error('Invalid request body:', { body, type: typeof body });
        res.status(400).json({ error: 'Invalid request body', details: 'Body must be a JSON object' });
        return;
      }
    } catch (err) {
      console.error('Failed to parse request body:', err);
      res.status(400).json({ error: 'Failed to parse request body', details: err instanceof Error ? err.message : 'Unknown error' });
      return;
    }

    const { messages, scope } = body;

    // Enhanced validation logging
    console.log('Validating messages:', {
      messagesType: typeof messages,
      isArray: Array.isArray(messages),
      length: messages?.length,
      messages: messages?.map((m: any) => ({ role: m?.role, hasContent: !!m?.content, contentLength: m?.content?.length })),
    });

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('Validation failed: Messages array check', { messages, type: typeof messages, isArray: Array.isArray(messages) });
      res.status(400).json({ error: 'Messages array is required and must not be empty' });
      return;
    }

    // Get the last user message
    const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
    console.log('Last user message:', {
      found: !!lastUserMessage,
      hasContent: !!lastUserMessage?.content,
      contentType: typeof lastUserMessage?.content,
      content: lastUserMessage?.content?.substring(0, 50),
    });
    
    if (!lastUserMessage || !lastUserMessage.content || typeof lastUserMessage.content !== 'string') {
      console.error('Validation failed: Last user message check', {
        lastUserMessage,
        hasContent: !!lastUserMessage?.content,
        contentType: typeof lastUserMessage?.content,
      });
      res.status(400).json({ error: 'At least one user message with content is required' });
      return;
    }

    const question = lastUserMessage.content;

    // Check settings for personal mode (read from Firestore meta/settings)
    let allowPersonal = false;
    try {
      const settingsDoc = await admin.firestore().collection('meta').doc('settings').get();
      if (settingsDoc.exists) {
        const data = settingsDoc.data();
        allowPersonal = data?.allowPersonal === true;
      }
    } catch (err) {
      // Fallback to env var if Firestore read fails
      allowPersonal = process.env.ALLOW_PERSONAL === 'true';
    }

    // Retrieve relevant chunks (get top 12, re-rank to 3-5)
    const candidates = await retrieveCandidates(question, 12, scope);
    const reranked = rerankCandidates(candidates, 4); // Return top 3-4 for tighter context

    // Build context for prompt
    const context = reranked.map((c) => ({
      text: c.text,
      title: c.title,
      sourceUrl: c.sourceUrl,
    }));

    // Build conversation history (last 2 turns)
    const history: ChatMessage[] = messages.slice(-4); // Last 2 turns (user + assistant)

    // Determine tone based on question and scope
    const tone = pickTone(question, scope, allowPersonal);
    
    // If tone = 'personal' but flag is off, downgrade to professional
    const effectiveTone: TonePreset = tone === 'personal' && !allowPersonal ? 'professional' : tone;
    const systemPrompt = buildSystemPrompt(effectiveTone);
    
    // If personal was requested but disabled, add note
    const finalSystemPrompt = tone === 'personal' && !allowPersonal
      ? systemPrompt + '\n\nNote: Personal/vulnerable mode is disabled; respond professionally.'
      : systemPrompt;

    // Build prompt
    const userPrompt = buildUserPrompt(question, context, history);

    // Call Claude
    const stream = anthropic.messages.stream({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: effectiveTone === 'personal' ? 180 : 1024,
      system: finalSystemPrompt,
      messages: [
        ...history.map((msg) => ({
          role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: msg.content,
        })),
        {
          role: 'user' as const,
          content: userPrompt,
        },
      ],
    });

    // Stream response
    let answer = '';
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const chunk = event.delta.text;
        answer += chunk;
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      }
    }

    // Extract citations
    const citations = extractCitations(answer, context);

    // Calculate token estimates (rough: ~4 chars per token)
    const tokenIn = Math.ceil((userPrompt.length + finalSystemPrompt.length) / 4);
    const tokenOut = Math.ceil(answer.length / 4);

    // Send final message with citations and tone (always include tone)
    res.write(`data: ${JSON.stringify({ type: 'done', citations, tone: effectiveTone })}\n\n`);
    res.end();

    // Log metrics with observability
    const latency = Date.now() - startTime;
    const correlationId = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    console.log(JSON.stringify({
      correlationId,
      tone: effectiveTone,
      promptVersion: '1.0',
      topK: 12,
      finalK: reranked.length,
      latencyMs: latency,
      tokenIn,
      tokenOut,
      citationCount: citations.length,
      hasCitations: citations.length > 0,
    }));

    // Log to Firestore analytics for metrics dashboard
    try {
      await admin.firestore().collection('analytics').add({
        eventType: 'chat_complete',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        tone: effectiveTone,
        latencyMs: latency,
        citationCount: citations.length,
        hasCitations: citations.length > 0,
        tokenIn,
        tokenOut,
        correlationId,
      });
    } catch (err) {
      // Non-blocking: log error but don't fail the request
      console.error('Failed to log analytics:', err);
    }
  } catch (error) {
    const correlationId = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error(JSON.stringify({
      correlationId,
      error: 'Chat request failed',
      message: errorMessage,
      stack: errorStack,
    }));
    
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Chat request failed',
        message: 'Something went wrong. Please try again.',
        correlationId, // Include for support
      });
    } else {
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: 'Something went wrong. Please try again.',
        correlationId,
      })}\n\n`);
      res.end();
    }
  }
});

