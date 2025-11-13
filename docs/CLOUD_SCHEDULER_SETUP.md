# Cloud Scheduler Setup

## Weekly Reindex Job

Automatically reindex content every Monday at 06:00 UTC.

### Setup via gcloud CLI

```bash
# Set your project
gcloud config set project <your-project-id>

# Create service account for scheduler
gcloud iam service-accounts create scheduler-sa \
  --display-name="Scheduler Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding <your-project-id> \
  --member="serviceAccount:scheduler-sa@<your-project-id>.iam.gserviceaccount.com" \
  --role="roles/cloudfunctions.invoker"

# Create the scheduled job
gcloud scheduler jobs create http weekly-reindex \
  --schedule="0 6 * * 1" \
  --uri="https://us-central1-<your-project-id>.cloudfunctions.net/api/reindex" \
  --http-method=POST \
  --headers="Content-Type=application/json,Authorization=Bearer $(gcloud auth print-identity-token)" \
  --message-body='{"adminSecret":"<YOUR_ADMIN_SECRET>"}' \
  --time-zone="UTC" \
  --description="Weekly content reindex"
```

### Setup via Firebase Console

1. Go to Google Cloud Console → Cloud Scheduler
2. Create Job:
   - **Name:** `weekly-reindex`
   - **Frequency:** `0 6 * * 1` (Mondays 06:00 UTC)
   - **Target:** HTTP
   - **URL:** `https://us-central1-<PROJECT_ID>.cloudfunctions.net/api/reindex`
   - **Method:** POST
   - **Headers:** 
     - `Content-Type: application/json`
     - `X-Admin-Secret: <YOUR_ADMIN_SECRET>`
   - **Body:** `{}`

## Health Check Ping (Every 5 Minutes)

Monitor system uptime with regular health checks.

### Setup via gcloud CLI

```bash
gcloud scheduler jobs create http health-check \
  --schedule="*/5 * * * *" \
  --uri="https://us-central1-<your-project-id>.cloudfunctions.net/api/health" \
  --http-method=GET \
  --time-zone="UTC" \
  --description="Health check ping every 5 minutes"
```

### Alternative: Use Uptime Service

Instead of Cloud Scheduler, use a service like:
- **UptimeRobot** (free tier: 50 monitors)
- **Pingdom**
- **StatusCake**

Configure to ping:
- `https://<your-project>.web.app` (every 5 minutes)
- `https://us-central1-<PROJECT_ID>.cloudfunctions.net/api/health` (every 5 minutes)

## Testing

Test the scheduled jobs manually:

```bash
# Test reindex
gcloud scheduler jobs run weekly-reindex

# Test health check
gcloud scheduler jobs run health-check
```

## Monitoring

View job execution history:
- Google Cloud Console → Cloud Scheduler → Job → View logs
- Check for failures and set up alerts

