import { createParser } from 'eventsource-parser'
import { Claude, OpenAI } from './types.ts'
import { approximateTokenSize } from 'tokenx'

export class ChunkParser {
  private streamController!: ReadableStreamDefaultController
  private stream: ReadableStream
  private encoder = new TextEncoder()
  private decoder = new TextDecoder()
  private content = ''
  private messages: OpenAI.Message[] = []
  private parser = createParser({
    onEvent: e => {
      this.parse(e)
    }
  })

  constructor (req: Response, messages: OpenAI.Message[]) {
    this.messages = messages
    this.stream = new ReadableStream({
      start: controller => {
        this.streamController = controller
        this.read(req)
      }
    })
  }

  // 根据对接模型修改
  private parse (e: EventSourceMessage) {
    if (e.event !== 'data') return

    try {
      const chunkData: Claude.CompletionChunk = JSON.parse(e.data)
      const chunkType = this.getChunkType(chunkData)

      if (chunkType === CHUNK_TYPE.TEXT) {
        this.send({ content: chunkData.delta?.text })
        return
      }
    } catch (err) {
      this.send({ error: err instanceof Error ? err.message : 'unknown error' })
    }
  }

  // 根据对接模型修改
  private getChunkType (chunk: Claude.CompletionChunk) {
    if (chunk.type === 'message_start') return CHUNK_TYPE.START
    if (chunk.type === 'content_block_delta') return CHUNK_TYPE.TEXT
    if (chunk.type === 'message_stop') return CHUNK_TYPE.DONE
    return CHUNK_TYPE.NONE
  }

  private async read (req: Response) {
    if (!this.streamController || !this.stream) return
    try {
      const reader = req.body!.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          return
        }

        this.parser.feed(this.decoder.decode(value))
      }
    } catch (err) {
      this.streamController.error(err)
      this.send({ error: err instanceof Error ? err.message : 'unknown error' })
    } finally {
      this.send({ done: true })
    }
  }

  private send (params: {
    content?: string
    reasoning_content?: string
    citations?: string[]
    error?: string
    done?: boolean
  }) {
    const message: OpenAI.CompletionChunk = {
      id: '',
      model: '',
      object: 'chat.completion.chunk',
      choices: [],
      citations: params.citations || [],
      created: Math.trunc(Date.now() / 1000)
    }

    if (params.error) {
        message.error = {
            message: params.error,
            type: 'server error'
        }

        const data = this.encoder.encode(`data: ${JSON.stringify(message)}\n\n`)
        this.streamController.enqueue(data)
        return
    }

    if (params.done) {
        const prompt_tokens = approximateTokenSize(this.messages.reduce((acc, cur) => acc + (Array.isArray(cur.content) ? cur.content.map(_ => _.text).join('') : cur.content), ''))
        const completion_tokens = approximateTokenSize(this.content)
        message.usage = {
            prompt_tokens,
            completion_tokens,
            total_tokens: prompt_tokens + completion_tokens   
        }
        const data = this.encoder.encode(`data: ${JSON.stringify(message)}\n\n`)
        this.streamController.enqueue(data)
        this.streamController.enqueue(`data: [DONE]\n\n`)
        return
    }

    message.choices.push({
        index: 0,
        delta: {
            role: 'assistant',
            content: params.content || '',
            reasoning_content: params.reasoning_content || ''
        },
        finish_reason: null
    })

    const data = this.encoder.encode(`data: ${JSON.stringify(message)}\n\n`)
    this.streamController.enqueue(data)
  }

  getStream() {
    return this.stream
  }
}

interface EventSourceMessage {
  data: string
  event?: string
  id?: string
}

export enum CHUNK_TYPE {
  ERROR = 'ERROR',
  START = 'START', // 提供基础信息，如chatid
  DEEPSEARCHING = 'DEEPSEARCHING',
  SEARCHING = 'SEARCHING',
  SEARCHING_DONE = 'SEARCHING_DONE',
  THINKING = 'THINKING',
  TEXT = 'TEXT',
  SUGGESTION = 'SUGGESTION',
  DONE = 'DONE',
  NONE = 'NONE'
}
