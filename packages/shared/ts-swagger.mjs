import { createGenerator } from "ts-json-schema-generator";
import * as fs from "fs";

const modelPath = 'src\\models\\*.ts';
const output_path = "src\\schema.json";

const config = {
    path: modelPath,
    tsconfig: './tsconfig.json',
    type: "*"
}

const schema = createGenerator(config).createSchema(config.type);

const schemaString = JSON.stringify(schema, null, 2);
fs.writeFile(output_path, schemaString, (err) => {
    if (err) throw err;
});