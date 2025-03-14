import { Claude, PERSONALIZED_STYLE } from "./types.ts";
import { generateHeaders, uuid } from "./utils.ts";
import { createParser } from 'eventsource-parser'

export async function createConversation (params: {
  token: string
}) {
    const req = await fetch(`https://claude.ai/api/organizations/${Deno.env('organizationId')}/chat_conversations`,{
        method: 'POST',
        body: JSON.stringify({
            include_conversation_preferences: true,
            name: '',
            uuid: uuid()
        }),
        headers: generateHeaders(params.token)
    })

    const body: Claude.CreateConversationResponse = await req.json()
    return body
}

export async function createCompletionStream(params: {
    chat_id: string
    token: string
}) {
    const req = await fetch(`https://claude.ai/api/organizations/${Deno.env('organizationId')}/chat_conversations/${params.chat_id}/completion`, {
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
    })

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    return new ReadableStream({
        async start(controller) {


            const parser = createParser({})

            const reader = req.body!.getReader()
            
            try {
                while(true) {
                    const { done, value } = await reader.read()
                    if (done) {
                        controller.close()
                        break
                    }
                    parser.feed(decoder.decode(value))
                }
            } catch(err) {
                controller.error(err)
            }
        }
    })
}