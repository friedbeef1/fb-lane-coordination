import { randomBytes } from 'crypto';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

// In-memory collections
const users = new Map<string, User>();
const sessions = new Map<string, Session>();

/**
 * Creates and stores a new user.
 */
export function createUser(username: string, passwordHash: string): User {
  const user: User = {
    id: randomBytes(16).toString('hex'),
    username,
    passwordHash,
    createdAt: new Date(),
  };
  users.set(user.id, user);
  return user;
}

/**
 * Retrieves a user by their username.
 */
export function getUserByUsername(username: string): User | undefined {
  for (const user of users.values()) {
    if (user.username.toLowerCase() === username.toLowerCase()) {
      return user;
    }
  }
  return undefined;
}

/**
 * Retrieves a user by their ID.
 */
export function getUserById(id: string): User | undefined {
  return users.get(id);
}

/**
 * Creates and stores a secure session for a user.
 */
export function createSession(userId: string): Session {
  const token = randomBytes(32).toString('hex');
  const session: Session = {
    id: randomBytes(16).toString('hex'),
    userId,
    token,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Valid for 24 hours
    createdAt: new Date(),
  };
  sessions.set(token, session);
  return session;
}

/**
 * Retrieves a session by its token.
 * Automatically invalidates and deletes the session if it has expired.
 */
export function getSessionByToken(token: string): Session | undefined {
  const session = sessions.get(token);
  if (!session) return undefined;
  
  if (session.expiresAt.getTime() < Date.now()) {
    sessions.delete(token);
    return undefined;
  }
  return session;
}

/**
 * Invalidates (deletes) a session token.
 */
export function deleteSession(token: string): boolean {
  return sessions.delete(token);
}

/**
 * Clears the in-memory database.
 * Useful for resetting state between unit tests.
 */
export function clearDb(): void {
  users.clear();
  sessions.clear();
}
