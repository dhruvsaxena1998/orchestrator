import "./dotenv";

import express from "express";

import TaskRouter from "./controllers/Task.controller";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/tasks", TaskRouter);

app.listen(3000, () => {
  console.log("Example app listening on port 3000!");
});
