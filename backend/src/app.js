import express from "express";
import cors from "cors";  // Import the cors package

import errorHandler from "./middlewares/error-handler.mjs";
import { requestLogger } from "./middlewares/request-logger.mjs";
import tasksRouter from "./routes/tasks.mjs";

const app = express();
const port = 3000;
// Use CORS middleware
app.use(cors());

app.use(express.json());

app.use(requestLogger);

app.use("/api", tasksRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
