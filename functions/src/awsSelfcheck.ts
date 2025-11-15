import { onRequest } from 'firebase-functions/v2/https';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

/**
 * Self-check endpoint to verify AWS credentials are properly configured
 * and accessible from Firebase Functions
 */
export const awsSelfcheck = onRequest(
  {
    region: 'us-east1',
    timeoutSeconds: 30,
    secrets: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
  },
  async (req, res) => {
    try {
      const region = process.env.AWS_REGION || 'us-east-1'; // Bedrock is in us-east-1 for Anthropic
      const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

      if (!accessKeyId || !secretAccessKey) {
        res.status(500).json({ ok: false, reason: 'MISSING_SECRETS' });
        return;
      }

      const sts = new STSClient({
        region,
        credentials: { accessKeyId, secretAccessKey },
      });
      const out = await sts.send(new GetCallerIdentityCommand({}));

      // Mask the key so we can confirm which one is mounted
      const akPreview = `${accessKeyId.slice(0, 4)}...${accessKeyId.slice(-4)}`;

      res.json({
        ok: true,
        region,
        accessKeyPreview: akPreview,
        account: out.Account,
        arn: out.Arn,
        userId: out.UserId,
      });
      return;
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        name: err?.name,
        message: err?.message,
        code: err?.code,
      });
      return;
    }
  }
);

