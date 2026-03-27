const express = require("express");
const axios = require("axios");
const config = require("./config");
const path = require("path");
const fs = require("fs");

// Crear aplicación Express
const app = express();
app.use(express.json({ limit: "50mb" })); // Aumenta límite a 50MB
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Middleware para permitir CORS (comunicación con VS Code)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  next();
});

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Servidor DeepSeek Integration funcionando!",
    endpoints: {
      chat: "POST /api/chat",
      analyzeFile: "POST /api/analyze-file",
      analyzeProject: "POST /api/analyze-project",
    },
  });
});

// Ruta para analizar múltiples archivos o proyectos completos
app.post("/api/analyze-multiple", async (req, res) => {
  try {
    const { filePaths, question, maxFiles = 5 } = req.body;

    if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
      return res.status(400).json({
        error: "filePaths debe ser un array con al menos un archivo",
      });
    }

    if (!question) {
      return res.status(400).json({
        error: "question es requerido",
      });
    }

    // Limitar cantidad de archivos para no exceder tokens
    const filesToAnalyze = filePaths.slice(0, Math.min(maxFiles, 10));
    const analysisResults = [];

    for (const filePath of filesToAnalyze) {
      try {
        const absolutePath = path.join(__dirname, "..", filePath);

        if (!fs.existsSync(absolutePath)) {
          analysisResults.push({
            filePath,
            error: "Archivo no encontrado",
          });
          continue;
        }

        // Leer archivo con manejo de encoding
        const fileContent = fs.readFileSync(absolutePath, "utf8");
        const fileName = path.basename(filePath);
        const fileExtension = path.extname(filePath);

        // Para archivos muy grandes, tomar solo partes relevantes
        let contentToAnalyze = fileContent;
        if (fileContent.length > 10000) {
          // Más de 10k caracteres
          contentToAnalyze = `
                    ARCHIVO DEMASIADO GRANDE PARA ANALIZAR COMPLETO (${fileContent.length} caracteres)
                    
                    PRIMERAS 5000 CARACTERES:
                    ${fileContent.substring(0, 5000)}
                    
                    ...
                    
                    ÚLTIMAS 5000 CARACTERES:
                    ${fileContent.substring(fileContent.length - 5000)}
                    `;
        }

        analysisResults.push({
          fileName,
          filePath,
          extension: fileExtension,
          size: fileContent.length,
          preview: contentToAnalyze.substring(0, 500) + "...",
        });
      } catch (fileError) {
        analysisResults.push({
          filePath,
          error: `Error leyendo archivo: ${fileError.message}`,
        });
      }
    }

    // Preparar mensaje para DeepSeek
    const filesSummary = analysisResults
      .map(
        (file) =>
          `📄 ${file.fileName} (${file.size} caracteres, ${file.extension}): ${file.preview}`,
      )
      .join("\n\n");

    const message = `
ANÁLISIS DE MÚLTIPLES ARCHIVOS - PROYECTO: AllSeasonFlowers

ARCHIVOS ANALIZADOS (${analysisResults.length}):
${filesSummary}

PREGUNTA DEL DESARROLLADOR:
${question}

INSTRUCCIONES:
Analiza estos archivos en conjunto y responde a la pregunta considerando las relaciones entre ellos.
Si algún archivo es muy grande, enfócate en las partes más relevantes.
        `;

    const requestBody = {
      ...config.getDefaultBody(),
      messages: [
        {
          role: "system",
          content:
            "Eres un arquitecto de software experto en analizar proyectos completos. Analiza múltiples archivos y sus relaciones.",
        },
        { role: "user", content: message },
      ],
      max_tokens: 4000, // Más tokens para análisis complejo
    };

    const response = await axios.post(config.deepseekApiUrl, requestBody, {
      headers: config.getHeaders(),
    });

    const reply = response.data.choices[0].message.content;

    res.json({
      totalFiles: analysisResults.length,
      files: analysisResults,
      reply,
    });
  } catch (error) {
    console.error("Error en /api/analyze-multiple:", error);
    res.status(500).json({
      error: "Error al analizar múltiples archivos",
      details: error.message,
    });
  }
});

// Ruta para analizar estructura del proyecto
app.post("/api/analyze-structure", async (req, res) => {
  try {
    const { folderPath, question } = req.body;

    const absolutePath = path.join(__dirname, "..", folderPath || "");

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: "Carpeta no encontrada" });
    }

    // Obtener estructura de archivos
    const structure = getFolderStructure(absolutePath, absolutePath);

    const message = `
ESTRUCTURA DEL PROYECTO - CARPETA: ${folderPath || "raíz"}

ESTRUCTURA DE ARCHIVOS:
${structure}

PREGUNTA:
${question}

ANALIZA la estructura del proyecto y da recomendaciones basadas en mejores prácticas.
        `;

    const requestBody = {
      ...config.getDefaultBody(),
      messages: [
        {
          role: "system",
          content:
            "Eres un experto en estructura de proyectos y arquitectura de software.",
        },
        { role: "user", content: message },
      ],
    };

    const response = await axios.post(config.deepseekApiUrl, requestBody, {
      headers: config.getHeaders(),
    });

    const reply = response.data.choices[0].message.content;

    res.json({
      folderPath: folderPath || "raíz",
      structure: structure.split("\n").slice(0, 50), // Primeras 50 líneas
      reply,
    });
  } catch (error) {
    console.error("Error en /api/analyze-structure:", error);
    res.status(500).json({ error: "Error al analizar estructura" });
  }
});

// Función auxiliar para obtener estructura de carpetas
function getFolderStructure(
  dir,
  rootDir,
  prefix = "",
  depth = 0,
  maxDepth = 3,
) {
  if (depth > maxDepth) return prefix + "└── [profundidad máxima alcanzada]\n";

  const files = fs.readdirSync(dir);
  let structure = "";

  files.forEach((file, index) => {
    const filePath = path.join(dir, file);
    const isLast = index === files.length - 1;
    const relativePath = path.relative(rootDir, filePath);

    try {
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        structure += prefix + (isLast ? "└── " : "├── ") + `📁 ${file}/\n`;
        structure += getFolderStructure(
          filePath,
          rootDir,
          prefix + (isLast ? "    " : "│   "),
          depth + 1,
          maxDepth,
        );
      } else {
        const ext = path.extname(file);
        const size = stat.size;
        const sizeStr =
          size > 1024 ? `${(size / 1024).toFixed(1)}KB` : `${size}B`;
        structure +=
          prefix +
          (isLast ? "└── " : "├── ") +
          `📄 ${file} (${sizeStr}) [${ext || "sin ext"}]\n`;
      }
    } catch (e) {
      structure +=
        prefix + (isLast ? "└── " : "├── ") + `❌ ${file} (error de acceso)\n`;
    }
  });

  return structure;
}

// Ruta para chat simple
app.post("/api/chat", async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: "El mensaje es requerido" });
    }

    const requestBody = {
      ...config.getDefaultBody(),
      messages: [
        ...(context ? [{ role: "system", content: context }] : []),
        { role: "user", content: message },
      ],
    };

    const response = await axios.post(config.deepseekApiUrl, requestBody, {
      headers: config.getHeaders(),
    });

    const reply = response.data.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error("Error en /api/chat:", error.response?.data || error.message);
    res.status(500).json({
      error: "Error al comunicarse con DeepSeek",
      details: error.response?.data || error.message,
    });
  }
});

// Ruta para analizar un archivo específico
app.post("/api/analyze-file", async (req, res) => {
  try {
    const { filePath, question } = req.body;

    if (!filePath || !question) {
      return res.status(400).json({
        error: "filePath y question son requeridos",
      });
    }

    // Construir ruta absoluta al archivo
    const absolutePath = path.join(__dirname, "..", filePath);

    // Leer el archivo
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: "Archivo no encontrado" });
    }

    const fileContent = fs.readFileSync(absolutePath, "utf8");
    const fileName = path.basename(filePath);

    // Preparar mensaje para DeepSeek
    const message = `
Archivo: ${fileName}
Ruta: ${filePath}

Contenido del archivo:
\`\`\`
${fileContent}
\`\`\`

Pregunta: ${question}

Por favor, analiza este archivo y responde a la pregunta.
        `;

    const requestBody = {
      ...config.getDefaultBody(),
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente de código especializado en análisis de archivos. Analiza el código proporcionado y responde preguntas técnicas.",
        },
        { role: "user", content: message },
      ],
    };

    const response = await axios.post(config.deepseekApiUrl, requestBody, {
      headers: config.getHeaders(),
    });

    const reply = response.data.choices[0].message.content;
    res.json({
      fileName,
      filePath,
      reply,
    });
  } catch (error) {
    console.error("Error en /api/analyze-file:", error);
    res.status(500).json({
      error: "Error al analizar el archivo",
      details: error.message,
    });
  }
});

// Ruta para obtener información del proyecto
app.get("/api/project-info", (req, res) => {
  try {
    const projectRoot = path.join(__dirname, "..");
    const packageJsonPath = path.join(projectRoot, "package.json");

    let projectInfo = {
      name: "AllSeasonFlowers",
      rootPath: projectRoot,
      hasPackageJson: fs.existsSync(packageJsonPath),
    };

    if (projectInfo.hasPackageJson) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      projectInfo.packageName = packageJson.name;
      projectInfo.version = packageJson.version;
      projectInfo.dependencies = packageJson.dependencies;
    }

    res.json(projectInfo);
  } catch (error) {
    console.error("Error en /api/project-info:", error);
    res
      .status(500)
      .json({ error: "Error al obtener información del proyecto" });
  }
});

// Iniciar servidor
app.listen(config.port, () => {
  console.log(
    `🚀 Servidor DeepSeek Integration iniciado en http://localhost:${config.port}`,
  );
  console.log(
    `🔑 API Key configurada: ${config.deepseekApiKey ? "✅ Sí" : "❌ No"}`,
  );
  console.log(`📁 Proyecto: AllSeasonFlowers`);
});
