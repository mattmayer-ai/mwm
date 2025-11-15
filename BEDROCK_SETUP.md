# AWS Bedrock Setup

## Environment Variables

AWS Bedrock requires AWS credentials. Set these as Firebase Functions secrets:

```bash
# Set AWS Access Key ID (your BedrockAPIKey-ydmm-at-587263142261)
firebase functions:secrets:set AWS_ACCESS_KEY_ID --project askmwm

# Set AWS Secret Access Key (you'll need this from AWS)
firebase functions:secrets:set AWS_SECRET_ACCESS_KEY --project askmwm

# Set AWS Region (optional, defaults to us-east-1)
firebase functions:config:set aws.region="us-east-1" --project askmwm
```

## Important Notes

1. **Your key "BedrockAPIKey-ydmm-at-587263142261"** - This is your AWS Access Key ID. You'll also need the corresponding **Secret Access Key** from AWS.

2. **AWS Credentials**: Bedrock requires both:
   - `AWS_ACCESS_KEY_ID` - Your access key (BedrockAPIKey-ydmm-at-587263142261)
   - `AWS_SECRET_ACCESS_KEY` - Your secret key (get from AWS IAM)

3. **Region**: Make sure your Bedrock model is available in the region you specify (default: `us-east-1`)

4. **Model ID**: The code uses `anthropic.claude-3-5-sonnet-20241022-v1`. Make sure this model is enabled in your AWS Bedrock console.

5. **IAM Permissions**: The IAM user/role needs these permissions:
   - `bedrock:InvokeModel`
   - `bedrock:InvokeModelWithResponseStream` (if you switch to streaming later)

## Getting Your AWS Credentials

If you only have the access key ID, you'll need to:
1. Go to AWS IAM Console → Users
2. Find the user with that access key (BedrockAPIKey-ydmm-at-587263142261)
3. Security credentials tab → Create access key
4. Save both the Access Key ID and Secret Access Key (you can only see the secret once!)

## IAM Policy Required

Attach this policy to your IAM user:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "InvokeBedrock",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v1"
      ]
    }
  ]
}
```

## Testing

After setting secrets, deploy and test:

```bash
cd functions
npm install
npm run build
firebase deploy --only functions:chat
```

Then test with:
```bash
curl -s -X POST https://askmwm.web.app/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"ping"}]}'
```

