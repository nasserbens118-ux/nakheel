import { NextRequest, NextResponse } from 'next/server';

// POST /api/send-email
// Body: { to: string, subject: string, html: string }
// Requires RESEND_API_KEY env var. Returns 200 on success, 200 (silent) when not configured.
export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.startsWith('re_xxx')) {
    // Silently succeed in demo / unconfigured environments
    return NextResponse.json({ ok: true, skipped: true });
  }

  const { to, subject, html } = await req.json();
  if (!to || !subject || !html) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
  const fromName  = process.env.RESEND_FROM_NAME  ?? 'GourFeed';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[send-email] Resend error:', err);
    // Still return 200 — email failure is non-blocking
    return NextResponse.json({ ok: false, error: err });
  }

  return NextResponse.json({ ok: true });
}
