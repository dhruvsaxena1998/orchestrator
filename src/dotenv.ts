import { config } from "dotenv";
import path from "path";
console.log(__dirname);

config({
  path: path.join(__dirname, "../.env"),
});
