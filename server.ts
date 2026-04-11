import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import { Telegraf, Markup } from 'telegraf';
import axios from 'axios';
import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, limit, deleteDoc, doc } from 'firebase/firestore';

dotenv.config();

// Initialize Firebase for Backend
let db: any;
try {
  const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));
  const firebaseApp = initializeApp(firebaseConfig);
  db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
  console.log('Firebase initialized in backend');
} catch (error) {
  console.error('Failed to initialize Firebase in backend:', error);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure Multer for local storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ storage });

  app.use(express.json());
  
  // Telegram Bot Setup
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  let telegramApiUrl = process.env.TELEGRAM_API_URL || 'https://api.telegram.org';
  
  // Robust URL validation and sanitization
  try {
    if (telegramApiUrl && !telegramApiUrl.startsWith('http')) {
      telegramApiUrl = `http://${telegramApiUrl}`;
    }
    // Remove trailing slash
    telegramApiUrl = telegramApiUrl.replace(/\/$/, '');
    // Test if it's a valid URL
    new URL(telegramApiUrl);
  } catch (e) {
    console.warn('Invalid TELEGRAM_API_URL, falling back to default:', telegramApiUrl);
    telegramApiUrl = 'https://api.telegram.org';
  }

  if (botToken) {
    try {
      const botOptions: any = {};
      // Only set apiRoot if it's not the default Telegram API
      if (telegramApiUrl !== 'https://api.telegram.org') {
        botOptions.telegram = { apiRoot: telegramApiUrl };
      }

      const bot = new Telegraf(botToken, botOptions);

      bot.on('video', async (ctx) => {
        // Only process videos from the authorized channel or admin
        const chatId = ctx.chat.id.toString();
        const authorizedChannelId = process.env.TELEGRAM_CHANNEL_ID;
        
        const fileId = ctx.message.video.file_id;
        const fileName = (ctx.message.video as any).file_name || 'Untitled Video';
        
        // Save to Queue if DB is ready
        if (db) {
          try {
            await addDoc(collection(db, 'telegram_queue'), {
              fileId,
              fileName,
              createdAt: serverTimestamp(),
              source: 'direct_bot',
              chatId
            });
          } catch (e) {
            console.error('Error saving to telegram_queue:', e);
          }
        }

        ctx.reply(`✅ Video qabul qilindi!\n\nFile ID: ${fileId}\n\nUshbu ID dan Admin panelda foydalanishingiz mumkin.`);
      });

      // Public bot response for users
      const publicResponse = (ctx: any) => {
        return ctx.reply(
          "Ushbu bot foydalanuvchilar uchun emas. Animelarni tomosha qilish uchun platformamizga tashrif buyuring:",
          Markup.inlineKeyboard([
            [Markup.button.url("MeteorDub.uz", "https://meteordub.uz")]
          ])
        );
      };

      bot.start(publicResponse);
      
      bot.on('message', (ctx, next) => {
        if ((ctx.message as any).video) return next();
        return publicResponse(ctx);
      });

      // Handle channel posts for automatic mapping
      bot.on('channel_post', async (ctx) => {
        const post = ctx.channelPost as any;
        if (post.video) {
          const fileId = post.video.file_id;
          const fileName = post.video.file_name || 'Channel Video';
          const chatId = ctx.chat.id;
          const messageId = post.message_id;
          
          // Construct post link
          let postUrl = `https://t.me/c/${chatId.toString().replace('-100', '')}/${messageId}`;
          if (ctx.chat.type === 'channel' && (ctx.chat as any).username) {
            postUrl = `https://t.me/${(ctx.chat as any).username}/${messageId}`;
          }

          if (db) {
            try {
              await addDoc(collection(db, 'telegram_queue'), {
                fileId,
                fileName,
                postUrl,
                createdAt: serverTimestamp(),
                source: 'channel_post'
              });
              console.log(`Saved channel post to queue: ${postUrl}`);
            } catch (e) {
              console.error('Error saving channel post to queue:', e);
            }
          }
        }
      });

      bot.launch().then(() => {
        console.log(`Telegram Bot is running using API: ${telegramApiUrl}`);
      }).catch(err => {
        console.error('Telegram Bot failed to start:', err.message);
      });
    } catch (error) {
      console.error('Error initializing Telegram Bot:', error instanceof Error ? error.message : String(error));
    }
  } else {
    console.warn('TELEGRAM_BOT_TOKEN not found. Telegram features will be disabled.');
  }

  // Telegram Video Proxy
  app.get('/api/video/telegram/:fileId', async (req, res) => {
    if (!botToken) return res.status(500).send('Telegram Bot not configured');
    
    const { fileId } = req.params;
    try {
      // Get file path from Telegram (Local or Remote)
      const fileResponse = await axios.get(`${telegramApiUrl}/bot${botToken}/getFile?file_id=${fileId}`);
      const filePath = fileResponse.data.result.file_path;
      
      // Construct the file download URL
      // Local Bot API server serves files at /file/bot<token>/<file_path>
      const fileUrl = `${telegramApiUrl}/file/bot${botToken}/${filePath}`;

      // Stream the file
      const response = await axios({
        method: 'get',
        url: fileUrl,
        responseType: 'stream'
      });

      res.setHeader('Content-Type', 'video/mp4');
      response.data.pipe(res);
    } catch (error) {
      console.error('Error proxying Telegram video:', error);
      res.status(500).send('Error fetching video from Telegram. Note: Bot API has a 20MB limit.');
    }
  });

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadsDir));

  // API Routes
  app.post('/api/upload', upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
    { name: 'storyMedia', maxCount: 1 },
    { name: 'storyThumbnail', maxCount: 1 }
  ]), (req, res) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    const response: any = {};
    if (files.video) response.videoUrl = `/uploads/${files.video[0].filename}`;
    if (files.thumbnail) response.thumbnailUrl = `/uploads/${files.thumbnail[0].filename}`;
    if (files.storyMedia) response.storyMediaUrl = `/uploads/${files.storyMedia[0].filename}`;
    if (files.storyThumbnail) response.storyThumbnailUrl = `/uploads/${files.storyThumbnail[0].filename}`;

    res.json(response);
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Story Cleanup Task (runs every hour)
  setInterval(async () => {
    if (!db) return;
    console.log('Running story cleanup task...');
    try {
      const now = Date.now();
      const q = query(collection(db, 'stories'), where('expiresAt', '<=', now));
      const snapshot = await getDocs(q);
      
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'stories', d.id)));
      await Promise.all(deletePromises);
      if (snapshot.size > 0) {
        console.log(`Cleaned up ${snapshot.size} expired stories.`);
      }
    } catch (error) {
      console.error('Error in story cleanup task:', error);
    }
  }, 60 * 60 * 1000);

  // API to resolve Telegram Link to File ID
  app.get('/api/telegram/resolve', async (req, res) => {
    const { url } = req.query;
    if (!url || !db) return res.status(400).json({ error: 'URL or DB missing' });

    try {
      const q = query(
        collection(db, 'telegram_queue'), 
        where('postUrl', '==', url),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return res.status(404).json({ error: 'Video not found in queue. Make sure the bot is an admin in the channel and the video was posted after the bot was added.' });
      }
      const data = snapshot.docs[0].data();
      res.json({ fileId: data.fileId });
    } catch (error) {
      console.error('Error resolving telegram link:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
