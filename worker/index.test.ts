import { afterEach, describe, expect, it, vi } from 'vitest'
import { BALANCE, DAILY } from '../src/test/fixtures'
import worker, { type Env } from './index'

const env: Env = {
  TELEGRAM_BOT_TOKEN: 'TOKEN',
  TELEGRAM_CHAT_ID: '42',
  PP_ACCOUNTS: '00000000',
  WEBHOOK_SECRET: 'shh',
}

function update(chatId: number, text: string, secret = 'shh') {
  return new Request('https://bot.example.workers.dev/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Telegram-Bot-Api-Secret-Token': secret },
    body: JSON.stringify({ update_id: 1, message: { chat: { id: chatId }, text } }),
  })
}

/** Fake DESCO (tkdes) plus Telegram; returns the messages the bot sent. */
function stubNetwork() {
  const sent: { method: string; body: Record<string, unknown> }[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input))
      if (url.hostname === 'api.telegram.org') {
        sent.push({ method: url.pathname.split('/').pop()!, body: JSON.parse(String(init?.body)) })
        return Response.json({ ok: true })
      }
      const known = url.pathname.includes('/tkdes/')
      const endpoint = url.pathname.split('/').pop()
      const data = !known ? null : endpoint === 'getBalance' ? BALANCE : endpoint === 'getCustomerDailyConsumption' ? DAILY : []
      return Response.json({ code: 200, desc: 'OK', data })
    }),
  )
  return sent
}

async function run(request: Request) {
  const pending: Promise<unknown>[] = []
  const response = await worker.fetch(request, env, { waitUntil: (p: Promise<unknown>) => pending.push(p) })
  await Promise.all(pending)
  return response
}

afterEach(() => vi.unstubAllGlobals())

describe('worker', () => {
  it('rejects webhook calls without the secret token', async () => {
    stubNetwork()
    expect((await run(update(42, '/balance', 'wrong'))).status).toBe(401)
  })

  it('answers the owner with the balance, after showing a typing indicator', async () => {
    const sent = stubNetwork()
    const response = await run(update(42, '/balance'))
    expect(response.status).toBe(200)
    expect(sent.map((s) => s.method)).toEqual(['sendChatAction', 'sendMessage'])
    expect(sent[1]!.body.chat_id).toBe(42)
    expect(sent[1]!.body.text).toContain('Balance: ৳510.65')
    expect(sent[1]!.body.text).toContain('••••0000')
  })

  it('ignores everyone else', async () => {
    const sent = stubNetwork()
    expect((await run(update(7, '/balance'))).status).toBe(200)
    expect(sent).toEqual([])
  })

  it('replies with help for unknown messages', async () => {
    const sent = stubNetwork()
    await run(update(42, 'hi'))
    expect(sent).toHaveLength(1)
    expect(sent[0]!.body.text).toContain('/recharges')
  })

  it('reports DESCO reachability without meter data', async () => {
    stubNetwork()
    const response = await run(new Request('https://bot.example.workers.dev/health'))
    expect(await response.json()).toEqual({ desco: 'reachable' })
  })

  it('protects and performs setup', async () => {
    const sent = stubNetwork()
    expect((await run(new Request('https://bot.example.workers.dev/setup?key=nope'))).status).toBe(403)
    const response = await run(new Request('https://bot.example.workers.dev/setup?key=shh'))
    expect(response.status).toBe(200)
    expect(sent.map((s) => s.method).sort()).toEqual(['setMyCommands', 'setWebhook'])
    expect(sent.find((s) => s.method === 'setWebhook')!.body).toMatchObject({
      url: 'https://bot.example.workers.dev/',
      secret_token: 'shh',
    })
  })
})
