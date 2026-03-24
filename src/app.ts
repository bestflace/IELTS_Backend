const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

import rootRoutes from "./routes";
import { notFoundMiddleware } from "./common/middlewares/not-found.middleware";
import { errorMiddleware } from "./common/middlewares/error.middleware";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1", rootRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
