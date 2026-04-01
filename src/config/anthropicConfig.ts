import { ChatAnthropic } from '@langchain/anthropic'

export function anthropicConfig() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not defined in environment variables')
  }

  return new ChatAnthropic({
    model: 'claude-opus-4-6', // Chosen since it's the most intelligent model for building agents and coding, according to Claude API Docs (https://platform.claude.com/docs/en/about-claude/models/overview)
    apiKey: process.env.ANTHROPIC_API_KEY,
    clientOptions: { timeout: 300000 },
    maxRetries: 3,
    temperature: 1, // Default temperature of 1 is used
  })
}
