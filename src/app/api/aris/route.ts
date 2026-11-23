import Anthropic from '@anthropic-ai/sdk';
import { ARIS_INSTRUCTIONS, STORE_INFO, getCatalog } from '@/lib/aris/knowledge';
import { arisAnswer } from '@/lib/aris/brain';

// POST /api/aris — returns Aris's reply as plain text.
// Body: { messages: { role: 'user' | 'assistant', content: string }[] }
//
// Two modes:
// • Default (free): no ANTHROPIC_API_KEY set → Aris answers with the
//   built-in engine in lib/aris/brain.ts from the live catalog and the
//   store's policies. No AI API, no cost.
// • Optional: set ANTHROPIC_API_KEY and Aris switches to Claude for fully
//   conversational answers (paid per message). The key stays server-side.
//
// Input is capped and each visitor is rate-limited.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL = 'claude-opus-5-5';
const MAX_TURNS = 16; // most recent messages kept per request
const MAX_CHARS = 1000; // per customer message
// Free mode costs nothing per message, so allow a longer chat; Claude mode
// (paid per message) keeps the tighter limit.
const RATE_LIMIT = { max: process.env.ANTHROPIC_API_KEY ? 20 : 40, windowMs: 10 * 60 * 1000 }; // per visitor

type ChatTurn = { role: 'user' | 'assistant'; content: string };

// Best-effort per-instance limiter. Serverless instances don't share
// memory, so this caps bursts rather than being a hard global limit.
const hits = new Map<string, number[]>();
function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < RATE_LIMIT.windowMs);
  if (recent.length >= RATE_LIMIT.max) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear(); // keep memory bounded
  return false;
}

function parseMessages(body: unknown): ChatTurn[] | null {
  const raw = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const turns: ChatTurn[] = [];
  for (const m of raw.slice(-MAX_TURNS)) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') return null;
    const content = m.content.trim().slice(0, m.role === 'user' ? MAX_CHARS : 4000);
    if (content) turns.push({ role: m.role, content });
  }
  // The API needs the conversation to start with the customer and end on
  // their latest message.
  while (turns.length && turns[0].role !== 'user') turns.shift();
  if (!turns.length || turns[turns.length - 1].role !== 'user') return null;
  return turns;
}

let client: Anthropic | null = null;

export async function POST(request: Request) {
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
  if (rateLimited(ip)) {
    return Response.json({ error: 'rate_limited' }, { status: 429 });
  }

  let messages: ChatTurn[] | null = null;
  try {
    messages = parseMessages(await request.json());
  } catch {
    // fall through to the 400 below
  }
  if (!messages) {
    return Response.json({ error: 'bad_request' }, { status: 400 });
  }

  const catalog = await getCatalog();

  // Free built-in mode.
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(arisAnswer(messages, catalog.products), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  client ??= new Anthropic();

  const stream = client.beta.messages.stream(
    {
      model: MODEL,
      max_tokens: 4000,
      // Short customer chat: low effort keeps replies fast and cheap.
      output_config: { effort: 'low' },
      // If the model declines a message, re-run it on a fallback model
      // inside the same call so the customer still gets an answer.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      // Instructions and store info never change between requests and the
      // catalog only every few minutes, so cache that prefix.
      system: [
        { type: 'text', text: ARIS_INSTRUCTIONS },
        { type: 'text', text: STORE_INFO },
        { type: 'text', text: catalog.text, cache_control: { type: 'ephemeral' } },
      ],
      messages,
    },
    { signal: request.signal }
  );

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === 'refusal') {
          controller.enqueue(
            encoder.encode("Sorry, I can't help with that one. Is there anything about ARVIIK I can help you with?")
          );
        } else if (final.stop_reason === 'max_tokens') {
          controller.enqueue(encoder.encode('…'));
        }
      } catch (err) {
        if (!request.signal.aborted) {
          if (err instanceof Anthropic.RateLimitError) {
            console.error('Aris: Anthropic rate limit');
          } else if (err instanceof Anthropic.APIError) {
            console.error(`Aris: API error ${err.status}:`, err.message);
          } else {
            console.error('Aris: stream failed', err);
          }
          controller.enqueue(
            encoder.encode('\n\nSorry, I lost my connection for a moment. Please try again, or message us on WhatsApp.')
          );
        }
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
    },
  });
}
