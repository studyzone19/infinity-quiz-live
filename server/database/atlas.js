const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error("MONGO_URI is missing. Check server/.env");
}

if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
  throw new Error("MONGO_URI must start with mongodb:// or mongodb+srv://");
}

const databaseName = process.env.MONGO_DB_NAME || "infinityQuizLive";

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000
});

const databasePromise = client
  .connect()
  .then(() => {
    console.log(`MongoDB Atlas Connected (${databaseName})`);
    return client.db(databaseName);
  })
  .catch((error) => {
    console.error("MongoDB Atlas connection failed:", error.message);
    throw error;
  });

const collection = (database, name) => database.collection(name);

const getDatabase = (callback) => {
  databasePromise
    .then((database) => callback(null, database))
    .catch((error) => callback(error));
};

const toScoreRow = (row) => ({
  ...row,
  id: row.id || String(row._id),
  timestamp:
    row.timestamp instanceof Date
      ? row.timestamp.toISOString()
      : row.timestamp
});

const queryRows = async (database, sql, params) => {
  if (sql.includes("FROM scores s") && sql.includes("LEFT JOIN users")) {
    const users = await collection(database, "users").find({}).toArray();

    const userMap = new Map(
      users.map((user) => [user.userId, user])
    );

    const scores = await collection(database, "scores")
      .find({})
      .sort({ timestamp: 1 })
      .toArray();

    return scores.map((score) => ({
      ...toScoreRow(score),
      email: userMap.get(score.userId)?.email || null
    }));
  }

  if (
    sql.includes("FROM scores") &&
    sql.includes("ORDER BY score DESC")
  ) {
    const scores = await collection(database, "scores")
      .find({})
      .sort({
        score: -1,
        correct: -1,
        timestamp: 1
      })
      .limit(10)
      .toArray();

    return scores.map(toScoreRow);
  }

  if (sql.includes("FROM scores WHERE userId = ?")) {
    const scores = await collection(database, "scores")
      .find({ userId: params[0] })
      .sort({ timestamp: 1 })
      .toArray();

    return scores.map(toScoreRow);
  }

  if (sql.includes("FROM questions")) {
    return collection(database, "questions")
      .aggregate([{ $sample: { size: 5 } }])
      .toArray();
  }

  if (sql.includes("FROM truefalse_questions")) {
    return collection(database, "truefalse_questions")
      .aggregate([{ $sample: { size: 10 } }])
      .toArray();
  }

  if (sql.includes("FROM unscramble_words")) {
    return collection(database, "unscramble_words")
      .aggregate([{ $sample: { size: 5 } }])
      .toArray();
  }

  return [];
};

const db = {
  all(sql, params, callback) {
    getDatabase(async (error, database) => {
      if (error) return callback(error);

      try {
        const rows = await queryRows(database, sql, params);
        callback(null, rows);
      } catch (queryError) {
        callback(queryError);
      }
    });
  },

  get(sql, params, callback) {
    getDatabase(async (error, database) => {
      if (error) return callback(error);

      try {
        let row = null;

        if (sql.includes("FROM users WHERE LOWER(email)")) {
          const email = params[0];

          row = await collection(database, "users").findOne(
            {
              email: {
                $regex: `^${email.replace(
                  /[.*+?^${}()|[\]\\]/g,
                  "\\$&"
                )}$`,
                $options: "i"
              }
            },
            {
              projection: {
                userId: 1
              }
            }
          );
        } else if (sql.includes("FROM users WHERE userId")) {
          row = await collection(database, "users").findOne(
            {
              userId: params[0]
            },
            {
              projection: {
                userId: 1,
                name: 1,
                email: 1
              }
            }
          );
        } else if (sql.includes("FROM scores WHERE userId")) {
          row = await collection(database, "scores").findOne(
            {
              userId: params[0],
              game_type: params[1]
            },
            {
              projection: {
                id: 1,
                _id: 1
              }
            }
          );
        }

        callback(null, row);
      } catch (queryError) {
        callback(queryError);
      }
    });
  },

  run(sql, params, callback) {
    getDatabase(async (error, database) => {
      if (error) return callback(error);

      try {
        if (sql.includes("INSERT INTO users")) {
          await collection(database, "users").insertOne({
            userId: params[0],
            name: params[1],
            email: params[2],
            phone: params[3],
            college: params[4]
          });
        } else if (sql.includes("INSERT INTO scores")) {
          await collection(database, "scores").insertOne({
            userId: params[0],
            name: params[1],
            score: params[2],
            correct: params[3],
            wrong: params[4],
            game_type: params[5],
            timestamp: new Date()
          });
        } else if (sql.includes("DELETE FROM scores")) {
          await collection(database, "scores").deleteMany({});
        }

        callback.call(
          {
            lastID: null,
            changes: 1
          },
          null
        );
      } catch (queryError) {
        callback(queryError);
      }
    });
  },

  serialize(callback) {
    callback();
  },

  prepare(sql) {
    const values = [];

    return {
      run(params) {
        values.push(params);
      },

      finalize(callback) {
        getDatabase(async (error, database) => {
          if (error) return callback(error);

          try {
            let target;

            if (sql.includes("INSERT INTO questions")) {
              target = "questions";
            }

            if (sql.includes("INSERT INTO truefalse_questions")) {
              target = "truefalse_questions";
            }

            if (sql.includes("INSERT INTO unscramble_words")) {
              target = "unscramble_words";
            }

            if (target && values.length) {
              const documents = values.map((params) => {
                if (target === "questions") {
                  return {
                    id: params[0],
                    question: params[1],
                    optionA: params[2],
                    optionB: params[3],
                    optionC: params[4],
                    optionD: params[5],
                    correctOption: params[6]
                  };
                }

                if (target === "truefalse_questions") {
                  return {
                    id: params[0],
                    statement: params[1],
                    answer: params[2]
                  };
                }

                return {
                  id: params[0],
                  word: params[1],
                  hint: params[2]
                };
              });

              await collection(database, target).insertMany(documents);
            }

            callback();
          } catch (queryError) {
            callback(queryError);
          }
        });
      }
    };
  }
};

const seedCollection = async (database, name, documents) => {
  const target = collection(database, name);

  const existingCount = await target.countDocuments();

  if (existingCount === 0 && documents.length) {
    await target.insertMany(documents);
  }
};

databasePromise
  .then(async (database) => {
    const rootPath = path.join(
      __dirname,
      "..",
      "question.json"
    );

    const fallbackPath = path.join(
      __dirname,
      "..",
      "..",
      "question.json"
    );

    const questionPath = fs.existsSync(rootPath)
      ? rootPath
      : fallbackPath;

    const questions = JSON.parse(
      fs.readFileSync(questionPath, "utf8")
    );

    await seedCollection(
      database,
      "questions",
      questions
    );

    await seedCollection(
      database,
      "truefalse_questions",
      [
        {
          id: 1,
          statement: "JavaScript is a compiled programming language.",
          answer: 0
        },
        {
          id: 2,
          statement: "The Great Wall of China is visible from space with naked eye.",
          answer: 0
        },
        {
          id: 3,
          statement: "HTML stands for HyperText Markup Language.",
          answer: 1
        },
        {
          id: 4,
          statement: "The sun is a planet in our solar system.",
          answer: 0
        },
        {
          id: 5,
          statement: "Python was created by Guido van Rossum.",
          answer: 1
        },
        {
          id: 6,
          statement: "Water boils at 100 degrees Celsius at standard pressure.",
          answer: 1
        },
        {
          id: 7,
          statement: "SQL stands for Structured Query Language.",
          answer: 1
        },
        {
          id: 8,
          statement: "The moon has its own light that it emits.",
          answer: 0
        },
        {
          id: 9,
          statement: "An octopus has 6 arms.",
          answer: 0
        },
        {
          id: 10,
          statement: "React is a JavaScript library developed by Meta (Facebook).",
          answer: 1
        },
        {
          id: 11,
          statement: "The chemical symbol for Gold is 'Gd'.",
          answer: 0
        },
        {
          id: 12,
          statement: "Node.js runs JavaScript on the server side.",
          answer: 1
        },
        {
          id: 13,
          statement: "A byte consists of 8 bits.",
          answer: 1
        },
        {
          id: 14,
          statement: "Africa is the smallest continent by area.",
          answer: 0
        },
        {
          id: 15,
          statement: "Git is a version control system.",
          answer: 1
        },
        {
          id: 16,
          statement: "CSS stands for Creative Style Sheets.",
          answer: 0
        },
        {
          id: 17,
          statement: "The capital of Australia is Sydney.",
          answer: 0
        },
        {
          id: 18,
          statement: "WebSockets allow bidirectional real-time communication.",
          answer: 1
        },
        {
          id: 19,
          statement: "IPv4 addresses are 128 bits long.",
          answer: 0
        },
        {
          id: 20,
          statement: "Alan Turing is known as the father of theoretical computer science.",
          answer: 1
        }
      ]
    );

    await seedCollection(
      database,
      "unscramble_words",
      [
        {
          id: 1,
          word: "JAVASCRIPT",
          hint: "Popular web scripting language"
        },
        {
          id: 2,
          word: "DATABASE",
          hint: "Organized collection of data"
        },
        {
          id: 3,
          word: "ALGORITHM",
          hint: "Step-by-step problem solving procedure"
        },
        {
          id: 4,
          word: "NETWORK",
          hint: "Connected computers sharing resources"
        },
        {
          id: 5,
          word: "COMPILER",
          hint: "Translates code to machine language"
        },
        {
          id: 6,
          word: "FRAMEWORK",
          hint: "Reusable code structure for development"
        },
        {
          id: 7,
          word: "RECURSION",
          hint: "Function calling itself"
        },
        {
          id: 8,
          word: "VARIABLE",
          hint: "Named storage location in programming"
        },
        {
          id: 9,
          word: "ENCRYPTION",
          hint: "Securing data using codes"
        },
        {
          id: 10,
          word: "BANDWIDTH",
          hint: "Data transfer capacity of a network"
        },
        {
          id: 11,
          word: "KEYBOARD",
          hint: "Input device with keys"
        },
        {
          id: 12,
          word: "MONITOR",
          hint: "Visual display unit of a computer"
        },
        {
          id: 13,
          word: "FUNCTION",
          hint: "Reusable block of code"
        },
        {
          id: 14,
          word: "BROWSER",
          hint: "Software used to access the internet"
        },
        {
          id: 15,
          word: "PROTOCOL",
          hint: "Rules for data communication"
        },
        {
          id: 16,
          word: "INTERFACE",
          hint: "Point of interaction between systems"
        },
        {
          id: 17,
          word: "DEBUGGING",
          hint: "Finding and fixing errors in code"
        },
        {
          id: 18,
          word: "INTERNET",
          hint: "Global network of networks"
        },
        {
          id: 19,
          word: "HARDWARE",
          hint: "Physical components of a computer"
        },
        {
          id: 20,
          word: "SOFTWARE",
          hint: "Programs and operating systems"
        }
      ]
    );

    console.log(
      `Synchronized ${questions.length} MCQ questions to MongoDB Atlas.`
    );
  })
  .catch((error) => {
    console.error(
      "MongoDB Atlas initialization error:",
      error.message
    );
  });

module.exports = db;