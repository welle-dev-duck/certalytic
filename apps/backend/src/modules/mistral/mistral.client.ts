import { Mistral } from '@mistralai/mistralai';
import type {
  AssistantMessageContent,
  ChatCompletionRequest,
  ResponseFormat,
} from '@mistralai/mistralai/models/components';
import { env } from '../../config/env';

/** The Mistral SDK appends `/v1` — avoid double-prefixing when env includes it. */
export function normalizeMistralServerUrl(baseUrl: string): string {
  return baseUrl.replace(/\/v1\/?$/, '');
}

type MistralOcrResponse = {
  pages?: Array<{
    markdown?: string;
    text?: string;
  }>;
};

type MistralChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type MistralChatPayload = {
  model: string;
  temperature?: number;
  response_format?: ResponseFormat;
  messages: ChatCompletionRequest['messages'];
};

function extractTextContent(
  content: AssistantMessageContent | null | undefined,
): string | undefined {
  if (content == null) {
    return undefined;
  }

  if (typeof content === 'string') {
    return content;
  }

  return content
    .filter(
      (chunk): chunk is { type: 'text'; text: string } =>
        chunk.type === 'text' && typeof chunk.text === 'string',
    )
    .map((chunk) => chunk.text)
    .join('');
}

export class MistralClient {
  private client: Mistral | undefined;

  private getClient(): Mistral {
    if (!this.client) {
      if (!env.MISTRAL_API_KEY) {
        throw new Error('MISTRAL_API_KEY is required.');
      }

      this.client = new Mistral({
        apiKey: env.MISTRAL_API_KEY,
        serverURL: normalizeMistralServerUrl(env.MISTRAL_BASE_URL),
        timeoutMs: env.MISTRAL_TIMEOUT * 1_000,
      });
    }

    return this.client;
  }

  async chat(payload: MistralChatPayload): Promise<MistralChatResponse> {
    const request: ChatCompletionRequest = {
      model: payload.model,
      temperature: payload.temperature,
      responseFormat: payload.response_format,
      messages: payload.messages,
    };

    const response = await this.getClient().chat.complete(request);
    const content = extractTextContent(response.choices[0]?.message?.content);

    return {
      choices: [{ message: { content } }],
    };
  }

  async ocr(base64Document: string): Promise<MistralOcrResponse> {
    const response = await this.getClient().ocr.process({
      model: env.MISTRAL_OCR_MODEL,
      document: {
        type: 'document_url',
        documentUrl: `data:application/pdf;base64,${base64Document}`,
      },
    });

    return {
      pages: response.pages.map((page) => ({
        markdown: page.markdown,
      })),
    };
  }

  parseOcrResponse(response: MistralOcrResponse): string {
    const pages = response.pages ?? [];

    if (pages.length === 0) {
      throw new Error('Mistral OCR returned no page content.');
    }

    const markdown = pages
      .map((page) => page.markdown ?? page.text ?? '')
      .filter((value) => value.trim() !== '')
      .join('\n\n');

    if (markdown.trim() === '') {
      throw new Error('Mistral OCR returned empty text.');
    }

    return markdown;
  }
}
