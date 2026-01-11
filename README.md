# Flymail

A modern, self-hosted email receiving system with custom domain support. Built with React, Node.js, and a clean shadcn/ui interface.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)

## Features

- **Custom Domain Support** - Add your own domains and receive emails at any address
- **MX Record Verification** - Automatic DNS verification for domain setup
- **Catch-all Addresses** - Create wildcard addresses to capture all emails for a domain
- **Modern UI** - Clean, responsive interface built with shadcn/ui
- **Dark Mode** - Full dark/light theme support
- **Real-time Updates** - Instant email notifications
- **Attachment Support** - Handle email attachments seamlessly
- **Search & Filter** - Quickly find emails with powerful search

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- TailwindCSS + shadcn/ui
- TanStack Query
- Zustand
- React Router

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- SQLite
- smtp-server + mailparser
- JWT Authentication

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/GtxFury/flymail.git
cd flymail

# Install dependencies
pnpm install

# Set up environment variables
cp packages/server/.env.example packages/server/.env

# Initialize the database
cd packages/server
pnpm exec prisma db push
cd ..

# Start development servers
pnpm dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **API Server**: http://localhost:3001
- **SMTP Server**: localhost:2525

## Configuration

### Environment Variables

Create a `.env` file in `packages/server/`:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="file:./flymail.db"

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# SMTP
SMTP_PORT=2525
SMTP_HOST=0.0.0.0

# Your mail server hostname (for MX records)
MX_HOSTNAME=mail.yourdomain.com
```

### Domain Setup

1. Add your domain in the Flymail dashboard
2. Configure your DNS with the provided MX record:
   ```
   Type: MX
   Host: @
   Value: mail.yourdomain.com
   Priority: 10
   ```
3. Click "Verify" to confirm the DNS configuration
4. Create email addresses for your domain

## Project Structure

```
flymail/
├── packages/
│   ├── web/                    # Frontend React application
│   │   ├── src/
│   │   │   ├── components/     # UI components
│   │   │   │   └── ui/         # shadcn/ui components
│   │   │   ├── pages/          # Page components
│   │   │   ├── stores/         # Zustand stores
│   │   │   ├── lib/            # Utilities and API client
│   │   │   └── hooks/          # Custom React hooks
│   │   └── package.json
│   │
│   └── server/                 # Backend Express application
│       ├── src/
│       │   ├── routes/         # API route handlers
│       │   ├── middleware/     # Express middleware
│       │   ├── smtp/           # SMTP server implementation
│       │   └── lib/            # Shared utilities
│       ├── prisma/             # Database schema
│       └── package.json
│
├── package.json                # Root package.json
└── pnpm-workspace.yaml         # Monorepo configuration
```

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login and get token |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/password` | Update password |

### Domains

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/domains` | List all domains |
| POST | `/api/domains` | Add new domain |
| POST | `/api/domains/:id/verify` | Verify MX record |
| DELETE | `/api/domains/:id` | Delete domain |

### Addresses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/addresses` | List all addresses |
| POST | `/api/addresses` | Create address |
| DELETE | `/api/addresses/:id` | Delete address |

### Emails

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/emails` | List emails (with pagination) |
| GET | `/api/emails/:id` | Get email details |
| PATCH | `/api/emails/:id` | Update email (read/starred) |
| DELETE | `/api/emails/:id` | Delete email |

## Deployment

### Production Build

```bash
# Build both frontend and backend
pnpm build

# Start production server
cd packages/server
node dist/index.js
```

### Docker (Coming Soon)

```dockerfile
# Dockerfile example will be added
```

### Important Notes

1. **SMTP Port**: Production mail servers typically use port 25. You may need root privileges or port forwarding.

2. **SSL/TLS**: For production, configure SSL certificates for secure email transmission.

3. **Reverse Proxy**: Use Nginx or Caddy to handle HTTPS for the web interface.

4. **Firewall**: Ensure ports 25 (SMTP), 443 (HTTPS), and your API port are accessible.

## Development

```bash
# Run backend only
pnpm dev:server

# Run frontend only
pnpm dev:web

# Run both
pnpm dev

# Database management
cd packages/server
pnpm exec prisma studio    # Open database GUI
pnpm exec prisma db push   # Push schema changes
```

## Testing Email Reception

You can test email reception locally using tools like `swaks`:

```bash
# Install swaks (Simple Web Application Key Simulator)
# On macOS: brew install swaks
# On Ubuntu: apt install swaks

# Send a test email
swaks --to test@yourdomain.com \
      --from sender@example.com \
      --server localhost \
      --port 2525 \
      --header "Subject: Test Email" \
      --body "This is a test email"
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Prisma](https://prisma.io/) - Next-generation ORM
- [smtp-server](https://nodemailer.com/extras/smtp-server/) - SMTP server implementation
