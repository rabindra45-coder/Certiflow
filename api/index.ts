import express from 'express';
import nodemailer from 'nodemailer';
import { setStore, getStore, all } from '../server/db';

const app = express();

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Helper to safely resolve SMTP security mode:
function resolveSmtpSecurity(port: number | string, secure?: boolean): boolean {
  const portNum = Number(port);
  if (portNum === 465) {
    return true;
  }
  if (portNum === 587 || portNum === 25) {
    return false;
  }
  return Boolean(secure);
}

// API health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// DB Store APIs
app.get('/api/store/all', async (_req, res) => {
  try {
    const rows = await all('SELECT key, value FROM store');
    const data: Record<string, any> = {};
    rows.forEach(r => {
      try {
        data[r.key] = JSON.parse(r.value);
      } catch {
        data[r.key] = r.value;
      }
    });
    res.json({ success: true, data });
  } catch (err: any) {
    res.json({ success: false, message: err.message || 'Store fetch failed' });
  }
});

app.post('/api/store', async (req, res) => {
  try {
    const { key, value } = req.body || {};
    if (!key) return res.status(400).json({ success: false, message: 'Missing key' });
    await setStore(key, JSON.stringify(value));
    res.json({ success: true });
  } catch (err: any) {
    res.json({ success: false, message: err.message || 'Store write failed' });
  }
});

// SMTP Verification Handshake API
app.post('/api/smtp/verify', async (req, res) => {
  try {
    const { host, port, secure, user, pass, ignoreTls } = req.body || {};

    if (!host || !port) {
      return res.status(400).json({
        success: false,
        message: 'Missing SMTP Host or Port.'
      });
    }

    const portNum = Number(port);
    const isSecure = resolveSmtpSecurity(portNum, secure);

    const hostLower = String(host || '').toLowerCase();
    const isMajorProvider =
      hostLower.includes('gmail') ||
      hostLower.includes('google') ||
      hostLower.includes('office365') ||
      hostLower.includes('outlook') ||
      hostLower.includes('sendgrid') ||
      hostLower.includes('mailgun') ||
      hostLower.includes('amazonaws');

    if (isMajorProvider && (!user || !pass)) {
      return res.status(200).json({
        success: false,
        message: `Authentication required for ${host}. Please enter username and password / app password.`,
        details: { latencyMs: 0, code: 'AUTH_REQUIRED' }
      });
    }

    const startTime = Date.now();

    const transportConfig: any = {
      host: String(host).trim(),
      port: portNum,
      secure: isSecure,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: !Boolean(ignoreTls)
      }
    };

    if (user && pass) {
      transportConfig.auth = {
        user: String(user).trim(),
        pass: String(pass).trim()
      };
    }

    const transporter = nodemailer.createTransport(transportConfig);
    await transporter.verify();
    const latencyMs = Date.now() - startTime;

    return res.json({
      success: true,
      message: `250 OK: Connected to ${host}:${portNum} successfully (${latencyMs}ms latency). Authentication verified.`,
      details: {
        host,
        port: portNum,
        secure: isSecure,
        latencyMs
      }
    });
  } catch (err: any) {
    let errMsg = err?.message || 'SMTP Handshake verification failed.';

    if (errMsg.includes('EAUTH') || errMsg.includes('Invalid login') || errMsg.includes('535')) {
      errMsg = 'Authentication failed (535): Invalid username or password/app password.';
    } else if (errMsg.includes('ETIMEDOUT') || errMsg.includes('ESOCKETTIMEDOUT')) {
      errMsg = `Connection timed out connecting to ${req.body?.host || 'server'}:${req.body?.port || ''}. Verify host and port.`;
    } else if (errMsg.includes('ECONNREFUSED')) {
      errMsg = `Connection refused at ${req.body?.host || 'server'}:${req.body?.port || ''}.`;
    } else if (errMsg.includes('wrong version number') || errMsg.includes('SSL routines')) {
      errMsg = `TLS/SSL Mismatch: Port ${req.body?.port} expected STARTTLS (secure: false).`;
    }

    return res.status(200).json({
      success: false,
      message: errMsg,
      details: {
        host: req.body?.host,
        port: req.body?.port,
        latencyMs: 0
      }
    });
  }
});

// SMTP Send Test
app.post('/api/smtp/send-test', async (req, res) => {
  try {
    const { config, recipientEmail, subject } = req.body || {};

    if (!config?.host || !config?.port) {
      return res.status(400).json({ success: false, message: 'Missing SMTP configuration.' });
    }
    if (!recipientEmail) {
      return res.status(400).json({ success: false, message: 'Missing recipient email address.' });
    }

    const portNum = Number(config.port);
    const isSecure = resolveSmtpSecurity(portNum, config.secure);

    const transportConfig: any = {
      host: String(config.host).trim(),
      port: portNum,
      secure: isSecure,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: !Boolean(config.ignoreTls)
      }
    };

    if (config.user && config.pass) {
      transportConfig.auth = {
        user: String(config.user).trim(),
        pass: String(config.pass).trim()
      };
    }

    const transporter = nodemailer.createTransport(transportConfig);

    const info = await transporter.sendMail({
      from: `"${config.fromName || 'CertiFlow System'}" <${config.fromEmail || config.user || 'no-reply@certiflow.app'}>`,
      to: recipientEmail,
      subject: subject || 'CertiFlow SMTP Dispatch Verification',
      text: `Hello!\n\nThis is a real live SMTP verification email sent from CertiFlow.\n\nServer: ${config.host}:${portNum}\nTimestamp: ${new Date().toLocaleString()}\n\nYour SMTP server configuration is verified and ready!`,
      html: `<div style="font-family: sans-serif; padding: 20px; color: #1e293b;"><h2 style="color: #4f46e5;">CertiFlow Live Verification Successful!</h2><p>Your SMTP mail server <strong>${config.host}:${portNum}</strong> is authenticated and actively dispatching emails.</p><p style="font-size: 12px; color: #64748b;">Timestamp: ${new Date().toISOString()}</p></div>`
    });

    return res.json({
      success: true,
      message: `Email dispatched successfully! Message ID: ${info.messageId || 'sent'}`,
      details: { messageId: info.messageId, response: info.response }
    });
  } catch (err: any) {
    return res.status(200).json({
      success: false,
      message: err?.message || 'Failed to dispatch test email.'
    });
  }
});

// SMTP Send Certificate
app.post('/api/smtp/send-certificate', async (req, res) => {
  try {
    const { config, recipientEmail, recipientName, subject, text, html, pdfBase64, filename } = req.body || {};

    if (!config?.host || !config?.port) {
      return res.status(400).json({ success: false, message: 'Missing SMTP configuration.' });
    }

    const portNum = Number(config.port);
    const isSecure = resolveSmtpSecurity(portNum, config.secure);

    const transportConfig: any = {
      host: String(config.host).trim(),
      port: portNum,
      secure: isSecure,
      connectionTimeout: 12000,
      tls: {
        rejectUnauthorized: !Boolean(config.ignoreTls)
      }
    };

    if (config.user && config.pass) {
      transportConfig.auth = {
        user: String(config.user).trim(),
        pass: String(config.pass).trim()
      };
    }

    const transporter = nodemailer.createTransport(transportConfig);

    const attachments = [];
    if (pdfBase64) {
      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      attachments.push({
        filename: filename || 'Certificate.pdf',
        content: Buffer.from(cleanBase64, 'base64'),
        contentType: 'application/pdf'
      });
    }

    const info = await transporter.sendMail({
      from: `"${config.fromName || 'CertiFlow System'}" <${config.fromEmail || config.user || 'no-reply@certiflow.app'}>`,
      to: `"${recipientName || 'Recipient'}" <${recipientEmail}>`,
      subject: subject || 'Your Official Institutional Certificate',
      text: text || 'Please find your official certificate attached.',
      html: html || `<p>Please find your official certificate attached.</p>`,
      attachments
    });

    return res.json({
      success: true,
      message: `Certificate dispatched to ${recipientEmail}`,
      messageId: info.messageId
    });
  } catch (err: any) {
    return res.status(200).json({
      success: false,
      message: err?.message || 'Failed to dispatch certificate email.'
    });
  }
});

// Global fallback error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled API Error:', err);
  res.status(200).json({
    success: false,
    message: err?.message || 'An unexpected server error occurred.'
  });
});

export default app;
