const express = require("express");
const cors = require("cors");
const http = require("http");
const fs = require("fs");
const pathModule = require("path");
const { Server } = require("socket.io");
const QRCode = require("qrcode");
require("dotenv").config();

const db = require("./database/db");

// CSV file path
const CSV_PATH = pathModule.join(__dirname, "leaderboard_data.csv");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.use(cors());
app.use(express.json());

// ────────────────────────────────────────────
// Helper: Leaderboard queries
// ────────────────────────────────────────────
const getTopLeaderboard = () => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT name, score, correct, wrong, game_type, timestamp 
       FROM scores 
       ORDER BY score DESC, correct DESC, timestamp ASC 
       LIMIT 10`,
      [],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

const getAllLeaderboard = () => {
  return new Promise((resolve, reject) => {
    // Return raw rows (one per game played) so ScoreDisplay can group them
    db.all(
      `SELECT s.userId, s.name, u.email, s.score, s.correct, s.wrong, s.game_type, s.timestamp 
       FROM scores s
       LEFT JOIN users u ON s.userId = u.userId
       ORDER BY s.timestamp ASC`,
      [],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

// Helper: Write CSV
const writeCSV = async () => {
  try {
    const rows = await getAllLeaderboard();
    let csv = "Rank,Name,User ID,Email,Game,Score,Correct Answers,Wrong Answers,Accuracy (%),Played At\n";
    rows.forEach((row, index) => {
      const total = row.correct + row.wrong;
      const accuracy = total > 0 ? Math.round((row.correct / total) * 100) : 0;
      const name = (row.name || "").replace(/,/g, " ");
      const email = (row.email || "N/A").replace(/,/g, " ");
      const gameType = (row.game_type || "quiz").replace(/,/g, " ");
      const timestamp = row.timestamp || "N/A";
      csv += `${index + 1},${name},${row.userId},${email},${gameType},${row.score},${row.correct},${row.wrong},${accuracy}%,${timestamp}\n`;
    });
    fs.writeFileSync(CSV_PATH, csv, "utf-8");
    console.log(`CSV updated: ${rows.length} records written.`);
  } catch (err) {
    console.error("CSV write error:", err.message);
  }
};

// ────────────────────────────────────────────
// Basic Route
// ────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("Infinity Quiz Live Backend Running");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: process.env.MONGO_URI && !process.env.MONGO_URI.includes("YOUR_PASSWORD") ? "MongoDB Atlas" : "SQLite"
  });
});

app.post("/api/admin/reset", (req, res) => {
  const { adminKey } = req.body;
  const expectedKey = process.env.ADMIN_KEY || "RAM@192002";
  if (adminKey !== expectedKey) {
    return res.status(403).json({ error: "Invalid admin authorization key." });
  }

  db.run("DELETE FROM scores", [], async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    try {
      await writeCSV();
      io.emit("leaderboard-update", []);
      res.json({ success: true, message: "Tournament scores have been reset successfully!" });
    } catch (writeErr) {
      res.json({ success: true, message: "Scores reset." });
    }
  });
});

// ────────────────────────────────────────────
// Register Endpoint
// ────────────────────────────────────────────
app.post("/api/register", (req, res) => {
  const { name, email, phone, college } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  db.get(
    "SELECT userId FROM users WHERE LOWER(email) = ? OR email = ?",
    [email.trim().toLowerCase(), email.trim()],
    async (err, userExists) => {
      if (err) return res.status(500).json({ error: err.message });
      if (userExists) return res.status(400).json({ error: "This email is already registered." });

      const cleanName = (name || "QUIZ").replace(/[^a-zA-Z]/g, "").toUpperCase();
      const prefix = cleanName.slice(0, 3).padEnd(3, "X");

      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      const ms = String(now.getMilliseconds()).padStart(3, "0");
      const userId = `${prefix}-${day}${hh}${mm}${ss}${ms}`;

      try {
        const qrData = JSON.stringify({ userId });
        const qrCode = await QRCode.toDataURL(qrData);

        db.run(
          `INSERT INTO users (userId, name, email, phone, college) VALUES (?, ?, ?, ?, ?)`,
          [userId, name, email.trim(), phone || null, college || null],
          function (insertErr) {
            if (insertErr) return res.status(500).json({ error: insertErr.message });
            res.json({ success: true, userId, qrCode });
          }
        );
      } catch (qrErr) {
        return res.status(500).json({ error: qrErr.message });
      }
    }
  );
});

// ────────────────────────────────────────────
// Verify / Login Endpoint
// ────────────────────────────────────────────
app.post("/api/verify", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "User ID is required." });

  db.get(
    "SELECT userId, name, email FROM users WHERE userId = ?",
    [userId.trim()],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: "Access pass invalid or not registered." });

      // Fetch all games already played by this user
      db.all(
        "SELECT game_type, score FROM scores WHERE userId = ?",
        [user.userId],
        (err, scoreRecords) => {
          if (err) return res.status(500).json({ error: err.message });

          const ALL_GAMES = ["quiz", "speed", "truefalse", "unscramble"];
          const playedGames = scoreRecords.map((r) => r.game_type);
          const allPlayed = ALL_GAMES.every((g) => playedGames.includes(g));

          // Build per-game score map
          const gameScores = {};
          scoreRecords.forEach((r) => { gameScores[r.game_type] = r.score; });

          res.json({ success: true, user, playedGames, gameScores, allPlayed });
        }
      );
    }
  );
});

function getGameLabel(gameType) {
  const labels = {
    quiz: "Classic Quiz",
    speed: "Speed Quiz",
    truefalse: "True or False",
    unscramble: "Word Unscramble"
  };
  return labels[gameType] || gameType;
}

// ────────────────────────────────────────────
// Questions — MCQ (Quiz & Speed Quiz)
// ────────────────────────────────────────────
app.get("/api/questions/random", (req, res) => {
  db.all(
    "SELECT id, question, optionA, optionB, optionC, optionD, correctOption FROM questions ORDER BY RANDOM() LIMIT 5",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, questions: rows });
    }
  );
});

// ────────────────────────────────────────────
// Questions — True/False
// ────────────────────────────────────────────
app.get("/api/questions/truefalse", (req, res) => {
  db.all(
    "SELECT id, statement, answer FROM truefalse_questions ORDER BY RANDOM() LIMIT 10",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, questions: rows });
    }
  );
});

// ────────────────────────────────────────────
// Questions — Word Unscramble
// ────────────────────────────────────────────
app.get("/api/questions/unscramble", (req, res) => {
  db.all(
    "SELECT id, word, hint FROM unscramble_words ORDER BY RANDOM() LIMIT 5",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      // Scramble each word server-side
      const scrambled = rows.map((row) => ({
        id: row.id,
        word: row.word,
        scrambled: shuffleWord(row.word),
        hint: row.hint
      }));

      res.json({ success: true, questions: scrambled });
    }
  );
});

function shuffleWord(word) {
  let arr = word.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Ensure it's actually scrambled (not same as original)
  const result = arr.join("");
  return result === word ? shuffleWord(word) : result;
}

// ────────────────────────────────────────────
// Save Score & Broadcast Leaderboard
// ────────────────────────────────────────────
app.post("/api/scores", (req, res) => {
  const { userId, name, score, correct, wrong, gameType } = req.body;

  if (!userId || !name || score === undefined || correct === undefined || wrong === undefined) {
    return res.status(400).json({ error: "Missing required score fields." });
  }

  const gameTypeValue = gameType || "quiz";

  // Prevent playing the SAME game twice (one entry per game_type per user)
  db.get("SELECT id FROM scores WHERE userId = ? AND game_type = ?", [userId, gameTypeValue], (err, existing) => {
    if (err) return res.status(500).json({ error: err.message });
    if (existing) return res.status(400).json({ error: `You have already played this game (${gameTypeValue}).` });

    db.run(
      `INSERT INTO scores (userId, name, score, correct, wrong, game_type) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, name, score, correct, wrong, gameTypeValue],
      async function (err) {
        if (err) return res.status(500).json({ error: err.message });

        try {
          const allPlayers = await getAllLeaderboard();
          io.emit("leaderboard-update", allPlayers);
          await writeCSV();
          res.json({ success: true, leaderboard: allPlayers });
        } catch (leaderboardError) {
          res.status(500).json({ error: leaderboardError.message });
        }
      }
    );
  });
});

// ────────────────────────────────────────────
// Per-User Score Summary
// ────────────────────────────────────────────
app.get("/api/scores/user/:userId", (req, res) => {
  const { userId } = req.params;
  db.all(
    "SELECT game_type, score, correct, wrong, timestamp FROM scores WHERE userId = ? ORDER BY timestamp ASC",
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const gameScores = {};
      let total = 0;
      rows.forEach((r) => { gameScores[r.game_type] = r.score; total += r.score; });
      res.json({ success: true, gameScores, total, playedGames: rows.map((r) => r.game_type) });
    }
  );
});

// ────────────────────────────────────────────
// Leaderboard Endpoints
// ────────────────────────────────────────────
app.get("/api/leaderboard/all", async (req, res) => {
  try {
    const allPlayers = await getAllLeaderboard();
    res.json({ success: true, leaderboard: allPlayers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/export/csv", async (req, res) => {
  try {
    await writeCSV();
    if (!fs.existsSync(CSV_PATH)) {
      return res.status(404).json({ error: "No data to export yet." });
    }
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=infinity_quiz_leaderboard.csv");
    res.sendFile(CSV_PATH);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────
// Socket Connections
// ────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  getAllLeaderboard()
    .then((leaderboard) => socket.emit("leaderboard-update", leaderboard))
    .catch((err) => console.error("Error sending initial leaderboard:", err));

  socket.on("disconnect", () => {
    console.log("User Disconnected");
  });
});

// Generate initial CSV on server start
getAllLeaderboard()
  .then((rows) => { if (rows.length > 0) writeCSV(); })
  .catch(() => {});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server Running on Port ${PORT}`);
});
