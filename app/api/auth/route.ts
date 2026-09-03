import { createHash, randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

interface User { id: number; name: string; email: string; passwordHash: string; createdAt: string; }
const usersFile = path.join(process.cwd(), 'data', 'users.json');

async function readUsers(): Promise<User[]> {
  try { return JSON.parse(await fs.readFile(usersFile, 'utf8')); } catch { return []; }
}
async function writeUsers(users: User[]) {
  await fs.mkdir(path.dirname(usersFile), { recursive: true });
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2));
}
function hashPassword(password: string) { return createHash('sha256').update(password).digest('hex'); }
function createToken() { return randomBytes(32).toString('hex'); }

function authenticatedResponse(body: object, status = 200) {
  const response = NextResponse.json(body, { status });
  response.cookies.set('impactbridge_auth', createToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mode = body.mode === 'signup' ? 'signup' : 'login';
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const name = String(body.name ?? '').trim();

    if (!email || !password) return NextResponse.json({ detail: 'Email and password are required.' }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ detail: 'Password must be at least 6 characters.' }, { status: 400 });

    const users = await readUsers();
    const existing = users.find((user) => user.email === email);

    if (mode === 'signup') {
      if (!name) return NextResponse.json({ detail: 'Full name is required.' }, { status: 400 });
      if (existing) return NextResponse.json({ detail: 'An account with this email already exists.' }, { status: 409 });
      const user: User = {
        id: users.length ? Math.max(...users.map((item) => item.id)) + 1 : 1,
        name, email, passwordHash: hashPassword(password), createdAt: new Date().toISOString(),
      };
      users.push(user);
      await writeUsers(users);
      return authenticatedResponse({ message: 'Account created successfully.', user: { id: user.id, name: user.name, email: user.email } }, 201);
    }

    if (!existing || existing.passwordHash !== hashPassword(password)) {
      return NextResponse.json({ detail: 'Invalid email or password.' }, { status: 401 });
    }

    return authenticatedResponse({ message: 'Login successful.', user: { id: existing.id, name: existing.name, email: existing.email } });
  } catch {
    return NextResponse.json({ detail: 'Unable to process authentication request.' }, { status: 500 });
  }
}
