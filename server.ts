import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import { Client, GatewayIntentBits } from 'discord.js';
import { createServer as createViteServer } from 'vite';

// --- Discord Credentials ---
const DISCORD_TOKEN = 'MTQyODM4NTQxMzQzNzA2MzQwMA.G2iofR.4I9BBl3bBfxI7nvUPYk2ZW5qpKAWAOStFJvgNI';
const DISCORD_GUILD_ID = '1501197628292206662';
const DISCORD_VERIFIED_ROLE_ID = '1501870636786778153';
const DISCORD_CLIENT_ID = '1428385413437063400';
const DISCORD_CLIENT_SECRET = '5Qw3h78kwqVGG99QpFjhF_4CPsU8-5Dx';

// --- Other Configs ---
const JWT_SECRET = 'your_super_secret_key_change_this'; // इसे सुरक्षित रखें
const PORT = process.env.PORT || 3000;

async function startServer() {
  const app = express();
  
  // Discord Bot Client Setup
  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
  await client.login(DISCORD_TOKEN);
  console.log('Discord Bot is online!');

  // OAuth Callback Route (As per your snippet)
  app.get('/auth/callback', async (req, res) => {
    try {
      // यहाँ आपका Google OAuth Logic आएगा...
      res.send(getAuthSuccessHtml());
    } catch (error) {
      console.error('Google OAuth Error:', error);
      res.status(500).send('Authentication failed');
    }
  });

  function getAuthSuccessHtml() {
    return `
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `;
  }

  app.get('/api/user/me', (req, res) => {
    // @ts-ignore (Assuming cookies are parsed via cookie-parser)
    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      res.json(decoded);
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  app.post('/api/user/logout', (req, res) => {
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    res.json({ success: true });
  });

  app.post('/api/verify', async (req, res) => {
    // @ts-ignore
    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const userId = decoded.id; // सुनिश्चित करें कि JWT में Discord User ID 'id' नाम से है

      if (!DISCORD_GUILD_ID || !DISCORD_VERIFIED_ROLE_ID || !DISCORD_TOKEN) {
        return res.status(500).json({ error: 'Bot or Server not configured correctly' });
      }

      const guild = await client.guilds.fetch(DISCORD_GUILD_ID);
      if (!guild) {
        return res.status(404).json({ error: 'Server not found' });
      }

      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) {
        return res.status(400).json({ error: 'User is not in the server. Please join the server first.' });
      }

      await member.roles.add(DISCORD_VERIFIED_ROLE_ID);
      res.json({ success: true, message: 'Verified successfully!' });
    } catch (err: any) {
      console.error('Verification Error:', err);
      res.status(500).json({ error: err.message || 'Verification failed' });
    }
  });

  // Vite Middleware (Dev vs Production)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
