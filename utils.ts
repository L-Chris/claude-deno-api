import { crypto } from 'https://deno.land/std/crypto/mod.ts'
import _ from 'lodash'
import { Claude, OpenAI } from "./types.ts";

export const uuid = () => crypto.randomUUID()

export const getModelConfig = (orginName: string, response_format?: OpenAI.ModelConfig['response_format']): OpenAI.ModelConfig => {
  const parts = orginName.split('_')
  return {  
    name: parts[0],
    response_format
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

