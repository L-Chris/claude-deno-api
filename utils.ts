import { crypto } from 'https://deno.land/std/crypto/mod.ts'
import _ from 'lodash'
import { Claude, OpenAI } from "./types.ts";

export const uuid = () => crypto.randomUUID()

export const getChunkType = (chunk: Claude.CompletionChunk) => {
  if (chunk.delta?.type === 'text_delta') return CHUNK_TYPE.TEXT
  return CHUNK_TYPE.NONE
}

export const getModelConfig = (orginName: string, response_format?: OpenAI.ModelConfig['response_format']): OpenAI.ModelConfig => {
  const parts = orginName.split('_')
  return {  
    name: parts[0],
    response_format
  }
}

export function generateHeaders (token: string) {
  const Cookie = [
    `token=${token}`
  ].join('; ')

  return {
    Cookie,
    Authorization: `Bearer ${token}`,
    ...FAKE_HEADERS
  }
}

export function mergeMessages (
  config: OpenAI.ModelConfig,
  data: OpenAI.Message[],
  urls: Claude.Attachment[] = []
): OpenAI.Message[] {
  const content = data.reduce((pre: string, message) => {
    if (Array.isArray(message.content)) {
      return message.content.reduce((_content, v) => {
        if (!_.isObject(v) || v.type != 'text') return _content
        return (
          _content +
          `<|im_start|>${message.role || 'user'}\n${v.text || ''}<|im_end|>\n`
        )
      }, pre)
    }

    pre += _.isString(message) ? message : message.content
    return pre
  }, '')

  return [
    {
      role: 'user',
      content: [
        {
          text: content,
          type: 'text'
        },
      ],
    }
  ]
}

export function extractFileUrlsFromMessages (data: OpenAI.Message[]) {
  const res: string[] = []

  if (!data.length) return res

  const lastMessage = data[data.length - 1]

  if (Array.isArray(lastMessage.content)) {
    lastMessage.content.forEach(v => {
      if (!_.isObject(v) || !['file', 'image_url'].includes(v.type)) return
      if (v['type'] == 'file' && _.isString(v.file_url?.url)) {
        res.push(v.file_url?.url!)
      } else if (v['type'] == 'image_url' && _.isString(v.image_url?.url)) {
        // 兼容gpt-4-vision-preview API格式
        res.push(v.image_url?.url!)
      }
    })
  }

  return res
}

export function extractJsonFromContent (data: string) {
  try {
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = data.match(jsonRegex);
    
    if (!match || !match[1]) return JSON.parse(data);
    
    const jsonString = match[1].trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('解析JSON失败:', error);
    return null;
  }
}

export const dataUtil = {
  isBASE64Data (value: string) {
    return _.isString(value) && /^data:/.test(value)
  },
  extractBASE64DataFormat (value: string) {
    const match = value.trim().match(/^data:(.+);base64,/)
    if (!match) return null
    return match[1]
  },
  removeBASE64DataHeader (value: string): string {
    return value.replace(/^data:(.+);base64,/, '')
  },
  base64ToUint8Array (string: string) {
    return Uint8Array.from(atob(string), c => c.charCodeAt(0))
  },
  isImageMime (_: string) {
    return [
      'image/jpeg',
      'image/jpg',
      'image/tiff',
      'image/png',
      'image/bmp',
      'image/gif',
      'image/svg+xml',
      'image/webp',
      'image/ico',
      'image/heic',
      'image/heif',
      'image/bmp',
      'image/x-icon',
      'image/vnd.microsoft.icon',
      'image/x-png'
    ].includes(_)
  }
}

export const FAKE_HEADERS = {
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

export enum CHUNK_TYPE {
  ERROR = 'ERROR',
  START = 'START',
  DEEPSEARCHING = 'DEEPSEARCHING',
  SEARCHING = 'SEARCHING',
  SEARCHING_DONE = 'SEARCHING_DONE',
  THINKING = 'THINKING',
  TEXT = 'TEXT',
  SUGGESTION = 'SUGGESTION',
  DONE = 'DONE',
  NONE = 'NONE'
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