## PureMCP

A lightweight, dependency-free JavaScript server for the **Model Context Protocol (MCP)**. PureMCP enables developers to quickly build and run MCP-compliant servers with minimal setup, supporting both **stdio** and **HTTP streaming** transports. It’s ideal for prototyping, learning, or deploying in minimal environments without the need for TypeScript or external libraries like Zod or FastMCP.



## Features

- **Pure JavaScript**: No external dependencies, ensuring a small footprint and easy deployment.
- **Tool Execution**: Define and execute tools (e.g., add numbers, generate poems) with parameter validation.
- **Streaming Support**: Real-time streaming of tool outputs using Server-Sent Events (SSE) for HTTP or stdio.
- **Resource Management**: Serve resources like logs or system status via URIs (e.g., `file:///logs/app.log`).
- **Health Checks**: Configurable `/health` endpoint for monitoring server status.
- **Test Suite**: Includes a test script (`test-mcp.js`) to verify tools, resources, and streaming.
- **Flexible Transports**: Supports both local stdio and networked HTTP streaming.

## What is PureMCP?

PureMCP is a minimal implementation of an MCP server, designed to handle structured client requests for tools and resources as per the **Model Context Protocol**. MCP enables communication between clients (e.g., AI models, developer tools, or web apps) and servers that expose executable tools, data resources, and prompts. Unlike the official MCP SDK or FastMCP, PureMCP uses pure JavaScript, making it lightweight and accessible for developers who prefer simplicity.

### Key Capabilities

- **Tools**: Execute functions like `add` (adds two numbers) or `stream-poem` (generates a poem line by line).
- **Resources**: Serve data like logs or system status, accessible via URIs.
- **Streaming**: Deliver real-time updates for interactive applications.
- **Health Monitoring**: Check server status via HTTP endpoints.

## Use Cases

PureMCP is versatile and can be used in various scenarios, including:

1. **AI Integration with LLMs**:

   - Integrate with large language models (LLMs) to execute server-side functions or fetch data.
   - Example: An AI-powered IDE like Cursor uses the `greet` tool to personalize messages or fetches logs for debugging.

2. **Developer Tools and Automation**:

   - Provide server-side functionality for CLIs, IDEs, or CI/CD pipelines.
   - Example: Fetch application logs via `file:///logs/app.log` for debugging.

3. **Real-Time Applications**:

   - Stream data to web clients for live updates, such as poem generation or progress reports.
   - Example: A dashboard displays live poem lines from the `stream-poem` tool.

4. **Microservices and APIs**:

   - Serve as a lightweight backend for microservices exposing structured APIs.
   - Example: The `process-data` tool monitors data processing tasks in a pipeline.

5. **Prototyping and Testing**:

   - Rapidly prototype MCP servers for experimentation or learning.
   - Example: Use the included test script to verify functionality without complex setup.

6. **Cross-Platform Compatibility**:

   - Support clients across platforms (CLI, web, or AI tools) using stdio or HTTP.
   - Example: A desktop app uses stdio, while a web app uses HTTP streaming.

## Prerequisites

- **Node.js**: Version 14 or higher. Download from nodejs.org or verify with:

  ```bash
  node --version
  ```

- **Files**: Ensure you have `mcp-server.js` and `test-mcp.js` saved in your project directory.

## Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/MrGranday/PureMCP.git
   cd PureMCP
   ```

2. **Initialize (Optional)**: Create a `package.json` for future extensions:

   ```bash
   npm init -y
   ```

   No dependencies are required, as PureMCP is pure JavaScript.

3. **Directory Structure**: Ensure your project directory contains:

   ```
   PureMCP/
   ├── mcp-server.js
   ├── test-mcp.js
   ├── README.md
   ```

## Quickstart

### Run the Server

PureMCP supports two transport modes: **stdio** (local, command-line) and **httpStream** (networked, HTTP-based).

#### Stdio Transport

Run the server using stdio for local JSON-based communication:

```bash
node mcp-server.js
```

**Output**:

```
MCP Server running on stdio
```

#### HTTP Streaming Transport

Run the server with HTTP streaming on port 8080 (or another port):

```bash
node mcp-server.js --transport http-stream --port 8080
```

**Output**:

```
MCP Server running at http://localhost:8080/mcp
Resource endpoint available at http://localhost:8080/resource/
Health check available at http://localhost:8080/health
```

### Run the Tests

The included `test-mcp.js` script tests the server’s tools, resources, and streaming capabilities. Run tests in the same transport mode as the server.

#### Stdio Tests

1. Start the server: `node mcp-server.js`

2. In a new terminal, run:

   ```bash
   node test-mcp.js
   ```

3. **Expected Output**:

   ```
   Starting stdio tests...
   Stdio response: { content: [ { type: 'text', text: '8' } ] }  // add tool (5 + 3)
   Stdio response: { content: [ { type: 'text', text: 'Poem about nature - line 1' } ] }
   Stdio response: { content: [ { type: 'text', text: 'Poem about nature - line 2' } ] }
   Stdio response: { content: [ { type: 'text', text: 'Poem about nature - line 3' } ] }
   Stdio response: { content: [ { type: 'text', text: 'Poem about nature - line 4' } ] }
   Stdio response: { content: [ { type: 'text', text: 'Processing complete!' } ] }  // process-data tool
   ```

#### HTTP Streaming Tests

1. Start the server: `node mcp-server.js --transport http-stream --port 8080`

2. Run:

   ```bash
   node test-mcp.js --transport http-stream --port 8080
   ```

3. **Expected Output**:

   ```
   Starting HTTP tests...
   Testing add tool...
   Add result: { content: [ { type: 'text', text: '30' } ] }  // add tool (10 + 20)
   Testing stream-poem tool...
   HTTP stream event: { content: [ { type: 'text', text: 'Poem about ocean - line 1' } ] }
   HTTP stream event: { content: [ { type: 'text', text: 'Poem about ocean - line 2' } ] }
   HTTP stream event: { content: [ { type: 'text', text: 'Poem about ocean - line 3' } ] }
   HTTP stream event: { content: [ { type: 'text', text: 'Poem about ocean - line 4' } ] }
   Testing process-data tool...
   HTTP stream event: { content: [ { type: 'text', text: 'Processed 0 of 15 items...' } ] }
   HTTP stream event: { content: [ { type: 'text', text: 'Processed 10 of 15 items...' } ] }
   Resource response: Sample log entry: Server started successfully\nSample log entry: Processed request
   Health response: ok
   ```

### Manual Testing

You can test PureMCP manually without the test script.

#### Stdio Manual Testing

1. Run the server:

   ```bash
   node mcp-server.js
   ```

2. Send a JSON request:

   ```bash
   echo '{"method":"tools/execute","params":{"name":"add","args":{"a":7,"b":2}}}' | node mcp-server.js
   ```

3. **Expected Output**:

   ```
   {"content":[{"type":"text","text":"9"}]}
   ```

#### HTTP Manual Testing

1. Run the server:

   ```bash
   node mcp-server.js --transport http-stream --port 8080
   ```

2. Test the `add` tool:

   ```bash
   curl -X POST http://localhost:8080/mcp -H "Content-Type: application/json" -d '{"method":"tools/execute","params":{"name":"add","args":{"a":7,"b":2}}}'
   ```

   **Output**:

   ```
   {"content":[{"type":"text","text":"9"}]}
   ```

3. Test the resource endpoint:

   ```bash
   curl http://localhost:8080/resource/file:///logs/app.log
   ```

   **Output**:

   ```
   Sample log entry: Server started successfully
   Sample log entry: Processed request
   ```

4. Test the health endpoint:

   ```bash
   curl http://localhost:8080/health
   ```

   **Output**:

   ```
   ok
   ```

5. Test the streaming poem tool (requires SSE support):

   ```bash
   curl -N http://localhost:8080/mcp -H "Content-Type: application/json" -d '{"method":"tools/execute","params":{"name":"stream-poem","args":{"theme":"sky"}}}'
   ```

   **Output** (streamed over time):

   ```
   data: {"content":[{"type":"text","text":"Poem about sky - line 1"}]}
   data: {"content":[{"type":"text","text":"Poem about sky - line 2"}]}
   data: {"content":[{"type":"text","text":"Poem about sky - line 3"}]}
   data: {"content":[{"type":"text","text":"Poem about sky - line 4"}]}
   ```

## Included Tools and Resources

PureMCP includes test data to demonstrate its capabilities:

### Tools

- **add**: Adds two numbers.
  - Parameters: `a` (number, required), `b` (number, required).
  - Example: `{"method":"tools/execute","params":{"name":"add","args":{"a":5,"b":3}}}`
  - Output: `{"content":[{"type":"text","text":"8"}]}`
- **stream-poem**: Generates a poem line by line based on a theme.
  - Parameters: `theme` (string, required).
  - Example: `{"method":"tools/execute","params":{"name":"stream-poem","args":{"theme":"ocean"}}}`
  - Output: Streamed lines like `{"content":[{"type":"text","text":"Poem about ocean - line 1"}]}`
- **process-data**: Processes a dataset with progress updates.
  - Parameters: `datasetSize` (number, required).
  - Example: `{"method":"tools/execute","params":{"name":"process-data","args":{"datasetSize":15}}}`
  - Output: Streamed progress like `{"content":[{"type":"text","text":"Processed 0 of 15 items..."}]}`, ending with `Processing complete!`

### Resources

- **file:///logs/app.log**: Sample application logs.
  - Content: `"Sample log entry: Server started successfully\nSample log entry: Processed request"`
- **system://status**: System status.
  - Content: `"System operational"`

## Extending PureMCP

You can extend PureMCP by adding new tools or resources in `mcp-server.js`.

### Add a New Tool

Modify the `addTestData` method in `mcp-server.js`:

```javascript
this.addTool({
  name: "greet",
  description: "Greet a user",
  parameters: {
    name: { type: "string", description: "User's name", required: true },
  },
  execute: async (args) => `Hello, ${args.name}!`,
});
```

Test it:

```bash
curl -X POST http://localhost:8080/mcp -H "Content-Type: application/json" -d '{"method":"tools/execute","params":{"name":"greet","args":{"name":"Alice"}}}'
```

**Output**:

```
{"content":[{"type":"text","text":"Hello, Alice!"}]}
```

### Add a New Resource

Add to `addTestData`:

```javascript
this.addResource({
  uri: "file:///config/settings.txt",
  name: "Settings File",
  mimeType: "text/plain",
  load: async () => ({ text: "Sample settings content" }),
});
```

Test it:

```bash
curl http://localhost:8080/resource/file:///config/settings.txt
```

**Output**:

```
Sample settings content
```

### Advanced Extensions

- **Authentication**: Add OAuth or API key support in `mcp-server.js`.
- **Prompts**: Implement an `addPrompt` method for reusable LLM prompt templates.
- **Validation**: Enhance parameter validation with custom JSON schemas.
- **Resources**: Support binary data or resource templates for complex use cases.

## Troubleshooting

- **Port in Use**: If port 8080 is occupied, use a different port:

  ```bash
  node mcp-server.js --transport http-stream --port 8081
  ```

- **No Response**: Ensure the server is running and transport types match (stdio or HTTP).

- **JSON Errors**: Verify JSON input is valid for manual tests.

- **Streaming Issues**: Use SSE-compatible clients (e.g., `curl -N`) for streaming tools.

## Comparison with Other MCP Servers

| Feature | PureMCP | FastMCP | Official MCP SDK |
| --- | --- | --- | --- |
| **Language** | Pure JavaScript | TypeScript | Varies |
| **Dependencies** | None | Zod, ArkType, Valibot | Varies |
| **Transports** | Stdio, HTTP streaming | Stdio, HTTP streaming | Depends on implementation |
| **Ease of Use** | High (minimal setup) | Moderate (requires TS) | Varies |
| **Best For** | Prototyping, minimal envs | Production with validation | Full MCP compliance |

PureMCP is ideal for developers who want a simple, dependency-free MCP server for quick setups or learning.

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

Please include tests in `test-mcp.js` for new features.

## License

MIT License - Feel free to use, modify, and distribute PureMCP.

## Community

- Share feedback or issues on the GitHub Issues page.
- Join discussions on JavaScript or MCP communities (e.g., X, Discord, or relevant forums).
- Follow updates by starring the repository!

## Acknowledgments

Inspired by the FastMCP project but built for simplicity and pure JavaScript environments.

---

*Built with ❤️ by \[Osman Ghani Granday\]. *