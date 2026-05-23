const express = require('express');
const http = require('http');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const officeParser = require('officeparser'); 
require('dotenv').config();
const Groq = require("groq-sdk");

// Handlers
const registerRoomHandlers = require('./socketHandlers/roomHandler');
const { rooms } = require('./socketHandlers/roomHandler');
const registerPlayerHandlers = require('./socketHandlers/playerHandler');

const port = 3002;
const app = express();

// --- CORS FIX ---
// If you use origin: "*", you CANNOT use credentials: true. 
// I have set credentials to false to prevent the crash.
app.use(cors({
    origin: "*", 
    methods: ["GET", "POST"],
    credentials: false 
}));
app.use(express.json());

// --- 1. SMART DOCUMENT LOADER (CHUNKING) ---
let allChunks = []; 
const docsPath = path.join(__dirname, 'documents');

const loadStaticDocuments = async () => {
    if (!fs.existsSync(docsPath)) {
        fs.mkdirSync(docsPath);
        return;
    }

    console.log("--- 📚 LOADING & CHUNKING DOCUMENTS ---");
    const files = fs.readdirSync(docsPath);
    
    for (const file of files) {
        const filePath = path.join(docsPath, file);
        try {
            if (file.startsWith('~$')) continue;

            let content = "";
            if (file.endsWith('.txt')) {
                content = fs.readFileSync(filePath, 'utf-8');
            } 
            else if (file.endsWith('.pptx') || file.endsWith('.docx') || file.endsWith('.pdf')) {
                console.log(`⏳ Parsing: ${file}...`);
                content = await officeParser.parseOfficeAsync(filePath);
            }

            if (content) {
                const cleanText = content.replace(/\s+/g, ' ').trim();
                const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
                
                let currentChunk = "";
                
                sentences.forEach((sentence) => {
                    if (currentChunk.length + sentence.length < 800) {
                        currentChunk += sentence + " ";
                    } else {
                        allChunks.push({ source: file, text: currentChunk.trim() });
                        currentChunk = sentence + " ";
                    }
                });
                if (currentChunk.length > 20) {
                    allChunks.push({ source: file, text: currentChunk.trim() });
                }
                
                console.log(`✅ Loaded: ${file} (${allChunks.length} total chunks so far)`);
            }
        } catch (err) {
            console.error(`❌ Failed to read ${file}:`, err.message);
        }
    }
    console.log(`--- 🏁 SYSTEM READY: ${allChunks.length} searchable chunks ---`);
};

loadStaticDocuments();

// --- 2. SEARCH FUNCTION ---
const findRelevantContext = (query) => {
    if (allChunks.length === 0) return "";

    const queryWords = query.toLowerCase().split(' ').filter(w => w.length > 3);
    
    const scoredChunks = allChunks.map(chunk => {
        let score = 0;
        const textLower = chunk.text.toLowerCase();
        queryWords.forEach(word => {
            if (textLower.includes(word)) score += 1;
        });
        return { ...chunk, score };
    });

    const topChunks = scoredChunks
        .sort((a, b) => b.score - a.score)
        .filter(chunk => chunk.score > 0)
        .slice(0, 5);

    if (topChunks.length === 0) return "";

    return topChunks.map(c => `[From ${c.source}]: ${c.text}`).join("\n\n");
};

// --- 3. CONFIGURATION ---
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const httpServer = http.createServer(app);

// Socket Setup
const io = new Server(httpServer, { 
    cors: { 
        origin: "*",
        methods: ["GET", "POST"]
    } 
});

// --- 4. SOCKET LOGIC ---
const onConnection = (socket) => {
    console.log(`A user connected: ${socket.id}`);
    registerRoomHandlers(io, socket);
    registerPlayerHandlers(io, socket);

    // --- AUDIO HANDLERS ---
    
    // 1. Join Voice
    socket.on('join-voice', (requestedRoom) => {
        const roomName = requestedRoom || socket.roomName; 

        if (!roomName || !rooms[roomName]) {
            console.log(`Audio Error: User ${socket.id} tried to join non-existent room: ${roomName}`);
            return;
        }

        socket.roomName = roomName;

        const otherPlayers = Object.keys(rooms[roomName]).filter(id => id !== socket.id);
        socket.emit('all-voice-peers', { peerIds: otherPlayers });
        socket.to(roomName).emit('new-voice-peer', { peerId: socket.id });
    });

    // 2. Relay Signals
    // ERROR WAS HERE: You had "const io = new Server..." again. I removed it.
    socket.on('relay-audio-signal', (payload) => {
        io.to(payload.to).emit('audio-signal-received', {
            from: socket.id,
            signal: payload.signal
        });
    });
    
    // 3. Leave Voice
    socket.on('leave-voice', () => {
        const roomName = socket.roomName;
        if (!roomName) return;
        socket.to(roomName).emit('peer-left-voice', { peerId: socket.id }); 
    });
    
    socket.on('disconnect', () => {
        const roomName = socket.roomName;
        if (roomName && rooms[roomName]) {
             socket.to(roomName).emit('peer-left-voice', { peerId: socket.id });
        }
    });
};
io.on('connection', onConnection);

// --- 5. SMART API ROUTE ---
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    console.log(`Student asked: "${message}"`);

    try {
        const relevantInfo = findRelevantContext(message);
        console.log("🔍 Found Context Length:", relevantInfo.length, "chars");

        const SYSTEM_INSTRUCTION = `
You are a strict AI Tutor.
I have searched the course materials and found this relevant info:
"""
${relevantInfo || "No direct match in documents."}
"""

INSTRUCTIONS:
1. Search the course materials first. If answer found there use it and answer confidently and cite the answer in which document.
2. Do NOT use outside knowledge to invent facts about specific course logistics (like exam dates or policies).
3. If the question is purely academic (e.g. "What is gravity?") and not in the docs, you MAY answer it, but keep it brief. And if not academic say "Sorry i can only answer questions based on the course materials provided."
4. If academic and answerable, provide a concise answer in 2-3 sentences starting with "Couldn't find exact match, but based on what I know: ".
5. Keep it concise (under 2 sentences) as you are speaking out loud.
6. If the questions asked is in all caps, or if the student does not understand the concept, respond with a calming and encouraging tone. Making them feel at ease is your priority.
`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: SYSTEM_INSTRUCTION },
                { role: "user", content: message }
            ],
            model: "llama-3.3-70b-versatile", 
            temperature: 0.5,
            max_tokens: 200, 
        });

        const reply = completion.choices[0]?.message?.content || "I am having trouble processing that.";
        console.log("AI Replied:", reply);
        res.json({ reply });

    } catch (error) {
        console.error("Groq Error:", error);
        res.status(500).json({ reply: "My brain is overloaded. Please ask a shorter question." });
    }
});

httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
});