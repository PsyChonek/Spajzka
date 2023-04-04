import OpenAPI from "openapi-typescript-codegen";
import schema from '@psychonek/shared';

OpenAPI.generate({
    input: './swagger.yml',
    output: './src'
});
