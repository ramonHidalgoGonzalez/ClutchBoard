# Riot RSO Approval Checklist

Status: pre-approval pending

## Riot portal submission fields

- Privacy Policy URL: https://clutchboard-alpha-ten.vercel.app/privacy
- Terms of Service URL: https://clutchboard-alpha-ten.vercel.app/terms
- Redirect URI: https://clutchboard-alpha-ten.vercel.app/api/auth/riot/callback
- Post-logout Redirect URI: https://clutchboard-alpha-ten.vercel.app/login
- App ID: 6-digit ID from the same production application

## App requirements

- Opt-in disclaimer is visible on login.
- Only registered/consented players are shown to others.
- Legal pages are public and accessible without login.

## Environment requirements

- ENABLE_MOCK_RIOT=false
- NEXT_PUBLIC_APP_URL=https://clutchboard-alpha-ten.vercel.app
- RIOT_API_KEY=<current key>
- RIOT_RSO_CLIENT_ID=<pending approval>
- RIOT_RSO_CLIENT_SECRET=<pending approval>
- RIOT_RSO_REDIRECT_URI=https://clutchboard-alpha-ten.vercel.app/api/auth/riot/callback
- RIOT_REGION=europe
- RIOT_PLATFORM=eu

## After Riot approves RSO

- Paste RIOT_RSO_CLIENT_ID and RIOT_RSO_CLIENT_SECRET in environment.
- Restart app.
- Test full flow: /login -> Riot authorize -> /api/auth/riot/callback -> dashboard.
- Verify API health at /api/health.

## Security reminders

- Never commit real keys/secrets.
- Rotate any key that was exposed in terminal logs.
