import { Hono } from 'hono'
import { createConversation, createCompletionStream, models } from './api.ts'
import { OpenAI } from "./types.ts";
import { getModelConfig, mergeMessages } from "./utils.ts";

const app = new Hono()

app.get('/', c => c.text('Hello World'))

app.post('/v1/chat/completions', async c => {
  const authHeader = c.req.header('authorization') || ''
  const token = authHeader.replace(/^Bearer /, '')

  if (!token)
    return c.json({
      status: 500,
      message: 'need token'
    })

  const body = await c.req.json()
  const model = (body?.model as string) || models[0].id
  const messages = body?.messages as OpenAI.Message[]
  if (!Array.isArray(messages) || messages.length === 0) return c.json({
    status: 500,
    message: 'need message'
  })

  const response_format = (body?.response_format || { type: 'text' }) as OpenAI.ModelConfig['response_format']
  const modelConfig = getModelConfig(model, response_format)
  const newMessages = mergeMessages(modelConfig, messages, [])
  const conversation = await createConversation({
    token
  })

  const stream = await createCompletionStream({
    chat_id: conversation.uuid,
    token: token,
    messages: newMessages,
    config: modelConfig
  })

  return new Response(stream, {
    headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    }
  })
})

app.get('/v1/models', c => {
  return c.json({
    data: models
  })
})

Deno.serve({ port: 8002 }, app.fetch)
