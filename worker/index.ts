/*
 * PowerPulse Telegram bot, as a Cloudflare Worker.
 *
 * Telegram calls this Worker for every message sent to the bot. The Worker answers
 * Telegram straight away and sends the reply in the background, so a slow DESCO
 * never makes Telegram retry. Only the owner's chat gets answers.
 *
 * GET /setup?key=<WEBHOOK_SECRET> registers the webhook and the command menu.
 */
import { parseAlertSettings } from '../src/lib/alerts.ts'
import { fetchBalance, fetchDaily, fetchMonthly, fetchRecharges, MeterApiError, normalizeAccount } from '../src/lib/api.ts'
import { balanceReply, HELP_TEXT, parseCommand, rechargesReply, usageReply, type Command } from '../src/lib/bot.ts'
import { dhakaToday } from '../src/lib/dates.ts'

export interface Env {
  TELEGRAM_BOT_TOKEN: string
  TELEGRAM_CHAT_ID: string
  PP_ACCOUNTS: string
  WEBHOOK_SECRET: string
  PP_THRESHOLD_TAKA?: string
  PP_RUNWAY_DAYS?: string
}

interface Context {
  waitUntil(promise: Promise<unknown>): void
}

interface TelegramUpdate {
  message?: { chat: { id: number }; text?: string }
}

const COMMANDS = [
  { command: 'balance', description: 'Balance, days left and what to recharge' },
  { command: 'usage', description: 'This month so far and the last 7 days' },
  { command: 'recharges', description: 'Last recharges and tokens' },
]

async function telegram(env: Env, method: string, body: unknown): Promise<Response> {
  return fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function accountsOf(env: Env): string[] {
  return (env.PP_ACCOUNTS ?? '')
    .split(/[,\s]+/)
    .map((a) => normalizeAccount(a))
    .filter((a): a is string => a !== null)
}

function failureText(error: unknown): string {
  if (error instanceof MeterApiError) {
    if (error.kind === 'not-found') return 'DESCO does not recognise this account number.'
    if (error.kind === 'timeout') return 'DESCO took too long to answer. Try again in a minute.'
    return 'Could not reach DESCO right now. Try again in a minute.'
  }
  return 'Something went wrong reading this meter.'
}

async function replyFor(command: Command, env: Env): Promise<string> {
  if (command === 'help') return HELP_TEXT
  const accounts = accountsOf(env)
  if (accounts.length === 0) return 'No meters are configured yet. Add PP_ACCOUNTS to the Worker.'

  const settings = parseAlertSettings({
    thresholdTaka: env.PP_THRESHOLD_TAKA ? Number(env.PP_THRESHOLD_TAKA) : undefined,
    runwayDays: env.PP_RUNWAY_DAYS ? Number(env.PP_RUNWAY_DAYS) : undefined,
  })
  const today = dhakaToday()

  const replies = await Promise.all(
    accounts.map(async (account) => {
      try {
        const { backend, balance } = await fetchBalance(account)
        if (command === 'recharges') return rechargesReply(account, await fetchRecharges(account, backend, today))
        const daily = await fetchDaily(account, backend, today).catch(() => [])
        if (command === 'balance') return balanceReply(account, balance, daily, settings)
        const monthly = await fetchMonthly(account, backend, today).catch(() => [])
        return usageReply(account, balance, daily, monthly)
      } catch (error) {
        return `⚡ Meter ••••${account.slice(-4)}\n${failureText(error)}`
      }
    }),
  )
  return replies.join('\n\n')
}

async function answer(env: Env, chatId: number, command: Command): Promise<void> {
  if (command !== 'help') await telegram(env, 'sendChatAction', { chat_id: chatId, action: 'typing' })
  const text = await replyFor(command, env)
  await telegram(env, 'sendMessage', { chat_id: chatId, text, disable_web_page_preview: true })
}

async function setup(request: Request, env: Env): Promise<Response> {
  const webhook = new URL('/', request.url).toString()
  const results = await Promise.all([
    telegram(env, 'setWebhook', {
      url: webhook,
      secret_token: env.WEBHOOK_SECRET,
      allowed_updates: ['message'],
      drop_pending_updates: true,
    }).then((r) => r.json()),
    telegram(env, 'setMyCommands', { commands: COMMANDS }).then((r) => r.json()),
  ])
  return Response.json({ webhook: results[0], commands: results[1] })
}

export default {
  async fetch(request: Request, env: Env, ctx: Context): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'GET' && url.pathname === '/setup') {
      if (!env.WEBHOOK_SECRET || url.searchParams.get('key') !== env.WEBHOOK_SECRET) {
        return new Response('Forbidden', { status: 403 })
      }
      return setup(request, env)
    }

    if (request.method !== 'POST') return new Response('PowerPulse bot is running.')

    if (!env.WEBHOOK_SECRET || request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.WEBHOOK_SECRET) {
      return new Response('Unauthorized', { status: 401 })
    }

    const update = (await request.json().catch(() => ({}))) as TelegramUpdate
    const message = update.message
    // Strangers who find the bot get no answer at all.
    if (message?.text && String(message.chat.id) === env.TELEGRAM_CHAT_ID) {
      ctx.waitUntil(answer(env, message.chat.id, parseCommand(message.text)))
    }
    return new Response('ok')
  },
}
