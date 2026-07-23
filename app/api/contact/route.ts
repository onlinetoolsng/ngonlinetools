// 📁 app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabasePublicClient } from '@/lib/supabase/client'

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(200),
  email: z.string().trim().email('Please enter a valid email address').max(200),
  topic: z.enum(['general', 'privacy', 'bug', 'partnership']).default('general'),
  message: z.string().trim().min(10, 'Message is too short').max(5000),
  // Honeypot field — real users never fill this in. Bots that auto-fill every
  // input on the page will, so a non-empty value is a cheap spam signal.
  company: z.string().max(0).optional().or(z.literal('')),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Invalid submission'
    return NextResponse.json({ error: firstError }, { status: 400 })
  }

  // Honeypot tripped — pretend success so bots don't learn to adapt.
  if (parsed.data.company) {
    return NextResponse.json({ ok: true })
  }

  try {
    const supabase = createSupabasePublicClient()
    const { error } = await supabase.from('contact_submissions').insert({
      name: parsed.data.name,
      email: parsed.data.email,
      topic: parsed.data.topic,
      message: parsed.data.message,
      user_agent: request.headers.get('user-agent') ?? null,
      page_path: request.headers.get('referer') ?? null,
    })

    if (error) {
      console.error('Contact form insert failed:', error.message)
      return NextResponse.json(
        { error: 'Something went wrong on our end. Please try again or email us directly.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Contact form error:', err)
    return NextResponse.json(
      { error: 'Something went wrong on our end. Please try again or email us directly.' },
      { status: 500 }
    )
  }
}
