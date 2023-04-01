export * from "./models/item";
import fs from "fs";

// Load json schema from file and export it
export const schema = JSON.parse(fs.readFileSync(__dirname + "/schema.json", "utf8"));