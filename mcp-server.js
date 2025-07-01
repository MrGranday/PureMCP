
/**
 * Simple MCP Server in pure JavaScript
 * Supports tool handling, HTTP streaming, resources, and test data
 * Run with: node mcp-server.js [--transport httpStream --port 8080]
 */

class MCPServer {
  constructor(options = {}) {
    this.options = {
      name: options.name || "MCP Server",
      version: options.version || "1.0.0",
      ping: {
        enabled: options.ping?.enabled ?? true,
        intervalMs: options.ping?.intervalMs || 5000,
        logLevel: options.ping?.logLevel || "debug",
      },
      health: {
        enabled: options.health?.enabled ?? true,
        path: options.health?.path || "/health",
        message: options.health?.message || "ok",
        status: options.health?.status || 200,
      },
    };
    this.tools = [];
    this.resources = [];
    this.sessions = [];
    this.httpServer = null;
    // Parse arguments once during construction
    this.args = this.parseArgs();
    console.log("[DEBUG] Parsed arguments:", this.args);

    // Add test data
    this.addTestData();
  }

  // Add a tool to the server
  addTool(tool) {
    this.tools.push({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters || {},
      execute: tool.execute,
      annotations: tool.annotations || {},
      timeoutMs: tool.timeoutMs || 0,
    });
  }

  // Add a resource to the server
  addResource(resource) {
    this.resources.push({
      uri: resource.uri,
      name: resource.name,
      mimeType: resource.mimeType,
      load: resource.load,
    });
  }

  // Embed a resource by URI
  async embedded(uri) {
    const resource = this.resources.find((r) => r.uri === uri);
    if (resource) {
      const result = await resource.load();
      return {
        uri,
        mimeType: resource.mimeType,
        text: result.text,
        blob: result.blob,
      };
    }
    throw new Error(`Resource not found: ${uri}`);
  }

  // Handle tool execution
  async executeTool(tool, args, context) {
    try {
      // Basic parameter validation
      for (const [key, param] of Object.entries(tool.parameters)) {
        if (param.required && args[key] === undefined) {
          throw new Error(`Missing required parameter: ${key}`);
        }
      }

      const result = await Promise.race([
        tool.execute(args, context),
        tool.timeoutMs
          ? new Promise((_, reject) =>
              setTimeout(
                () =>
                  reject(
                    new Error(
                      `Tool '${tool.name}' timed out after ${tool.timeoutMs}ms`,
                    ),
                  ),
                tool.timeoutMs,
              ),
            )
          : Promise.resolve(),
      ]);

      if (result === undefined || result === null) {
        return { content: [] };
      } else if (typeof result === "string") {
        return { content: [{ type: "text", text: result }] };
      } else if (result.type) {
        return { content: [result] };
      }
      return result;
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Tool '${tool.name}' execution failed: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  // Add test data (tools and resources)
  addTestData() {
    // Test tool: Addition
    this.addTool({
      name: "add",
      description: "Add two numbers",
      parameters: {
        a: { type: "number", description: "First number", required: true },
        b: { type: "number", description: "Second number", required: true },
      },
      execute: async (args, { log }) => {
        log.info(`Adding ${args.a} and ${args.b}`);
        return String(args.a + args.b);
      },
    });

    // Test tool: Streaming poem
    this.addTool({
      name: "stream-poem",
      description: "Generate a poem line by line",
      parameters: {
        theme: { type: "string", description: "Theme for the poem", required: true },
      },
      annotations: { streamingHint: true, readOnlyHint: true },
      execute: async (args, { streamContent }) => {
        const lines = [
          `Poem about ${args.theme} - line 1`,
          `Poem about ${args.theme} - line 2`,
          `Poem about ${args.theme} - line 3`,
          `Poem about ${args.theme} - line 4`,
        ];
        for (const line of lines) {
          await streamContent({ type: "text", text: line });
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      },
    });

    // Test tool: Progress reporting
    this.addTool({
      name: "process-data",
      description: "Process data with progress updates",
      parameters: {
        datasetSize: {
          type: "number",
          description: "Number of items to process",
          required: true,
        },
      },
      annotations: { streamingHint: true },
      execute: async (args, { reportProgress, streamContent }) => {
        const total = args.datasetSize;
        for (let i = 0; i < total; i++) {
          await reportProgress({ progress: i + 1, total });
          if (i % 10 === 0) {
            await streamContent({
              type: "text",
              text: `Processed ${i} of ${total} items...`,
            });
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        return "Processing complete!";
      },
    });

    // Test resource: Application logs
    this.addResource({
      uri: "file:///logs/app.log",
      name: "Application Logs",
      mimeType: "text/plain",
      load: async () => ({
        text: "Sample log entry: Server started successfully\nSample log entry: Processed request",
      }),
    });

    // Test resource: System status
    this.addResource({
      uri: "system://status",
      name: "System Status",
      mimeType: "text/plain",
      load: async () => ({ text: "System operational" }),
    });
  }

  // Parse command-line arguments
  parseArgs() {
    const args = {};
    for (let i = 2; i < process.argv.length; i++) {
      if (process.argv[i].startsWith('--')) {
        const key = process.argv[i].replace('--', '');
        const value = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true;
        args[key] = value;
        if (value !== true) i++; // Skip the value
      }
    }
    return args;
  }

  // Start the server
  async start(options = {}) {
    const transportType = (options.transportType || this.args.transport || "stdio").toLowerCase();
    const port = options.httpStream?.port || parseInt(this.args.port || 8080, 10);
    const endpoint = options.httpStream?.endpoint || "/mcp";

    console.log("[DEBUG] Transport type:", transportType);

    if (transportType === "httpstream" || transportType === "http-stream") {
      const http = require("http");
      this.httpServer = http.createServer(async (req, res) => {
        const url = new URL(req.url, `http://${req.headers.host}`);

        // Health check endpoint
        if (
          this.options.health.enabled &&
          req.method === "GET" &&
          url.pathname === this.options.health.path
        ) {
          res
            .writeHead(this.options.health.status, { "Content-Type": "text/plain" })
            .end(this.options.health.message);
          return;
        }

        // MCP endpoint
        if (req.method === "POST" && url.pathname === endpoint) {
          let body = "";
          req.on("data", (chunk) => (body += chunk));
          req.on("end", async () => {
            try {
              const request = JSON.parse(body);
              if (request.method === "tools/execute") {
                const tool = this.tools.find(
                  (t) => t.name === request.params.name,
                );
                if (!tool) {
                  res.writeHead(404).end(
                    JSON.stringify({
                      error: `Tool '${request.params.name}' not found`,
                    }),
                  );
                  return;
                }

                const context = {
                  log: {
                    debug: (msg, data) =>
                      console.log(`[DEBUG] ${msg}`, data || ""),
                    info: (msg, data) => console.log(`[INFO] ${msg}`, data || ""),
                    warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ""),
                    error: (msg, data) =>
                      console.error(`[ERROR] ${msg}`, data || ""),
                  },
                  reportProgress: async (progress) => {
                    console.log("[PROGRESS]", progress);
                    if (res.writable) {
                      res.write(`data: ${JSON.stringify({ progress })}\n\n`);
                    }
                  },
                  streamContent: async (content) => {
                    if (res.writable) {
                      res.write(`data: ${JSON.stringify({ content })}\n\n`);
                    }
                  },
                };

                // Set headers for streaming
                if (tool.annotations.streamingHint) {
                  res.writeHead(200, {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    Connection: "keep-alive",
                  });
                }

                const result = await this.executeTool(
                  tool,
                  request.params.args,
                  context,
                );
                if (!tool.annotations.streamingHint) {
                  res
                    .writeHead(200, { "Content-Type": "application/json" })
                    .end(JSON.stringify(result));
                } else {
                  res.end();
                }
              } else {
                res.writeHead(400).end(
                  JSON.stringify({ error: "Invalid method" }),
                );
              }
            } catch (error) {
              res.writeHead(500).end(
                JSON.stringify({ error: error.message }),
              );
            }
          });
          return;
        }

        // Resource endpoint (for testing)
        if (req.method === "GET" && url.pathname.startsWith("/resource/")) {
          const uri = url.pathname.replace("/resource/", "");
          try {
            const resource = await this.embedded(uri);
            res
              .writeHead(200, { "Content-Type": resource.mimeType })
              .end(resource.text || resource.blob);
          } catch (error) {
            res.writeHead(404).end(
              JSON.stringify({ error: error.message }),
            );
          }
          return;
        }

        // 404 for unhandled requests
        res.writeHead(404).end();
      });

      this.httpServer.listen(port, () => {
        console.log(
          `MCP Server running at http://localhost:${port}${endpoint}`,
        );
        console.log(`Resource endpoint available at http://localhost:${port}/resource/`);
        console.log(`Health check available at http://localhost:${port}${this.options.health.path}`);
      });

      // Start ping mechanism for HTTP streaming
      if (this.options.ping.enabled) {
        setInterval(() => {
          console.log(`[PING] Server is alive`);
        }, this.options.ping.intervalMs);
      }
    } else {
      // Stdio transport
      process.stdin.setEncoding("utf8");
      let buffer = "";
      process.stdin.on("data", async (chunk) => {
        buffer += chunk;
        const lines = buffer.split("\n");
        buffer = lines.pop(); // Keep incomplete line in buffer
        for (const line of lines) {
          try {
            const request = JSON.parse(line);
            if (request.method === "tools/execute") {
              const tool = this.tools.find((t) => t.name === request.params.name);
              if (!tool) {
                process.stdout.write(
                  JSON.stringify({
                    error: `Tool '${request.params.name}' not found`,
                  }) + "\n",
                );
                continue;
              }

              const context = {
                log: {
                  debug: (msg, data) =>
                    console.log(`[DEBUG] ${msg}`, data || ""),
                  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ""),
                  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ""),
                  error: (msg, data) => console.error(`[ERROR] ${msg}`, data || ""),
                },
                reportProgress: async (progress) => {
                  console.log("[PROGRESS]", progress);
                  process.stdout.write(
                    JSON.stringify({ progress }) + "\n",
                  );
                },
                streamContent: async (content) => {
                  process.stdout.write(
                    JSON.stringify({ content }) + "\n",
                  );
                },
              };

              const result = await this.executeTool(
                tool,
                request.params.args,
                context,
              );
              process.stdout.write(JSON.stringify(result) + "\n");
            }
          } catch (error) {
            process.stdout.write(
              JSON.stringify({ error: error.message }) + "\n",
            );
          }
        }
      });
      console.log("MCP Server running on stdio");
    }
  }

  // Stop the server
  async stop() {
    if (this.httpServer) {
      await new Promise((resolve) => this.httpServer.close(resolve));
      this.httpServer = null;
    }
  }
}

// Create and start the server
const server = new MCPServer({
  name: "Test MCP Server",
  version: "1.0.0",
  ping: { intervalMs: 10000, logLevel: "debug" },
});

// Start the server
server.start({
  transportType: server.args.transport,
  httpStream: { port: parseInt(server.args.port || 8080, 10) },
});