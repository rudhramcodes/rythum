import { z } from 'zod';

export const eventTypes = ['Navratri / Garba', 'Concert / Festival', 'Wedding / Sangeet', 'Private / Corporate event', 'Studio collaboration'];
const text = max => z.string().trim().min(1, 'Please fill out this field.').max(max, `Use ${max} characters or fewer.`);
const timezone = z.string().max(100).refine(value => {
  try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; }
}, 'Choose a valid timezone.');

export function inquirySchema(now = new Date()) {
  return z.object({
    name: z.string({ error: 'Please enter your name or organisation.' })
      .trim()
      .min(1, 'Please enter your name or organisation.')
      .max(120, 'Name must be 120 characters or fewer.'),
    email: z.string({ error: 'Please enter your email address.' })
      .trim()
      .email('Please enter a valid email address (e.g. name@example.com).')
      .max(254, 'Email must be 254 characters or fewer.')
      .transform(value => value.toLowerCase()),
    phone: z.string().trim().max(40, 'Phone number must be 40 characters or fewer.').default(''),
    eventType: z.enum(eventTypes, { error: 'Please select a valid event type.' }),
    city: z.string({ error: 'Please enter the event city and country.' })
      .trim()
      .min(1, 'Please enter the event city and country.')
      .max(160, 'City must be 160 characters or fewer.'),
    date: z.string().default(''),
    timezone,
    details: z.string({ error: 'Please share some details about your event.' })
      .trim()
      .min(1, 'Please share some details about your event.')
      .max(5000, 'Details must be 5000 characters or fewer.'),
    website: z.literal('').default(''),
  }).strict().superRefine((value, ctx) => {
    if (!value.date) return;
    const date = new Date(`${value.date}T12:00:00Z`);
    const valid = /^\d{4}-\d{2}-\d{2}$/.test(value.date) && !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value.date;
    if (!valid) {
      ctx.addIssue({ code: 'custom', path: ['date'], message: 'Choose a valid date.' });
      return;
    }
    // Event dates are calendar dates, not UTC instants. Use the submitter's IANA timezone.
    let today;
    try { today = new Intl.DateTimeFormat('en-CA', { timeZone: value.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now); }
    catch { return; }
    if (value.date < today) ctx.addIssue({ code: 'custom', path: ['date'], message: 'Please choose today or a future date.' });
  });
}

export const idempotencySchema = z.uuid();

export class ApiError extends Error {
  constructor(status, code, message, fields = null, reference = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.reference = reference;
  }
}

