import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

// Admin is initialized in index.ts
import { retrieveCandidates, rerankCandidates, getFullDocument, type ChunkCandidate } from './retrieval';
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
import { isFrameworkQuestion, getRelevantPersonaKnowledge } from './persona';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type Intent = 'SmallTalk' | 'Contact' | null; // null means proceed to RAG

const smallTalkRegex =
  /^(hi|hello|hey|heya|hiya|howdy|good (morning|afternoon|evening)|what's up|sup|how are you|thanks|thank you|yo)\b/i;
const contactRegex = /(hire|availability|book|rates?|contact|email|linked ?in|cal\.?com|schedule)/i;

const SMALL_TALK_RESPONSES: string[] = [
  "Hey! I'm glad you're here. Want a quick tour of my highlights, projects, or leadership style?",
  "Hi there—I'm Matt. Ask me anything about my roles, AI platforms, or the teams I've built.",
  "Good to see you. I can dig into projects, strategy, or how I lead—where should we start?",
  "Hey! Thanks for dropping in. Curious about CNS, AutoTake, or my leadership playbook?",
  "Hi! I'm doing great and always up for talking shop—projects, roles, outcomes, you name it.",
  "Hello! If you're scouting, I can share my biggest wins, pivots, or how I keep teams moving.",
  "Hey! Ready when you are—ask about AI agents, defense simulators, or teaching at Schulich.",
  "Hi! Want the 90-second story, a project deep dive, or how I coach PMs?",
  "Hey there. I'm happy to unpack my career highlights or the toughest pivots I've led.",
  "Hi! Great to meet you. Curious about my current bets or how I think about strategy?",
  "Hey! I'm here whenever you want to dive into outcomes, leadership, or process.",
  "Hi! Want a brag reel, leadership philosophy, or my first 90-day plan?",
  "Hello! Ask me about CNS, RAS, AutoTake, or how I shrink time-to-insight.",
  "Hey! I'm Matt—fire away with questions about AI roadmaps, defense training, or teaching.",
  "Hi there! Looking for metrics, case studies, or how I run discovery?",
  "Hey! I can talk about my north-star metrics, experimentation, or team rituals.",
  "Hi! Wondering how I balance speed and quality or how I align execs? Ask away.",
  "Hello! Want to know how I decide what not to build or how I price outcomes?",
  "Hey there! I can walk through my GTM playbooks or my favorite coaching moments.",
  "Hi! Curious about how I use data without getting dogmatic? Happy to share.",
  "Hey! Need my leadership style in one line or examples of empowering teams?",
  "Hi! Ask me about a tough pivot, a rescue story, or how I keep momentum.",
  "Hey! Want to hear how I make multi-agent systems behave? I've got stories.",
  "Hello! I can cover security, privacy, and governance for AI if that's on your mind.",
  "Hi there! Need a primer on how I run product reviews or post-mortems?",
  "Hey! Ask me about my teaching at Schulich or how I mentor PMs.",
  "Hi! Curious about hiring bar, onboarding seniors, or aligning design and eng?",
  "Hey! Want to discuss my view on vision, dependencies, or roadmap uncertainty?",
  "Hello! I can explain how I avoid pilot purgatory or partner with Sales.",
  "Hi! If you need contact info or next steps, just say the word."
];

const CONTACT_RESPONSE =
  "Happy to connect. You can email me at mattmayer@hotmail.com, find me on LinkedIn, or grab time via my calendar—whatever's easiest.";

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

    // Detect if user is accepting a prompt from previous assistant message
    const lastAssistant = safeMsgs.filter((m) => m.role === 'assistant').pop();
    const normalizedQuestion = question.toLowerCase().trim();

    // Check for brag reel acceptance
    const wantsBragReel = lastAssistant && 
      /brag reel/i.test(lastAssistant.content) &&
      /^(yes|yeah|yep|sure|ok|okay|please|that sounds good|absolutely)/i.test(normalizedQuestion);

    // Check for leadership philosophy acceptance
    const wantsLeadership = lastAssistant &&
      /leadership philosophy/i.test(lastAssistant.content) &&
      /^(yes|yeah|yep|sure|ok|okay|please|that sounds good|absolutely)/i.test(normalizedQuestion);

    // Check for 90-day plan acceptance
    const wants90DayPlan = lastAssistant &&
      /90.?day/i.test(lastAssistant.content) &&
      /^(yes|yeah|yep|sure|ok|okay|please|that sounds good|absolutely)/i.test(normalizedQuestion);

    // Handle deterministic responses (bypass LLM)
    if (wantsBragReel || wantsLeadership || wants90DayPlan) {
      let docId: string;
      if (wantsBragReel) {
        docId = 'brag-reel';
      } else if (wantsLeadership) {
        docId = 'leadership-philosophy';
      } else {
        docId = 'first-90-day-plan';
      }

      try {
        const fullDocument = await getFullDocument(docId);
        if (fullDocument) {
          // Set SSE headers
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.flushHeaders?.();

          // Send the full document text as response
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: fullDocument })}\n\n`);
          res.write(`data: ${JSON.stringify({ type: 'done', citations: [], tone: 'professional' })}\n\n`);
          res.end();

          console.log('Deterministic response sent', { correlationId, docId });
          return;
        } else {
          console.warn('Deterministic response document not found', { correlationId, docId });
          // Fall through to normal RAG flow if document not found
        }
      } catch (error) {
        console.error('Error retrieving deterministic response', { correlationId, docId, error });
        // Fall through to normal RAG flow on error
      }
    }

    const sendSSE = (payload: { content: string; tone?: TonePreset }) => {
      res.set('Content-Type', 'text/event-stream');
      res.set('Cache-Control', 'no-cache');
      res.set('Connection', 'keep-alive');
      res.flushHeaders?.();
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: payload.content })}\n\n`);
      res.write(
        `data: ${JSON.stringify({
          type: 'done',
          citations: [],
          tone: payload.tone || 'professional',
        })}\n\n`,
      );
      res.end();
    };

    const routeIntent = (text: string): Intent | null => {
      const trimmed = text.trim();
      
      // Only route to SmallTalk for very short greetings (≤20 chars) - let longer questions go to RAG
      if (trimmed.length <= 20 && smallTalkRegex.test(trimmed)) {
        return 'SmallTalk';
      }
      
      // Only route to Contact for explicit hiring/contact requests
      if (contactRegex.test(trimmed)) {
        return 'Contact';
      }
      
      // Everything else goes to RAG (return null to proceed with RAG)
      return null;
    };

    const intent = routeIntent(question);
    console.log('Intent routed', { intent, questionSnippet: question.slice(0, 80) });

    // --- QUICK PING BYPASS (keeps SSE shape) ---
    // Only respond to exact "ping" for testing, not "hi" or other messages
    const first = (safeMsgs[0]?.content || '').toLowerCase().trim();
    if (first === 'ping') {
      sendSSE({ content: 'pong' });
      return;
    }

    if (intent === 'SmallTalk') {
      const friendly = SMALL_TALK_RESPONSES[Math.floor(Math.random() * SMALL_TALK_RESPONSES.length)];
      sendSSE({ content: friendly });
      return;
    }

    if (intent === 'Contact') {
      sendSSE({
        content: `${CONTACT_RESPONSE} Want me to highlight recent wins before we talk specifics?`,
      });
      return;
    }

    // If intent is null, proceed to RAG (removed OutOfScope early return)

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

        // Build context for prompt with priority boosting
        const isWhoAboutMatt = /\b(who is|who's|about|bio|background)\b/i.test(question);
        const isPhilosophyQuestion = /\b(philosophy|philosophies|approach|style|how do you think|what's your view)\b/i.test(question);
        const isAchievementQuestion = /\b(achievement|best|biggest|greatest|win|accomplishment|proud|success)\b/i.test(question);
        
        // Detect project-specific questions
        const isCNSQuestion = /\bcns\b/i.test(question);
        const isAthleteAtlasQuestion = /\bathleteatlas\b/i.test(question) || /\bathlete atlas\b/i.test(question);
        const isPaySightQuestion = /\bpaysight\b/i.test(question) || /\bpay sight\b/i.test(question);
        const isEdPalQuestion = /\bedpal\b/i.test(question) || /\bed pal\b/i.test(question);
        const isTakeCostQuestion = /\btakecost\b/i.test(question) || /\btake cost\b/i.test(question);
        const isSchulichQuestion = /\bschulich\b/i.test(question) || /\bteaching\b/i.test(question) || /\bcourse\b/i.test(question);
        const isAWSQuestion = /\baws\b/i.test(question) || /\bbedrock\b/i.test(question);
        
        let priorityIds: string[] = [];
        if (isWhoAboutMatt) {
          priorityIds = ['resume', 'resume-pdf', 'content_resume_resume', 'timeline', 'teaching'];
        } else if (isPhilosophyQuestion || isAchievementQuestion) {
          // Boost interview Q&A content for philosophy and achievement questions
          priorityIds = ['matt_interview_qna', 'interview', 'qa', 'resume', 'content_resume_resume'];
        } else if (isCNSQuestion) {
          priorityIds = ['cns', 'cns-ai-powered-innovation-platform', 'swift-racks-cns'];
        } else if (isAthleteAtlasQuestion) {
          priorityIds = ['athleteatlas', 'athleteatlas-youth-hockey-platform'];
        } else if (isPaySightQuestion) {
          priorityIds = ['paysight', 'paysight-ai-powered-ecommerce-analytics'];
        } else if (isEdPalQuestion) {
          priorityIds = ['edpal', 'lesson-planning'];
        } else if (isTakeCostQuestion) {
          priorityIds = ['takecost', 'autotake'];
        } else if (isSchulichQuestion) {
          priorityIds = ['schulich', 'teaching', 'instructor', 'content_resume_resume'];
        } else if (isAWSQuestion) {
          priorityIds = ['cns', 'aws', 'bedrock', 'content_resume_resume'];
        }
        
        const sortedReranked = priorityIds.length > 0
          ? [...reranked].sort((a, b) => {
              const aBoost = priorityIds.some((id) => a.docId?.toLowerCase().includes(id) || a.sourceTitle?.toLowerCase().includes(id)) ? 1 : 0;
              const bBoost = priorityIds.some((id) => b.docId?.toLowerCase().includes(id) || b.sourceTitle?.toLowerCase().includes(id)) ? 1 : 0;
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
    
    // Check if we should use persona fallback reasoning
    // If we have retrieval context, don't use persona fallback
    const shouldUsePersonaFallback = context.length === 0 && (
      isFrameworkQuestion(question) ||
      // Check if bot suggested this topic in small talk responses
      [
        'north-star metrics', 'northstar metrics', 'north star metrics',
        'experimentation', 'team rituals', 'team operating',
        'leadership', 'leadership style', 'leadership approach',
      ].some(topic => question.toLowerCase().includes(topic)) ||
      // Check conversation history for suggested topics
      safeMsgs.slice(-4).some(m => 
        ['north-star metrics', 'experimentation', 'team rituals', 'leadership'].some(topic => 
          m.content.toLowerCase().includes(topic)
        )
      )
    );
    
    const personaKnowledge = shouldUsePersonaFallback ? getRelevantPersonaKnowledge(question) : '';
    
    const systemPrompt = buildSystemPrompt(effectiveTone, personaKnowledge);
    
    // If personal was requested but disabled, add note
    const finalSystemPrompt = tone === 'personal' && !allowPersonal
      ? systemPrompt + '\n\nNote: Personal/vulnerable mode is disabled; respond professionally.'
      : systemPrompt;

    // Build prompt (personaKnowledge is already in system prompt)
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
    let answer = parts.map((p) => p?.text).filter(Boolean).join('') || '';

    // Post-process: Remove blank lines between bullet points to keep them tight
    // Replace double newlines between bullets with single newline
    answer = answer.replace(/(•[^\n]+)\n\n+(•)/g, '$1\n$2');
    // Also handle cases where there might be spaces before the bullet
    answer = answer.replace(/\n\s*\n\s*(•)/g, '\n$1');

    // Hallucination detection: Check for fake companies and known fake brag patterns
    const fakeCompanies = ['quora', 'course hero', 'airbnb', 'reddit', 'google', 'meta', 'facebook', 'amazon', 'microsoft', 'apple', 'netflix', 'uber', 'lyft', 'twitter', 'x.com', 'linkedin', 'salesforce', 'oracle', 'adobe', 'spotify', 'snapchat', 'tiktok', 'pinterest', 'stripe', 'square', 'shopify', 'atlassian', 'slack', 'zoom', 'dropbox', 'palantir', 'tesla', 'spacex'];
    const answerLower = answer.toLowerCase();
    const hasFakeCompany = fakeCompanies.some(company => answerLower.includes(company));

    // Known fake brag patterns (from actual hallucination incidents)
    const knownFakeBragPatterns = [
      'led product at quora',
      'drove 300% revenue growth at course hero',
      'launched airbnb\'s first machine learning-powered search ranking',
      'pioneered reddit\'s mobile strategy',
      'scaling from 300m to 2b monthly unique visitors',
      'growing mobile dau from',
      '100m+ registered users',
      '2b monthly unique visitors',
    ];

    const isKnownFakeBrag = knownFakeBragPatterns.some((p) => answerLower.includes(p));
    
    if (hasFakeCompany || isKnownFakeBrag) {
      console.error('HALLUCINATION DETECTED: Fake company or brag pattern mentioned in answer', { 
        correlationId, 
        answer: answer.substring(0, 200),
        hasFakeCompany,
        isKnownFakeBrag,
      });
      // Replace the answer with a corrected version that redirects to actual companies
      answer = "I haven't worked at those companies. Let me share my actual experience:\n\n" +
        "• Head of Product at Swift Racks (2024-Present): Leading CNS innovation platform, TakeCost AI estimation, and EdPal lesson planning\n" +
        "• Senior Product Manager at RaceRocks 3D (2021-2024): Built world's first RAS simulator, $20M+ annual savings\n" +
        "• Product Manager at RaceRocks 3D (2018-2021): Developed VR/AR training systems for defense clients\n" +
        "• eLearning Manager at Air Canada (2010-2018): Launched first offline iPad training platform, $1.5M annual savings\n" +
        "• Head of Design at Pixilink (2009-2010)\n" +
        "• Head of Design & Development at Altima Ltd. (2008)\n" +
        "• Product Management Instructor at Schulich School of Business (2024-Present)\n\n" +
        "I can dive deeper into any of these roles or projects. What would you like to know?";
    }

    // Debug log before final output to verify detection is running
    console.log('FINAL ANSWER (post-hallucination-check)', {
      correlationId,
      snippet: answer.substring(0, 200),
      hasFakeCompany,
      isKnownFakeBrag,
    });

    // Self-consistency validation: Check if bot suggested this topic but is now refusing
    const normalizedAnswer = answer.toLowerCase();
    const refusalPattern = /don't have|don't know|not in my sources|can't answer/i;
    const isRefusing = refusalPattern.test(normalizedAnswer);
    
    if (isRefusing) {
      // Check if we suggested this topic in small talk
      const normalizedQuestion = question.toLowerCase();
      const suggestedTopics = [
        'north-star metrics', 'northstar metrics', 'north star metrics',
        'experimentation', 'team rituals', 'team operating',
        'leadership', 'leadership style', 'leadership approach',
      ];
      
      const wasSuggested = suggestedTopics.some(topic => normalizedQuestion.includes(topic));
      
      if (wasSuggested && shouldUsePersonaFallback) {
        // Override refusal with persona knowledge answer
        console.warn('Self-consistency violation detected: Bot suggested topic but refused. Using persona fallback.');
        // The persona knowledge is already in the system prompt, so we'll let the LLM retry
        // But we log this for monitoring
      }
    }

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

