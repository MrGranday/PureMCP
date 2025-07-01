

// /**
//  * Test script for MCP Server
//  * Tests tools and resources via stdio and HTTP transports
//  * Run with: node test-mcp.js [--transport http-stream --port 8080]
//  */

// const http = require("http");

// // Parse command-line arguments
// function parseArgs() {
//   const args = {};
//   for (let i = 2; i < process.argv.length; i++) {
//     if (process.argv[i].startsWith('--')) {
//       const key = process.argv[i].replace('--', '');
//       const value = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true;
//       args[key] = value;
//       if (value !== true) i++; // Skip the value
//     }
//   }
//   return args;
// }

// async function testStdio() {
//   console.log("Starting stdio tests...");

//   // Test add tool
//   const addRequest = JSON.stringify({
//     method: "tools/execute",
//     params: { name: "add", args: { a: 5, b: 3 } },
//   });
//   process.stdout.write(addRequest + "\n");

//   // Test stream-poem tool
//   const poemRequest = JSON.stringify({
//     method: "tools/execute",
//     params: { name: "stream-poem", args: { theme: "nature" } },
//   });
//   process.stdout.write(poemRequest + "\n");

//   // Test process-data tool
//   const processRequest = JSON.stringify({
//     method: "tools/execute",
//     params: { name: "process-data", args: { datasetSize: 20 } },
//   });
//   process.stdout.write(processRequest + "\n");

//   // Capture responses
//   process.stdin.setEncoding("utf8");
//   process.stdin.on("data", (data) => {
//     const responses = data.trim().split("\n");
//     responses.forEach((response) => {
//       try {
//         const result = JSON.parse(response);
//         console.log("Stdio response:", result);
//       } catch (error) {
//         console.error("Stdio error:", error.message);
//       }
//     });
//   });
// }

// async function testHttp(port = 8080) {
//   console.log("Starting HTTP tests...");

//   async function sendRequest(method, params) {
//     return new Promise((resolve, reject) => {
//       const req = http.request(
//         {
//           hostname: "localhost",
//           port,
//           path: "/mcp",
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//         },
//         (res) => {
//           let data = "";
//           res.on("data", (chunk) => {
//             data += chunk;
//             // For streaming responses, process SSE data
//             if (res.headers["content-type"] === "text/event-stream") {
//               const events = data.split("\n\n");
//               data = events.pop(); // Keep incomplete event
//               events.forEach((event) => {
//                 if (event.startsWith("data: ")) {
//                   try {
//                     const parsed = JSON.parse(event.slice(6));
//                     console.log("HTTP stream event:", parsed);
//                   } catch (error) {
//                     console.error("HTTP stream parse error:", error.message);
//                   }
//                 }
//               });
//             }
//           });
//           res.on("end", () => {
//             if (res.headers["content-type"] === "application/json") {
//               try {
//                 resolve(JSON.parse(data));
//               } catch (error) {
//                 reject(error);
//               }
//             } else {
//               resolve();
//             }
//           });
//         },
//       );
//       req.on("error", reject);
//       req.write(JSON.stringify({ method, params }));
//       req.end();
//     });
//   }

//   // Test add tool
//   console.log("Testing add tool...");
//   const addResult = await sendRequest("tools/execute", {
//     name: "add",
//     args: { a: 10, b: 20 },
//   });
//   console.log("Add result:", addResult);

//   // Test stream-poem tool
//   console.log("Testing stream-poem tool...");
//   await sendRequest("tools/execute", {
//     name: "stream-poem",
//     args: { theme: "ocean" },
//   });

//   // Test process-data tool
//   console.log("Testing process-data tool...");
//   await sendRequest("tools/execute", {
//     name: "process-data",
//     args: { datasetSize: 15 },
//   });

//   // Test resource endpoint
//   console.log("Testing resource endpoint...");
//   const resourceReq = http.request(
//     {
//       hostname: "localhost",
//       port,
//       path: "/resource/file:///logs/app.log",
//       method: "GET",
//     },
//     (res) => {
//       let data = "";
//       res.on("data", (chunk) => (data += chunk));
//       res.on("end", () => console.log("Resource response:", data));
//     },
//   );
//   resourceReq.on("error", (error) => console.error("Resource error:", error.message));
//   resourceReq.end();

//   // Test health endpoint
//   console.log("Testing health endpoint...");
//   const healthReq = http.request(
//     {
//       hostname: "localhost",
//       port,
//       path: "/health",
//       method: "GET",
//     },
//     (res) => {
//       let data = "";
//       res.on("data", (chunk) => (data += chunk));
//       res.on("end", () => console.log("Health response:", data));
//     },
//   );
//   healthReq.on("error", (error) => console.error("Health error:", error.message));
//   healthReq.end();
// }

// const args = parseArgs();
// const transportType = args.transport || "stdio";
// const port = parseInt(args.port || 8080, 10);

// if (transportType === "httpStream") {
//   testHttp(port);
// } else {
//   testStdio();
// }



const http = require("http");

// Parse command-line arguments
function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i].startsWith('--')) {
      const key = process.argv[i].replace('--', '');
      const value = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true;
      args[key] = value;
      if (value !== true) i++; // Skip the value
    }
  }
  console.log("[DEBUG] Parsed arguments:", args); // Debug logging
  return args;
}

async function testStdio() {
  console.log("Starting stdio tests...");

  // Test add tool
  const addRequest = JSON.stringify({
    method: "tools/execute",
    params: { name: "add", args: { a: 5, b: 3 } },
  });
  process.stdout.write(addRequest + "\n");

  // Test stream-poem tool
  const poemRequest = JSON.stringify({
    method: "tools/execute",
    params: { name: "stream-poem", args: { theme: "nature" } },
  });
  process.stdout.write(poemRequest + "\n");

  // Test process-data tool
  const processRequest = JSON.stringify({
    method: "tools/execute",
    params: { name: "process-data", args: { datasetSize: 20 } },
  });
  process.stdout.write(processRequest + "\n");

  // Capture responses
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (data) => {
    const responses = data.trim().split("\n");
    responses.forEach((response) => {
      try {
        const result = JSON.parse(response);
        console.log("Stdio response:", result);
      } catch (error) {
        console.error("Stdio error:", error.message);
      }
    });
  });
}

async function testHttp(port = 8080) {
  console.log("Starting HTTP tests...");

  async function sendRequest(method, params) {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: "localhost",
          port,
          path: "/mcp",
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
            // For streaming responses, process SSE data
            if (res.headers["content-type"] === "text/event-stream") {
              const events = data.split("\n\n");
              data = events.pop(); // Keep incomplete event
              events.forEach((event) => {
                if (event.startsWith("data: ")) {
                  try {
                    const parsed = JSON.parse(event.slice(6));
                    console.log("HTTP stream event:", parsed);
                  } catch (error) {
                    console.error("HTTP stream parse error:", error.message);
                  }
                }
              });
            }
          });
          res.on("end", () => {
            if (res.headers["content-type"] === "application/json") {
              try {
                resolve(JSON.parse(data));
              } catch (error) {
                reject(error);
              }
            } else {
              resolve();
            }
          });
        },
      );
      req.on("error", reject);
      req.write(JSON.stringify({ method, params }));
      req.end();
    });
  }

  // Test add tool
  console.log("Testing add tool...");
  const addResult = await sendRequest("tools/execute", {
    name: "add",
    args: { a: 10, b: 20 },
  });
  console.log("Add result:", addResult);

  // Test stream-poem tool
  console.log("Testing stream-poem tool...");
  await sendRequest("tools/execute", {
    name: "stream-poem",
    args: { theme: "ocean" },
  });

  // Test process-data tool
  console.log("Testing process-data tool...");
  await sendRequest("tools/execute", {
    name: "process-data",
    args: { datasetSize: 15 },
  });

  // Test resource endpoint
  console.log("Testing resource endpoint...");
  const resourceReq = http.request(
    {
      hostname: "localhost",
      port,
      path: "/resource/file:///logs/app.log",
      method: "GET",
    },
    (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => console.log("Resource response:", data));
    },
  );
  resourceReq.on("error", (error) => console.error("Resource error:", error.message));
  resourceReq.end();

  // Test health endpoint
  console.log("Testing health endpoint...");
  const healthReq = http.request(
    {
      hostname: "localhost",
      port,
      path: "/health",
      method: "GET",
    },
    (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => console.log("Health response:", data));
    },
  );
  healthReq.on("error", (error) => console.error("Health error:", error.message));
  healthReq.end();
}

const args = parseArgs();
const transportType = (args.transport || "stdio").toLowerCase();
console.log("[DEBUG] Transport type:", transportType);

if (transportType === "httpstream" || transportType === "http-stream") {
  testHttp(parseInt(args.port || 8080, 10));
} else {
  testStdio();
}