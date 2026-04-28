import { NextResponse } from 'next/server';
import { adminAuth } from './firebase/admin';
import { isMasterAdmin } from './masterConfig';

/**
 * Verify the request comes from the Master Admin.
 * Used in API routes that mutate Firestore (POST/PUT/DELETE).
 *
 * Usage in any API route:
 *   const check = await requireMasterAdmin(request);
 *   if (check) return check; // returns 403 if not master admin
 */
export async function requireMasterAdmin(request: Request): Promise<NextResponse | null> {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json(
      { statusCode: 401, message: 'Unauthorized - No token provided' },
      { status: 401 }
    );
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (!isMasterAdmin(decoded.email)) {
      return NextResponse.json(
        {
          statusCode: 403,
          message: 'Sandbox mode - Changes are only saved locally on your device',
          sandbox: true,
        },
        { status: 403 }
      );
    }
    return null; // Allowed
  } catch {
    return NextResponse.json(
      { statusCode: 401, message: 'Invalid token' },
      { status: 401 }
    );
  }
}
