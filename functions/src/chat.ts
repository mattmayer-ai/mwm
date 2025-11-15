import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

// Admin is initialized in index.ts
import { retrieveCandidates, rerankCandidates, type ChunkCandidate } from './retrieval';
import {
  buildSystemPrompt,
  buildUserPrompt,
  extractCitations,
  type TonePreset,
  type PromptContextEntry,
} from './prompts';
import { pickTone } from './tone';
import { checkRateLimits } from './rateLimit';
import { getBedrockClient } from './bedrock';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ChatRequest interface removed - using inline type in handler

/**
 * POST /api/chat
 * RAG-powered chat endpoint with citations
 */
export const chat = functions.https.onRequest(async (req, res) => {
  // CORS
  const allowedOrigins = [
    'https://askmwm.web.app',
    'https://askmwm.firebaseapp.com',
    'http://localhost:5173',
  ];
  const origin = req.headers.origin || '';
  if (allowedOrigins.includes(origin)) {
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

  // Debug: prove what reached the function
  const ct = req.get('content-type') || '';
  console.log('CHAT IN:', {
    method: req.method,
    contentType: ct,
    rawLen: (req as any).rawBody?.length || 0,
    hasBody: !!req.body,
  });

  const correlationId = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  console.log('CHAT start', { correlationId });

  try {
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
    const body = req.body || {};
    let { messages, scope, question: questionFallback } = body as {
      messages?: Array<{ role: string; content: string }>;
      scope?: string;
      question?: string;
    };

    // Normalize & sanitize
    const safeMsgs: ChatMessage[] = Array.isArray(messages)
      ? messages
          .filter((m) => m && typeof m.content === 'string')
          .map((m) => ({
            role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
            content: m.content.trim(),
          }))
          .filter((m) => m.content.length > 0)
      : [];

    // Fallback: accept a single `question` string
    if (safeMsgs.length === 0 && typeof questionFallback === 'string' && questionFallback.trim()) {
      safeMsgs.push({ role: 'user', content: questionFallback.trim() });
      console.log('Fallback synthesized from `question`');
    }

    console.log('Validated messages:', { length: safeMsgs.length, first: safeMsgs[0] });
    console.log('CHAT IN', {
      correlationId,
      firstMsg: safeMsgs[0]?.content?.slice(0, 120) || '',
    });
    
    if (safeMsgs.length === 0) {
      res.status(400).json({ error: 'EMPTY_MESSAGES_AFTER_FILTER' });
      return;
    }

    // Get the last user message from safeMsgs
    const lastUserMessage = safeMsgs.filter((m) => m.role === 'user').pop();
    if (!lastUserMessage) {
      console.error('Validation failed: No user message found in safeMsgs');
      res.status(400).json({ error: 'At least one user message with content is required' });
      return;
    }

    const question = lastUserMessage.content;

    // --- QUICK PING BYPASS (keeps SSE shape) ---
    // Only respond to exact "ping" for testing, not "hi" or other messages
    const first = (safeMsgs[0]?.content || '').toLowerCase().trim();
    if (first === 'ping') {
      res.set('Content-Type', 'text/event-stream');
      res.set('Cache-Control', 'no-cache');
      res.set('Connection', 'keep-alive');
      res.flushHeaders?.();
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: 'pong' })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'done', citations: [], tone: 'professional' })}\n\n`);
      res.end();
      return;
    }

    // --- SMALL TALK HANDLER ---
    const smallTalkPattern =
      /^(hi|hello|hey|heya|hiya|howdy|good (morning|afternoon|evening)|what's up|sup|how are you|thanks|thank you|yo)\b/i;
    if (smallTalkPattern.test(question) && question.length <= 60) {
      res.set('Content-Type', 'text/event-stream');
      res.set('Cache-Control', 'no-cache');
      res.set('Connection', 'keep-alive');
      res.flushHeaders?.();
      const friendly =
        "Hey! Thanks for checking in. Whenever you're ready, just ask about a project, role, or result and I'll jump straight into the details.";
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: friendly })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'done', citations: [], tone: 'professional' })}\n\n`);
      res.end();
      return;
    }

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

    // ---- RAG (retrieval) ----
    const norag = req.query.norag === '1';
    console.log('RAG start', { correlationId, norag });

    let candidates: ChunkCandidate[] = [];
    let reranked: ChunkCandidate[] = [];
    let context: PromptContextEntry[] = [];

    if (!norag) {
      try {
        candidates = await retrieveCandidates(question);
        console.log('RAG done', { correlationId, candidateCount: candidates?.length || 0 });
        reranked = await rerankCandidates(candidates); // placeholder reranker keeps order

        // Build context for prompt
        const isWhoAboutMatt = /\b(who is|who's|about|bio|background)\b/i.test(question);
        const priorityIds = ['resume', 'resume-pdf', 'content_resume_resume', 'timeline', 'teaching'];
        const sortedReranked = isWhoAboutMatt
          ? [...reranked].sort((a, b) => {
              const aBoost = priorityIds.some((id) => a.docId?.toLowerCase().includes(id)) ? 1 : 0;
              const bBoost = priorityIds.some((id) => b.docId?.toLowerCase().includes(id)) ? 1 : 0;
              if (aBoost === bBoost) return 0;
              return bBoost - aBoost;
            })
          : reranked;
        context = sortedReranked.slice(0, 6).map((c) => ({
          title: c.sourceTitle,
          sourceUrl: c.url || '/',
          snippet: c.snippet.slice(0, 400),
        }));
      } catch (ragError) {
        console.warn('RAG retrieval failed, continuing without context:', ragError);
        // Continue without RAG context
      }
    }

    // Build conversation history (last 2 turns)
    const history: ChatMessage[] = safeMsgs.slice(-4); // Last 2 turns (user + assistant)

    // Determine tone based on question and scope
    const tone = pickTone(question, scope, allowPersonal);
    
    // If tone = 'personal' but flag is off, downgrade to professional
    const effectiveTone: TonePreset = tone === 'personal' && !allowPersonal ? 'professional' : tone;
    const systemPrompt = buildSystemPrompt(effectiveTone);
    
    // If personal was requested but disabled, add note
    const finalSystemPrompt = tone === 'personal' && !allowPersonal
      ? systemPrompt + '\n\nNote: Personal/vulnerable mode is disabled; respond professionally.'
      : systemPrompt;

    if (!norag && context.length === 0) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();
      const msg =
        'I don’t have a sourced answer yet. Ask about projects, case studies, or experience listed on this site, or try rephrasing.';
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: msg })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'done', citations: [], tone: 'professional' })}\n\n`);
      res.end();
      return;
    }

    // Build prompt
    const userPrompt = buildUserPrompt(question, context, history);

    // ---- Bedrock call ----
    const modelId = 'anthropic.claude-3-5-sonnet-20240620-v1:0';
    console.log('BEDROCK start', { correlationId, model: modelId });

    // Set SSE headers before Bedrock call
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const historicalMessages = safeMsgs
      .slice(0, Math.max(0, safeMsgs.length - 1))
      .map((m) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: [{ text: m.content }],
      }));

    const brMessages =
      safeMsgs.length === 0
        ? [
            {
              role: 'user' as const,
              content: [{ text: userPrompt }],
            },
          ]
        : [
            ...historicalMessages,
            {
              role: 'user' as const,
              content: [{ text: userPrompt }],
            },
          ];

    const client = getBedrockClient();

    const cmd = new ConverseCommand({
      modelId,
      system: [{ text: finalSystemPrompt }],
      messages: brMessages,
      inferenceConfig: {
        maxTokens: effectiveTone === 'personal' ? 180 : 600,
        temperature: 0.1,
        topP: 0.9,
      },
    });

    const t0 = Date.now();
    const resp = await client.send(cmd);
    console.log('BEDROCK done', { correlationId });

    const parts = resp.output?.message?.content ?? [];
    const answer = parts.map((p) => p?.text).filter(Boolean).join('') || '';

    // Extract citations
    const citations = extractCitations(answer, context);

    // Emit one chunk + done (UI already understands this)
    res.write(`data: ${JSON.stringify({ type: 'chunk', content: answer })}\n\n`);

    // Calculate token estimates (rough: ~4 chars per token)
    const tokenIn = Math.ceil((userPrompt.length + finalSystemPrompt.length) / 4);
    const tokenOut = Math.ceil(answer.length / 4);

    // Send final message with citations and tone (always include tone)
    res.write(`data: ${JSON.stringify({ type: 'done', citations, tone: effectiveTone })}\n\n`);
    res.end();

    // Log metrics with observability
    const latency = Date.now() - t0;
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
    const e = error as any;
    const awsMeta = e?.$metadata || {};
    const code = e?.name || e?.code || 'UnknownError';
    const msg = e?.message || String(error);
    
    console.error('CHAT error', {
      correlationId,
      code,
      msg,
      awsMeta,
      stack: e?.stack,
    });
    
    // Emit a graceful SSE error so the client can show a friendly message
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();
    }
    
    res.write(`data: ${JSON.stringify({
      type: 'error',
      code,
      message: 'Sorry — something broke while generating a reply. Try again.',
    })}\n\n`);
    res.write(`data: ${JSON.stringify({
      type: 'done',
      citations: [],
      tone: 'professional',
    })}\n\n`);
    res.end();
  }
});

