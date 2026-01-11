import { SMTPServer, SMTPServerAddress, SMTPServerSession } from 'smtp-server';
import { simpleParser, ParsedMail } from 'mailparser';
import { prisma } from '../lib/prisma.js';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SMTP_PORT = parseInt(process.env.SMTP_PORT || '2525', 10);
const SMTP_HOST = process.env.SMTP_HOST || '0.0.0.0';
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

async function findTargetAddress(toAddress: string) {
  const [localPart, domain] = toAddress.toLowerCase().split('@');
  if (!domain) return null;

  // First, try to find exact match
  const exactMatch = await prisma.address.findFirst({
    where: {
      localPart,
      domain: { domain, verified: true },
    },
    include: { domain: true },
  });

  if (exactMatch) return exactMatch;

  // Then, try to find catch-all for this domain
  const catchAll = await prisma.address.findFirst({
    where: {
      catchAll: true,
      domain: { domain, verified: true },
    },
    include: { domain: true },
  });

  return catchAll;
}

async function saveEmail(
  parsedMail: ParsedMail,
  targetAddress: any,
  toAddress: string,
  rawContent: string
) {
  const messageId = parsedMail.messageId || `${Date.now()}-${crypto.randomUUID()}`;

  // Save attachments
  const attachmentData: Array<{
    filename: string;
    contentType: string;
    size: number;
    path: string;
  }> = [];

  if (parsedMail.attachments && parsedMail.attachments.length > 0) {
    for (const attachment of parsedMail.attachments) {
      const filename = attachment.filename || `attachment-${crypto.randomUUID()}`;
      const safeFilename = `${Date.now()}-${crypto.randomUUID()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = path.join(UPLOADS_DIR, safeFilename);

      fs.writeFileSync(filePath, attachment.content);

      attachmentData.push({
        filename: attachment.filename || 'unnamed',
        contentType: attachment.contentType || 'application/octet-stream',
        size: attachment.size || attachment.content.length,
        path: safeFilename,
      });
    }
  }

  // Save email to database
  const email = await prisma.email.create({
    data: {
      messageId,
      fromAddress: parsedMail.from?.value[0]?.address || 'unknown@unknown.com',
      fromName: parsedMail.from?.value[0]?.name || null,
      toAddress,
      subject: parsedMail.subject || '(No Subject)',
      textContent: parsedMail.text || null,
      htmlContent: parsedMail.html || null,
      rawContent,
      addressId: targetAddress.id,
      attachments: {
        create: attachmentData,
      },
    },
    include: { attachments: true },
  });

  console.log(`Email saved: ${email.id} from ${email.fromAddress} to ${toAddress}`);
  return email;
}

export function startSmtpServer() {
  const server = new SMTPServer({
    secure: false,
    authOptional: true,
    disabledCommands: ['AUTH'],
    size: 25 * 1024 * 1024, // 25MB max

    onConnect(session: SMTPServerSession, callback: (err?: Error) => void) {
      console.log(`SMTP Connection from ${session.remoteAddress}`);
      callback();
    },

    onMailFrom(
      address: SMTPServerAddress,
      session: SMTPServerSession,
      callback: (err?: Error) => void
    ) {
      console.log(`Mail from: ${address.address}`);
      callback();
    },

    async onRcptTo(
      address: SMTPServerAddress,
      session: SMTPServerSession,
      callback: (err?: Error) => void
    ) {
      console.log(`Recipient: ${address.address}`);

      try {
        const targetAddress = await findTargetAddress(address.address);
        if (!targetAddress) {
          console.log(`Rejected: No matching address for ${address.address}`);
          return callback(new Error('Mailbox not found'));
        }

        // Store target address in session for later use
        (session as any).targetAddress = targetAddress;
        (session as any).toAddress = address.address;
        callback();
      } catch (error) {
        console.error('Error checking recipient:', error);
        callback(new Error('Internal error'));
      }
    },

    async onData(
      stream: Readable,
      session: SMTPServerSession,
      callback: (err?: Error) => void
    ) {
      try {
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(chunk as Buffer);
        }
        const rawContent = Buffer.concat(chunks).toString('utf-8');

        const parsedMail = await simpleParser(rawContent);
        const targetAddress = (session as any).targetAddress;
        const toAddress = (session as any).toAddress;

        if (targetAddress) {
          await saveEmail(parsedMail, targetAddress, toAddress, rawContent);
        }

        callback();
      } catch (error) {
        console.error('Error processing email:', error);
        callback(new Error('Error processing email'));
      }
    },

    onClose(session: SMTPServerSession) {
      console.log(`Connection closed from ${session.remoteAddress}`);
    },
  });

  server.on('error', (err: Error) => {
    console.error('SMTP Server error:', err);
  });

  server.listen(SMTP_PORT, SMTP_HOST, () => {
    console.log(`SMTP server running on ${SMTP_HOST}:${SMTP_PORT}`);
  });

  return server;
}
