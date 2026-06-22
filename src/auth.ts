import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';
import * as http from 'http';
import * as assert from 'assert';
import * as db from './db.ts';

// --- Cryptography & Password Hashing ---

/**
 * Hashes a password using PBKDF2 with a secure random salt.
 * Returns the salt and hash combined with a colon separator.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies a password against a stored PBKDF2 hash using timing-safe comparison.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  
  const [salt, hash] = parts;
  const testHash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  
  const bufferA = Buffer.from(hash, 'hex');
  const bufferB = Buffer.from(testHash, 'hex');
  
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

// --- Request Body Parsing ---

/**
 * Safely parses the JSON request body.
 * Limits the body size to 1MB to prevent memory exhaustion attacks.
 */
async function parseJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) { // 1MB Limit
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', err => {
      reject(err);
    });
  });
}

/**
 * Helper to extract session token from Authorization or X-Session-Token headers.
 */
function extractToken(req: http.IncomingMessage): string | undefined {
  const authHeader = req.headers['authorization'];
  if (authHeader && typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.substring(7);
  }
  
  const customHeader = req.headers['x-session-token'];
  if (customHeader && typeof customHeader === 'string') {
    return customHeader;
  }
  
  return undefined;
}

// --- Request Router & Handler ---

/**
 * Main HTTP request handler for the user authentication API.
 */
export async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Set default response headers to JSON
  res.setHeader('Content-Type', 'application/json');

  try {
    // 1. POST /api/register
    if (pathname === '/api/register' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { username, password } = body;

      if (!username || typeof username !== 'string' || username.trim().length < 3) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: 'Username must be at least 3 characters' }));
        return;
      }

      if (!password || typeof password !== 'string' || password.length < 6) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: 'Password must be at least 6 characters' }));
        return;
      }

      const existingUser = db.getUserByUsername(username);
      if (existingUser) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: 'Username is already taken' }));
        return;
      }

      const passwordHash = hashPassword(password);
      const user = db.createUser(username, passwordHash);
      const session = db.createSession(user.id);

      res.statusCode = 201;
      res.end(JSON.stringify({
        success: true,
        message: 'Registration successful',
        token: session.token,
        userId: user.id
      }));
      return;
    }

    // 2. POST /api/login
    if (pathname === '/api/login' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { username, password } = body;

      if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: 'Username and password are required' }));
        return;
      }

      const user = db.getUserByUsername(username);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        res.statusCode = 401;
        res.end(JSON.stringify({ success: false, error: 'Invalid username or password' }));
        return;
      }

      const session = db.createSession(user.id);
      res.statusCode = 200;
      res.end(JSON.stringify({
        success: true,
        message: 'Login successful',
        token: session.token,
        userId: user.id
      }));
      return;
    }

    // 3. POST /api/logout
    if (pathname === '/api/logout' && req.method === 'POST') {
      const token = extractToken(req);
      if (!token) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: 'Session token is required' }));
        return;
      }

      db.deleteSession(token);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, message: 'Logout successful' }));
      return;
    }

    // 4. GET /api/me
    if (pathname === '/api/me' && req.method === 'GET') {
      const token = extractToken(req);
      if (!token) {
        res.statusCode = 401;
        res.end(JSON.stringify({ success: false, error: 'Unauthorized' }));
        return;
      }

      const session = db.getSessionByToken(token);
      if (!session) {
        res.statusCode = 401;
        res.end(JSON.stringify({ success: false, error: 'Session expired or invalid' }));
        return;
      }

      const user = db.getUserById(session.userId);
      if (!user) {
        res.statusCode = 401;
        res.end(JSON.stringify({ success: false, error: 'User not found' }));
        return;
      }

      res.statusCode = 200;
      res.end(JSON.stringify({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          createdAt: user.createdAt
        }
      }));
      return;
    }

    // Route not found
    res.statusCode = 404;
    res.end(JSON.stringify({ success: false, error: 'Not Found' }));
  } catch (error: any) {
    res.statusCode = error.message === 'Body too large' || error.message === 'Invalid JSON' ? 400 : 500;
    res.end(JSON.stringify({ success: false, error: error.message || 'Internal Server Error' }));
  }
}

// --- Self-Contained Unit & Integration Tests ---

export async function runTests(): Promise<void> {
  console.log('🧪 Running User Auth Unit & Integration Tests...');

  // 1. Password Hashing Tests
  console.log('   Testing password hashing & verification...');
  const pw = 'SecretPassword123!';
  const hash = hashPassword(pw);
  assert.ok(hash.includes(':'), 'Hash string must contain a salt separator');
  
  const parts = hash.split(':');
  assert.strictEqual(parts.length, 2, 'Hash must split into exactly 2 components');
  assert.strictEqual(parts[0].length, 32, 'Salt length must be 32 hex chars (16 bytes)');
  
  assert.strictEqual(verifyPassword(pw, hash), true, 'Correct password should be verified successfully');
  assert.strictEqual(verifyPassword('wrongPassword', hash), false, 'Incorrect password verification must fail');
  assert.strictEqual(verifyPassword(pw, 'incorrectsalt:hash'), false, 'Malformed hash Verification must fail');

  // 2. Database Interface Tests
  console.log('   Testing database interface...');
  db.clearDb();
  
  const dummyHash = hashPassword('my-dummy-pw');
  const user = db.createUser('charlie', dummyHash);
  assert.ok(user.id, 'User ID must be generated');
  assert.strictEqual(user.username, 'charlie', 'Username must match');
  
  const retrievedByUsername = db.getUserByUsername('charlie');
  assert.ok(retrievedByUsername, 'Must find user by username');
  assert.strictEqual(retrievedByUsername?.id, user.id, 'IDs must match');
  
  const retrievedCaseInsensitive = db.getUserByUsername('CHARLIE');
  assert.ok(retrievedCaseInsensitive, 'Must find user by username case-insensitively');
  assert.strictEqual(retrievedCaseInsensitive?.id, user.id, 'Case-insensitive lookup IDs must match');

  const retrievedById = db.getUserById(user.id);
  assert.ok(retrievedById, 'Must find user by ID');
  
  const session = db.createSession(user.id);
  assert.ok(session.token, 'Session token must be generated');
  assert.strictEqual(session.userId, user.id, 'Session must map to correct user ID');
  
  const retrievedSession = db.getSessionByToken(session.token);
  assert.ok(retrievedSession, 'Must find session by token');
  
  const deleted = db.deleteSession(session.token);
  assert.strictEqual(deleted, true, 'Session deletion must succeed');
  assert.strictEqual(db.getSessionByToken(session.token), undefined, 'Deleted session must be gone');

  // 3. HTTP Server Endpoints Integration Tests
  console.log('   Testing HTTP integration endpoints...');
  db.clearDb();

  const server = http.createServer(handleRequest);
  await new Promise<void>(resolve => server.listen(0, resolve));
  const address = server.address() as any;
  const port = address.port;
  const baseUrl = `http://localhost:${port}`;

  const makeRequest = (
    path: string,
    method: 'GET' | 'POST',
    headers: Record<string, string>,
    body?: any
  ): Promise<{ status: number; data: any }> => {
    return new Promise((resolve, reject) => {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };
      
      const req = http.request(`${baseUrl}${path}`, options, res => {
        let rawData = '';
        res.on('data', chunk => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode || 0,
              data: rawData ? JSON.parse(rawData) : {},
            });
          } catch (e) {
            reject(new Error(`Failed to parse response JSON: ${rawData}`));
          }
        });
      });
      
      req.on('error', err => reject(err));
      if (body !== undefined) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  };

  // Test validation failures
  let response = await makeRequest('/api/register', 'POST', {}, { username: 'a', password: 'pw' });
  assert.strictEqual(response.status, 400);
  assert.strictEqual(response.data.success, false);
  
  // Test valid registration
  response = await makeRequest('/api/register', 'POST', {}, { username: 'testuser', password: 'securepassword123' });
  assert.strictEqual(response.status, 201);
  assert.strictEqual(response.data.success, true);
  assert.ok(response.data.token, 'Should return a session token upon registration');
  const token = response.data.token;

  // Test duplicate registration
  response = await makeRequest('/api/register', 'POST', {}, { username: 'testuser', password: 'securepassword123' });
  assert.strictEqual(response.status, 400);
  assert.strictEqual(response.data.success, false);
  assert.strictEqual(response.data.error, 'Username is already taken');

  // Test valid login
  response = await makeRequest('/api/login', 'POST', {}, { username: 'testuser', password: 'securepassword123' });
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.data.success, true);
  assert.ok(response.data.token, 'Should return a session token on login');
  
  // Test invalid login
  response = await makeRequest('/api/login', 'POST', {}, { username: 'testuser', password: 'wrongpassword' });
  assert.strictEqual(response.status, 401);
  assert.strictEqual(response.data.success, false);

  // Test unauthorized /api/me
  response = await makeRequest('/api/me', 'GET', {});
  assert.strictEqual(response.status, 401);
  assert.strictEqual(response.data.success, false);

  // Test authorized /api/me (Bearer token)
  response = await makeRequest('/api/me', 'GET', { 'Authorization': `Bearer ${token}` });
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.data.success, true);
  assert.strictEqual(response.data.user.username, 'testuser');

  // Test authorized /api/me (custom header)
  response = await makeRequest('/api/me', 'GET', { 'x-session-token': token });
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.data.success, true);

  // Test logout
  response = await makeRequest('/api/logout', 'POST', { 'Authorization': `Bearer ${token}` });
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.data.success, true);

  // Test /api/me with invalidated token
  response = await makeRequest('/api/me', 'GET', { 'Authorization': `Bearer ${token}` });
  assert.strictEqual(response.status, 401);

  // Clean up server
  await new Promise<void>((resolve, reject) => {
    server.close(err => {
      if (err) reject(err);
      else resolve();
    });
  });

  console.log('✅ All tests completed successfully!\n');
}

// Automatically run tests if this file is executed directly.
const isMain = process.argv[1] && (
  process.argv[1].endsWith('auth.ts') || 
  process.argv[1].endsWith('auth.js') || 
  process.argv.includes('--run-tests')
);

if (isMain) {
  runTests().catch(err => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  });
}
