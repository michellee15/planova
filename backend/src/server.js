require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authenticationRoutes");
const tripRoutes = require("./routes/tripRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const memberRoutes = require("./routes/memberRoutes");
const settlementRoutes = require("./routes/settlementRoutes");
const itineraryRoutes = require("./routes/itineraryRoutes");
const routeRoutes =  require("./routes/routeRoutes");
const chatRoutes = require("./routes/chatRoutes");
const collaborationRoutes = require("./routes/collaborationRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Planova API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api", expenseRoutes);
app.use("/api", memberRoutes);
app.use("/api", settlementRoutes);
app.use("/api", itineraryRoutes);
app.use("/api", routeRoutes);
app.use("/api", chatRoutes);
app.use("/api", collaborationRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
