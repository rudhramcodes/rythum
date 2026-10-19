const BRAND = {
  name: 'RYTHUM SHASTRI',
  domain: 'https://rythumshastri.com',
  palette: {
    ground: '#101110',
    card: '#181c15',
    cardInner: '#131610',
    border: '#30332e',
    accent: '#cfdb9d',
    accentText: '#15180e',
    ink: '#eeefeb',
    muted: '#a1a59e',
    subtle: '#686e63',
  },
};

function formatDate(dateString) {
  if (!dateString) return 'To be decided';
  try {
    const d = new Date(`${dateString}T12:00:00`);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateString;
  }
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderCustomerEmail(inquiry, portalUrl = `${BRAND.domain}/portal`) {
  const name = escapeHtml(inquiry.name || 'there');
  const reference = escapeHtml(inquiry.reference);
  const eventType = escapeHtml(inquiry.eventType || 'Live performance');
  const city = escapeHtml(inquiry.city || 'To be decided');
  const date = escapeHtml(formatDate(inquiry.date));

  const subject = `Inquiry received · ${reference}`;

  const text = `RYTHUM SHASTRI.\n\nThank you for reaching out, ${inquiry.name || 'there'}.\n\nWe have received your booking inquiry (Reference: ${inquiry.reference}).\n\nEvent: ${inquiry.eventType}\nLocation: ${inquiry.city}\nProposed date: ${formatDate(inquiry.date)}\n\nThis acknowledges receipt only; it does not confirm a booking. Our management team will review availability and details, and get back to you shortly.\n\nExplore Rythum Shastri: ${BRAND.domain}\n\nRythum Shastri & team\nGujarati Folk, Raas-Garba & Contemporary Sufi`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.palette.ground}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${BRAND.palette.ink}; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${BRAND.palette.ground}; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; background-color: ${BRAND.palette.card}; border: 1px solid ${BRAND.palette.border}; border-radius: 12px; overflow: hidden;">
          
          <!-- Brand Header -->
          <tr>
            <td style="padding: 32px 36px 24px; border-bottom: 1px solid ${BRAND.palette.border};">
              <a href="${BRAND.domain}" style="text-decoration: none; font-size: 19px; font-weight: 700; letter-spacing: -0.03em; color: ${BRAND.palette.ink}; font-family: 'Clash Display', Arial, sans-serif; display: inline-block;">
                ${BRAND.name}<span style="color: ${BRAND.palette.accent};">.</span>
              </a>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 36px 28px;">
              <p style="margin: 0 0 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: ${BRAND.palette.accent};">
                Inquiry Received
              </p>
              <h1 style="margin: 0 0 16px; font-size: 28px; line-height: 1.15; font-weight: 600; letter-spacing: -0.025em; color: ${BRAND.palette.ink}; font-family: 'Clash Display', Arial, sans-serif;">
                Let’s make a great night.
              </h1>
              <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.6; color: ${BRAND.palette.muted};">
                Hi ${name}, thank you for reaching out. We have safely received your event inquiry. Our management team will review availability and connect with you shortly.
              </p>

              <!-- Reference Badge Card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${BRAND.palette.cardInner}; border: 1px solid ${BRAND.palette.border}; border-radius: 8px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 18px 22px;">
                    <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: ${BRAND.palette.muted}; margin-bottom: 6px;">Your Inquiry Reference</span>
                    <span style="display: inline-block; font-family: monospace, Courier, sans-serif; font-size: 16px; font-weight: 700; color: ${BRAND.palette.accent}; letter-spacing: 0.05em;">${reference}</span>
                    <span style="display: block; font-size: 12px; color: ${BRAND.palette.subtle}; margin-top: 4px;">Keep this reference handy if you contact our management team.</span>
                  </td>
                </tr>
              </table>

              <!-- Event Details Table -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px; border-top: 1px solid ${BRAND.palette.border};">
                <tr>
                  <td style="padding: 14px 0 6px; font-size: 12px; color: ${BRAND.palette.muted}; text-transform: uppercase; letter-spacing: 0.05em; width: 40%;">Event Type</td>
                  <td style="padding: 14px 0 6px; font-size: 14px; font-weight: 500; color: ${BRAND.palette.ink}; text-align: right;">${eventType}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0 6px; font-size: 12px; color: ${BRAND.palette.muted}; text-transform: uppercase; letter-spacing: 0.05em;">Location</td>
                  <td style="padding: 10px 0 6px; font-size: 14px; font-weight: 500; color: ${BRAND.palette.ink}; text-align: right;">${city}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0 6px; font-size: 12px; color: ${BRAND.palette.muted}; text-transform: uppercase; letter-spacing: 0.05em;">Proposed Date</td>
                  <td style="padding: 10px 0 6px; font-size: 14px; font-weight: 500; color: ${BRAND.palette.ink}; text-align: right;">${date}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0 14px; font-size: 12px; color: ${BRAND.palette.muted}; text-transform: uppercase; letter-spacing: 0.05em;">Status</td>
                  <td style="padding: 10px 0 14px; font-size: 13px; font-weight: 600; color: ${BRAND.palette.accent}; text-align: right;">Awaiting Review</td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="padding-top: 8px;">
                    <a href="${escapeHtml(portalUrl)}" target="_blank" style="display: inline-block; background-color: ${BRAND.palette.accent}; color: ${BRAND.palette.accentText}; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 24px; border-radius: 4px; letter-spacing: -0.01em;">
                      View your inquiry ↗
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 28px 0 0; font-size: 12px; line-height: 1.5; color: ${BRAND.palette.subtle};">
                Your sign-in link expires in 15 minutes. Request a new link from the inquiry portal if needed. Reply through the website. An inquiry is not a confirmed booking.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px 32px; background-color: ${BRAND.palette.ground}; border-top: 1px solid ${BRAND.palette.border}; text-align: left;">
              <p style="margin: 0 0 6px; font-size: 13px; font-weight: 600; color: ${BRAND.palette.ink};">Rythum Shastri</p>
              <p style="margin: 0 0 12px; font-size: 12px; color: ${BRAND.palette.muted};">Gujarati Folk · Raas-Garba · Contemporary Sufi</p>
              <p style="margin: 0; font-size: 11px; color: ${BRAND.palette.subtle};">
                If you did not submit this inquiry, please disregard this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

export function renderTeamEmail(inquiry, adminUrl = `${BRAND.domain}/admin`) {
  const name = escapeHtml(inquiry.name || 'Website Client');
  const email = escapeHtml(inquiry.email || '');
  const phone = escapeHtml(inquiry.phone || 'Not provided');
  const reference = escapeHtml(inquiry.reference);
  const eventType = escapeHtml(inquiry.eventType || 'Live performance');
  const city = escapeHtml(inquiry.city || 'To be decided');
  const date = escapeHtml(formatDate(inquiry.date));
  const details = escapeHtml(inquiry.details || 'No additional notes provided.').replace(/\n/g, '<br>');

  const subject = `⚡ New Booking Inquiry · ${inquiry.name || 'Client'} (${inquiry.eventType}) · ${reference}`;

  const text = `NEW WEBSITE INQUIRY RECEIVED\n\nReference: ${reference}\nClient: ${inquiry.name} (${inquiry.email})\nPhone: ${inquiry.phone || 'None'}\nEvent: ${inquiry.eventType}\nCity: ${inquiry.city}\nDate: ${formatDate(inquiry.date)}\n\nEvent Brief:\n${inquiry.details || 'None'}\n\nRead and reply through the admin inbox on the website.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.palette.ground}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${BRAND.palette.ink}; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${BRAND.palette.ground}; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: ${BRAND.palette.card}; border: 1px solid ${BRAND.palette.border}; border-radius: 12px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 28px 36px 20px; border-bottom: 1px solid ${BRAND.palette.border};">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="font-size: 18px; font-weight: 700; letter-spacing: -0.03em; color: ${BRAND.palette.ink}; font-family: 'Clash Display', Arial, sans-serif;">
                      ${BRAND.name}<span style="color: ${BRAND.palette.accent};">.</span>
                    </span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; background-color: #2b331f; color: ${BRAND.palette.accent}; border: 1px solid #4a5933; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;">
                      New Lead
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 36px 28px;">
              <h2 style="margin: 0 0 8px; font-size: 24px; font-weight: 600; color: ${BRAND.palette.ink}; letter-spacing: -0.02em;">
                Inquiry from ${name}
              </h2>
              <p style="margin: 0 0 24px; font-size: 14px; color: ${BRAND.palette.muted};">
                Submitted through the live booking form on rythumshastri.com.
              </p>

              <!-- Reference Bar -->
              <div style="background-color: ${BRAND.palette.cardInner}; border: 1px solid ${BRAND.palette.border}; border-radius: 6px; padding: 12px 18px; margin-bottom: 24px;">
                <span style="font-size: 12px; color: ${BRAND.palette.muted};">Reference ID: </span>
                <span style="font-family: monospace, Courier, sans-serif; font-size: 14px; font-weight: 700; color: ${BRAND.palette.accent};">${reference}</span>
              </div>

              <!-- Client & Event Info Table -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px; border: 1px solid ${BRAND.palette.border}; border-radius: 8px; overflow: hidden;">
                <tr style="background-color: ${BRAND.palette.cardInner};">
                  <td style="padding: 12px 18px; font-size: 12px; color: ${BRAND.palette.muted}; width: 35%; border-bottom: 1px solid ${BRAND.palette.border};">Client Name</td>
                  <td style="padding: 12px 18px; font-size: 14px; font-weight: 600; color: ${BRAND.palette.ink}; border-bottom: 1px solid ${BRAND.palette.border};">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; font-size: 12px; color: ${BRAND.palette.muted}; border-bottom: 1px solid ${BRAND.palette.border};">Email</td>
                  <td style="padding: 12px 18px; font-size: 14px; color: ${BRAND.palette.accent}; border-bottom: 1px solid ${BRAND.palette.border};">
                    <a href="${escapeHtml(adminUrl)}" style="color: ${BRAND.palette.accent}; text-decoration: none;">${email}</a>
                  </td>
                </tr>
                <tr style="background-color: ${BRAND.palette.cardInner};">
                  <td style="padding: 12px 18px; font-size: 12px; color: ${BRAND.palette.muted}; border-bottom: 1px solid ${BRAND.palette.border};">Phone</td>
                  <td style="padding: 12px 18px; font-size: 14px; color: ${BRAND.palette.ink}; border-bottom: 1px solid ${BRAND.palette.border};">
                    ${inquiry.phone ? `<a href="tel:${phone}" style="color: ${BRAND.palette.ink}; text-decoration: none;">${phone}</a>` : 'Not provided'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; font-size: 12px; color: ${BRAND.palette.muted}; border-bottom: 1px solid ${BRAND.palette.border};">Event Type</td>
                  <td style="padding: 12px 18px; font-size: 14px; font-weight: 600; color: ${BRAND.palette.ink}; border-bottom: 1px solid ${BRAND.palette.border};">${eventType}</td>
                </tr>
                <tr style="background-color: ${BRAND.palette.cardInner};">
                  <td style="padding: 12px 18px; font-size: 12px; color: ${BRAND.palette.muted}; border-bottom: 1px solid ${BRAND.palette.border};">Location</td>
                  <td style="padding: 12px 18px; font-size: 14px; color: ${BRAND.palette.ink}; border-bottom: 1px solid ${BRAND.palette.border};">${city}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; font-size: 12px; color: ${BRAND.palette.muted};">Proposed Date</td>
                  <td style="padding: 12px 18px; font-size: 14px; font-weight: 600; color: ${BRAND.palette.ink};">${date}</td>
                </tr>
              </table>

              <!-- Event Brief Card -->
              <div style="background-color: ${BRAND.palette.cardInner}; border: 1px solid ${BRAND.palette.border}; border-radius: 8px; padding: 18px; margin-bottom: 28px;">
                <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: ${BRAND.palette.muted}; margin-bottom: 8px;">Event Brief & Requirements</span>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${BRAND.palette.ink}; white-space: pre-wrap;">${details}</p>
              </div>

              <!-- Action Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left">
                    <a href="${escapeHtml(adminUrl)}" style="display: inline-block; background-color: ${BRAND.palette.accent}; color: ${BRAND.palette.accentText}; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 24px; border-radius: 4px;">
                      Open admin inbox ↗
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px; background-color: ${BRAND.palette.ground}; border-top: 1px solid ${BRAND.palette.border};">
              <p style="margin: 0; font-size: 12px; color: ${BRAND.palette.subtle}; text-align: center;">
                Rythum Shastri Automated Dispatch System · Live Production
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}
