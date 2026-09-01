import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import mysql from "mysql2/promise";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Cargar .env desde la misma carpeta que index.js
// Soporta --env-file=xxx para usar diferentes configuraciones
const __dirname = dirname(fileURLToPath(import.meta.url));
const envFileArg = process.argv.find(arg => arg.startsWith('--env-file='));
const envPath = envFileArg
  ? join(__dirname, envFileArg.split('=')[1])
  : join(__dirname, ".env");
config({ path: envPath });

// 1. Configuración de la conexión — credenciales desde .env
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT ?? "3306"),
};

// 2. Crear el Servidor MCP
const server = new Server(
  {
    name: "all-season-flowers-db-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// 3. Definir las herramientas disponibles
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "query_db",
        description:
          "Ejecuta una consulta SQL SELECT en la base de datos de All Season Flowers",
        inputSchema: {
          type: "object",
          properties: {
            sql: { type: "string", description: "La consulta SQL a ejecutar" },
          },
          required: ["sql"],
        },
      },
      {
        name: "list_tables",
        description:
          "Muestra todas las tablas de la base de datos All Season Flowers",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "describe_table",
        description: "Muestra la estructura de una tabla específica",
        inputSchema: {
          type: "object",
          properties: {
            table: { type: "string", description: "Nombre de la tabla" },
          },
          required: ["table"],
        },
      },
    ],
  };
});

// 4. Lógica de las herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const connection = await mysql.createConnection(dbConfig);

  try {
    if (request.params.name === "list_tables") {
      const [rows] = await connection.execute("SHOW TABLES");
      return {
        content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      };
    }

    if (request.params.name === "describe_table") {
      const table = request.params.arguments.table;
      const [rows] = await connection.execute(`DESCRIBE \`${table}\``);
      return {
        content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      };
    }

    if (request.params.name === "query_db") {
      const sql = request.params.arguments.sql;
      if (!sql.toLowerCase().trim().startsWith("select")) {
        return {
          content: [
            {
              type: "text",
              text: "Error: Solo se permiten consultas SELECT.",
            },
          ],
          isError: true,
        };
      }
      const [rows] = await connection.execute(sql);
      return {
        content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      };
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error en la DB: ${error.message}` }],
      isError: true,
    };
  } finally {
    await connection.end();
  }
});

// 5. Iniciar el servidor
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Servidor MCP de All Season Flowers funcionando por STDIO");
