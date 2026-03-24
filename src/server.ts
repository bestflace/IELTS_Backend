import * as dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { env } from "./config/env";

app.listen(env.PORT, () => {
  console.log(`Server running at http://localhost:${env.PORT}`);
});
