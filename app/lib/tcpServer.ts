import TcpSocket from 'react-native-tcp-socket';

const PORT = 8888;

let server: ReturnType<typeof TcpSocket.createServer> | null = null;

function createHttpResponse(body: string): string {
  const headers = [
    'HTTP/1.1 200 OK',
    'Content-Type: text/html; charset=utf-8',
    `Content-Length: ${body.length}`,
    'Connection: close',
    '',
    '',
  ].join('\r\n');
  return headers + body;
}

export function startTcpServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (server) {
      console.log('TCP server already running on port', PORT);
      resolve();
      return;
    }

    server = TcpSocket.createServer((socket) => {
      console.log('Client connected:', socket.remoteAddress);

      socket.on('data', (data) => {
        const request = data.toString();
        console.log('Received request:', request.split('\r\n')[0]);

        // Send HTTP response with "uwu"
        const response = createHttpResponse('uwu');
        socket.write(response);
        socket.destroy();
      });

      socket.on('error', (error) => {
        console.log('Socket error:', error);
      });

      socket.on('close', () => {
        console.log('Client disconnected');
      });
    });

    server.on('error', (error) => {
      console.error('Server error:', error);
      reject(error);
    });

    server.listen({ port: PORT, host: '0.0.0.0' }, () => {
      console.log(`HTTP server listening on port ${PORT}`);
      resolve();
    });
  });
}

export function stopTcpServer(): void {
  if (server) {
    server.close();
    server = null;
    console.log('TCP server stopped');
  }
}

export function isServerRunning(): boolean {
  return server !== null;
}
