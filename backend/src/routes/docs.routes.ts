import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'node:path';

const schemaPath = path.join(process.cwd(), 'src', 'docs', 'openapi.yaml');
const openApiDocument = YAML.load(schemaPath);

export const docsRouter = Router();
docsRouter.use('/', swaggerUi.serve, swaggerUi.setup(openApiDocument));
