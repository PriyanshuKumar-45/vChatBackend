const { Server } = require("socket.io");
const { Pool } = require("pg"); // PostgreSQL client

// Create a PostgreSQL pool to manage database connections
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "userdata",
  password: "pks2933v",
  port: 5432,
});

// Initialize Socket.IO
const io = new Server(5000, {
  cors: true,
});

const socketIdToUserIdMap = new Map();
const socketIdToInterestMap = new Map();

// Helper function to generate a unique ID
const generateUniqueId = () => {
  return Math.random().toString(36).substr(2, 9);  // Simple unique ID generator
};

// Connect to PostgreSQL
pool.connect()
  .then(() => {
    console.log("Connected to PostgreSQL database!");  // Log to terminal when connected
  })
  .catch((err) => {
    console.error("Error connecting to PostgreSQL database:", err);
  });

io.on("connection", (socket) => {
  console.log("Socket Connected: " + socket.id);  // Log when socket connects

  // When a user joins a room
  socket.on("room:join", async (data) => {
    const { room, interest, name } = data; // Get name, interest from the frontend (no email)

    // Generate unique user ID for the joining user
    const userId = generateUniqueId();

    // Store socket ID, user ID, and interest mapping
    socketIdToUserIdMap.set(socket.id, userId);
    socketIdToInterestMap.set(socket.id, interest);

    try {
      // Store the user's data (room, interest, name, user_id) in PostgreSQL
      await pool.query(
        "INSERT INTO users (room, interest, name, user_id) VALUES ($1, $2, $3, $4)",
        [room, interest, name, userId]
      );

      console.log("User data inserted into the database:", { room, interest, name, userId });

      // Send the stored data back to the frontend as a confirmation
      io.to(socket.id).emit("user:joined", {
        room,
        interest,
        name,
        userId
      });

    } catch (err) {
      console.error("Error inserting data into the database:", err);
    }

    // Inform other users in the room about the new user
    io.to(room).emit("user:joined", { id: socket.id, userId, interest, name });

    // Join the room
    socket.join(room);

    // Send the user back their room and unique ID
    io.to(socket.id).emit("room:join", { room, userId, interest, name });
  });

  // Other socket events for calls and peer negotiation
  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incoming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });
});
