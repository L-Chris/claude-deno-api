import { ChunkParser } from "./chunk-parser.ts";
import { Claude, OpenAI, PERSONALIZED_STYLE } from './types.ts'
import { uuid } from './utils.ts'

export async function createConversation (params: { token: string }) {
  const req = await fetch(
    `https://claude.ai/api/organizations/${Deno.env.get(
      'organizationId'
    )}/chat_conversations`,
    {
      method: 'POST',
      body: JSON.stringify({
        include_conversation_preferences: true,
        name: '',
        uuid: uuid()
      }),
      headers: generateHeaders(params.token)
    }
  )

  const body: Claude.CreateConversationResponse = await req.json()
  return body
}

export async function createCompletionStream (params: {
  chat_id: string
  token: string
  messages: OpenAI.Message[]
  config: OpenAI.ModelConfig
}) {
  const req = await fetch(
    `https://claude.ai/api/organizations/${Deno.env.get(
      'organizationId'
    )}/chat_conversations/${params.chat_id}/completion`,
    {
      method: 'POST',
      headers: {
        ...generateHeaders(params.token),
        Accept: 'text/event-stream'
      },
      body: JSON.stringify({
        parent_message_uuid: '00000000-0000-4000-8000-000000000000',
        timezone: 'Asia/Shanghai',
        personalized_styles: [PERSONALIZED_STYLE.DEFAULT],
        attachments: [],
        files: [],
        sync_sources: [],
        rendering_mode: 'messages'
      })
    }
  )

  return (new ChunkParser(req, params.messages)).getStream()
}

export const models = [
  {
    id: 'claude-3-7-sonnet',
    name: 'claude-3-7-sonnet',
    object: 'model',
    created: 1732711466,
    owned_by: 'claude.ai',
  },
]

function generateHeaders (token: string) {
  const Cookie = [
    `lastActiveOrg=${Deno.env.get('organizationId')}`,
    `sessionKey=${token}`,
  ].join('; ')

  return {
    Cookie,
    'Anthropic-Client-Platform': 'web_claude_ai',
    Accept: 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Cache-Control': 'no-cache',
    Origin: 'https://claude.ai',
    Pragma: 'no-cache',
    'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    Referer: 'https://claude.ai',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  }
}