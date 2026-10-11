export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl?: string; // base64
  textPreview?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  model?: string;
  isStreaming?: boolean;
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  model: string;
  systemPrompt?: string;
  temperature?: number;
  pinned?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  versionLabel: string;
  tagline: string;
  description: string;
  speed: string;
  intelligence: string;
  requiresPaidKey?: boolean;
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'X0 Flash',
    versionLabel: 'v3.8 Flash',
    tagline: 'Standard Free Quota · High speed & balanced reasoning',
    description: 'Flagship general intelligence model with standard quota, optimized for coding, writing, and responsive chat.',
    speed: 'Ultra Fast',
    intelligence: 'High',
    requiresPaidKey: false,
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'X0 Pro',
    versionLabel: 'v3.1 Pro',
    tagline: 'Requires Paid Key · Deep reasoning & complex architecture',
    description: 'Advanced reasoning model for complex STEM, deep mathematical proofs, and large multi-file refactoring. Requires a billing-enabled paid API key.',
    speed: 'Standard',
    intelligence: 'Maximum',
    requiresPaidKey: true,
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'X0 Lite',
    versionLabel: 'v3.1 Lite',
    tagline: 'Ultra-low latency · Lightweight queries',
    description: 'Fast lightweight model designed for rapid summaries, quick transformations, and zero-latency Q&A.',
    speed: 'Instant',
    intelligence: 'Standard',
    requiresPaidKey: false,
  },
];
