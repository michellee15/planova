const express = require("express");
const cors = require("cors");
require("dotenv").config();

const tripRoutes = require("./routes/tripRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const memberRoutes = require("./routes/memberRoutes");
const settlementRoutes = require("./routes/settlementRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Planova API is running");
});

app.use("/api/trips", tripRoutes);
app.use("/api", expenseRoutes);
app.use("/api", memberRoutes);
app.use("/api", settlementRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});