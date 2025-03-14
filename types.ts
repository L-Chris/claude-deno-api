export declare namespace OpenAI {
    interface Message {
        role?: 'user' | 'assistant'
        type?: 'text' | 'image' | 'file'
        image?: string
        content?: string | MessageContent[]
    }
    
    interface MessageContent {
        type: 'text' | 'file' | 'image_url' | 'image'
        file_url?: {
          url: string
        }
        image_url?: {
          url: string
        }
        text?: string
    }
    
    interface CompletionChunk {
        id: string
        model: string
        object: string
        citations: string[]
        created: number
        choices: {
          index: number
          message?: {
            role: 'assistant' | 'user'
            content: string
            reasoning_content?: string
            tool_calls?: ToolCall[]
          }
          delta?: {
            role: 'assistant' | 'user'
            content: string
            reasoning_content?: string
            tool_calls?: ToolCall[]
          }
          finish_reason: null | 'stop'
        }[]
        usage?: {
          prompt_tokens: number
          completion_tokens: number
          total_tokens: number
        }
        error?: {
            message: string
            type: string
        }
    }

    interface Tool {
        type: 'function'
        function: {
          name: string
          description: string
          parameters: {
            type: 'object'
            properties: Record<string, {
                type: string
                description: string
            }>
            required: string[]
            additionalProperties: boolean
          }
          strict: boolean
        }
    }

    interface ToolCall {
        id: string
        type: 'function'
        function: {
          name: string
          arguments: string
        }
    }

    interface ModelConfig {
        name: string
        response_format?: {
            type: 'text' | 'json_schema'
            json_schema?: Record<string, any>
        }
    }
}

export declare namespace Claude {
    interface CreateConversationParams {
        include_conversation_preferences: boolean
        name: string
        uuid: string
    }
    interface CreateConversationResponse {
        uuid: string;
        name: string;
        summary: string;
        model: string | null;
        created_at: string;
        updated_at: string;
        settings: {
            preview_feature_uses_artifacts: boolean;
            preview_feature_uses_latex: boolean | null;
            preview_feature_uses_citations: boolean | null;
            enabled_artifacts_attachments: boolean | null;
            enabled_turmeric: boolean | null;
            paprika_mode: boolean | null;
            enabled_drive_search: boolean | null;
            enabled_web_search: boolean | null;
            enabled_compass: boolean | null;
        };
        is_starred: boolean;
        project_uuid: string | null;
        current_leaf_message_uuid: string | null;
    }
    
    interface PersonalizedStyle {
        type: string;
        key: string;
        name: string;
        nameKey: string;
        prompt: string;
        summary: string;
        summaryKey: string;
        isDefault: boolean;
    }



    interface CompletionParams {
        prompt: string;
        parent_message_uuid: string;
        timezone: string;
        personalized_styles: PersonalizedStyle[];
        attachments: Attachment[];
        files: Attachment[];
        sync_sources: any[];
        rendering_mode: 'messages';
    }

    interface Attachment {
        extracted_content: string
        file_name: string
        file_size: number
        file_type: string
    }

    interface CompletionChunk {
        type: 'message_start' | 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_delta' | 'message_limit' | 'message_stop'
        index?: number
        delta?: {
            type: 'text_delta'
            text: string
            stop_reason?: 'end_turn'
            stop_sequence?: null | string
        }
        content_block?: {
            start_timestamp: string
            stop_timestamp: null | string
            type: 'text'
            text: string
            citations: string[]
        }
        message?: {
            id: string
            type: 'message'
            role: 'assistant'
            model: string
            parent_uuid: string
            uuid: string
            content: any[]
            stop_reason: null | string
            stop_sequence: null | string
        }
        message_limit?: {
            type: 'within_limit'
            resetsAt: null | string
            remaining: null | string
            perModelLimit: null | string
        }
        stop_timestamp?: string
    }
}

export const PERSONALIZED_STYLE: Record<string, Claude.PersonalizedStyle> = {
    DEFAULT: {
        isDefault: true,
        key: "Default",
        name: "Normal",
        nameKey: "normal_style_name",
        prompt: "Normal",
        summary: "Default responses from Claude",
        summaryKey: "normal_style_summary",
        type: "default"
    }
}