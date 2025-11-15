import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

/**
 * Centralized Bedrock client (reads secrets from env)
 */
export function getBedrockClient() {
  // Secrets are automatically available as environment variables when declared in function definition
  const region = process.env.AWS_REGION || 'us-east-1'; // Bedrock Anthropic access is typically in us-east-1
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials not found. Make sure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY secrets are set.');
  }

  return new BedrockRuntimeClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

