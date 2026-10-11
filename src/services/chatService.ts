import { Attachment, ChatMessage } from '../types/chat';

interface StreamChatParams {
  prompt: string;
  history: ChatMessage[];
  model: string;
  attachments?: Attachment[];
  systemInstruction?: string;
  temperature?: number;
  thinkingLevel?: string;
  onChunk: (text: string) => void;
  onError: (error: string) => void;
  onDone: () => void;
  signal?: AbortSignal;
}

export const chatService = {
  async streamChat({
    prompt,
    history,
    model,
    attachments = [],
    systemInstruction,
    temperature = 0.7,
    thinkingLevel = 'high',
    onChunk,
    onError,
    onDone,
    signal,
  }: StreamChatParams): Promise<void> {
    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          history,
          model,
          attachments,
          systemInstruction,
          temperature,
          thinkingLevel,
        }),
        signal,
      });

      if (!response.ok) {
        let errMessage = `Server returned HTTP ${response.status}`;
        try {
          const json = await response.json();
          if (json.error) errMessage = json.error;
        } catch {
          // ignore
        }
        onError(errMessage);
        return;
      }

      if (!response.body) {
        onError('Streaming response body is empty.');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (dataStr === '[DONE]') {
            onDone();
            return;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              onError(parsed.error);
              return;
            }
            if (parsed.text) {
              onChunk(parsed.text);
            }
          } catch {
            // Raw text fallback
            onChunk(dataStr);
          }
        }
      }

      onDone();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        onDone();
        return;
      }
      onError(err.message || 'Network communication error during stream.');
    }
  },
};
