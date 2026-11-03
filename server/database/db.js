const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

if (process.env.MONGO_URI && !process.env.MONGO_URI.includes("YOUR_PASSWORD")) {
  module.exports = require("./atlas");
} else {

const dbPath = path.join(__dirname, "quiz.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.log(err.message);
  } else {
    console.log("SQLite Connected");
  }
});

db.serialize(() => {
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT UNIQUE,
      name TEXT,
      email TEXT,
      phone TEXT,
      college TEXT
    )
  `);

  // Create questions table (MCQ)
  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      optionA TEXT NOT NULL,
      optionB TEXT NOT NULL,
      optionC TEXT NOT NULL,
      optionD TEXT NOT NULL,
      correctOption TEXT NOT NULL
    )
  `);

  // Create scores table with game_type
  db.run(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      score INTEGER NOT NULL,
      correct INTEGER NOT NULL,
      wrong INTEGER NOT NULL,
      game_type TEXT DEFAULT 'quiz',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add game_type column if it doesn't exist (for existing DBs)
  db.run(`ALTER TABLE scores ADD COLUMN game_type TEXT DEFAULT 'quiz'`, () => {});

  // Create True/False questions table
  db.run(`
    CREATE TABLE IF NOT EXISTS truefalse_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      statement TEXT NOT NULL,
      answer INTEGER NOT NULL
    )
  `);

  // Create Word Unscramble table
  db.run(`
    CREATE TABLE IF NOT EXISTS unscramble_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL,
      hint TEXT NOT NULL
    )
  `);

  // ---- Seed MCQ Questions from question.json ----
  const jsonPath = path.join(__dirname, "..", "question.json");
  const rootJsonPath = path.join(__dirname, "..", "..", "question.json");

  let questionsList = [];
  if (fs.existsSync(jsonPath)) {
    try {
      const fileData = fs.readFileSync(jsonPath, "utf8");
      questionsList = JSON.parse(fileData);
      console.log(`Loaded ${questionsList.length} questions from ${jsonPath}`);
    } catch (jsonErr) {
      console.error("Error parsing question.json:", jsonErr.message);
    }
  } else if (fs.existsSync(rootJsonPath)) {
    try {
      const fileData = fs.readFileSync(rootJsonPath, "utf8");
      questionsList = JSON.parse(fileData);
      console.log(`Loaded ${questionsList.length} questions from ${rootJsonPath}`);
    } catch (jsonErr) {
      console.error("Error parsing root question.json:", jsonErr.message);
    }
  }

  if (questionsList.length === 0) {
    console.error("Warning: No questions found in question.json!");
  }

  db.run("DELETE FROM questions", (delErr) => {
    if (delErr) {
      console.error("Error clearing questions table:", delErr.message);
      return;
    }

    const stmt = db.prepare(`
      INSERT INTO questions (id, question, optionA, optionB, optionC, optionD, correctOption)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    questionsList.forEach((q) => {
      stmt.run([q.id, q.question, q.optionA, q.optionB, q.optionC, q.optionD, q.correctOption]);
    });

    stmt.finalize((finErr) => {
      if (finErr) {
        console.error("Error finalizing seed statements:", finErr.message);
      } else {
        console.log(`Successfully synchronized ${questionsList.length} questions to database.`);
      }
    });
  });

  // ---- Seed True/False Questions ----
  const tfQuestions = [
    { statement: "JavaScript is a compiled programming language.", answer: 0 },
    { statement: "The Great Wall of China is visible from space with naked eye.", answer: 0 },
    { statement: "HTML stands for HyperText Markup Language.", answer: 1 },
    { statement: "The sun is a planet in our solar system.", answer: 0 },
    { statement: "Python was created by Guido van Rossum.", answer: 1 },
    { statement: "Water boils at 100 degrees Celsius at standard pressure.", answer: 1 },
    { statement: "SQL stands for Structured Query Language.", answer: 1 },
    { statement: "The moon has its own light that it emits.", answer: 0 },
    { statement: "An octopus has 6 arms.", answer: 0 },
    { statement: "React is a JavaScript library developed by Meta (Facebook).", answer: 1 },
    { statement: "The chemical symbol for Gold is 'Gd'.", answer: 0 },
    { statement: "Node.js runs JavaScript on the server side.", answer: 1 },
    { statement: "A byte consists of 8 bits.", answer: 1 },
    { statement: "Africa is the smallest continent by area.", answer: 0 },
    { statement: "Git is a version control system.", answer: 1 },
    { statement: "CSS stands for Creative Style Sheets.", answer: 0 },
    { statement: "The capital of Australia is Sydney.", answer: 0 },
    { statement: "WebSockets allow bidirectional real-time communication.", answer: 1 },
    { statement: "IPv4 addresses are 128 bits long.", answer: 0 },
    { statement: "Alan Turing is known as the father of theoretical computer science.", answer: 1 },
  ];

  db.run("DELETE FROM truefalse_questions", () => {
    const tfStmt = db.prepare("INSERT INTO truefalse_questions (statement, answer) VALUES (?, ?)");
    tfQuestions.forEach((q) => tfStmt.run([q.statement, q.answer]));
    tfStmt.finalize(() => console.log(`Seeded ${tfQuestions.length} True/False questions.`));
  });

  // ---- Seed Unscramble Words ----
  const unscrambleWords = [
    { word: "JAVASCRIPT", hint: "Popular web scripting language" },
    { word: "DATABASE", hint: "Organized collection of data" },
    { word: "ALGORITHM", hint: "Step-by-step problem solving procedure" },
    { word: "NETWORK", hint: "Connected computers sharing resources" },
    { word: "COMPILER", hint: "Translates code to machine language" },
    { word: "FRAMEWORK", hint: "Reusable code structure for development" },
    { word: "RECURSION", hint: "Function calling itself" },
    { word: "VARIABLE", hint: "Named storage location in programming" },
    { word: "ENCRYPTION", hint: "Securing data using codes" },
    { word: "BANDWIDTH", hint: "Data transfer capacity of a network" },
    { word: "KEYBOARD", hint: "Input device with keys" },
    { word: "MONITOR", hint: "Visual display unit of a computer" },
    { word: "FUNCTION", hint: "Reusable block of code" },
    { word: "BROWSER", hint: "Software used to access the internet" },
    { word: "PROTOCOL", hint: "Rules for data communication" },
    { word: "INTERFACE", hint: "Point of interaction between systems" },
    { word: "DEBUGGING", hint: "Finding and fixing errors in code" },
    { word: "INTERNET", hint: "Global network of networks" },
    { word: "HARDWARE", hint: "Physical components of a computer" },
    { word: "SOFTWARE", hint: "Programs and operating systems" },
  ];

  db.run("DELETE FROM unscramble_words", () => {
    const unStmt = db.prepare("INSERT INTO unscramble_words (word, hint) VALUES (?, ?)");
    unscrambleWords.forEach((w) => unStmt.run([w.word, w.hint]));
    unStmt.finalize(() => console.log(`Seeded ${unscrambleWords.length} unscramble words.`));
  });
});

module.exports = db;
}
