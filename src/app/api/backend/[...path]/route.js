const API_PREFIX = '/api/backend/';
const RESOURCES = new Set(['auth', 'transaction', 'bills', 'note', 'products', 'admin']);

async function forward(request) {
  const incoming = new URL(request.url);
  const path = incoming.pathname.slice(API_PREFIX.length);
  if (!RESOURCES.has(path.split('/')[0])) {
    return Response.json({ success: false, message: 'Unknown API resource.' }, { status: 404 });
  }

  const backend = (
    process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL ||
    'https://api.management.phidimservice.com.np'
  ).replace(/\/$/, '');
  const headers = new Headers();
  for (const name of ['content-type', 'accept', 'authorization']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  // The backend prefers cookies over Bearer tokens. Do not let an old cookie
  // (including the legacy jwt=true marker) override the current Bearer token.
  if (!headers.has('authorization')) {
    const jwt = request.headers.get('cookie')?.split(';')
      .map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith('jwt='));
    if (jwt && jwt !== 'jwt=true') headers.set('cookie', jwt);
  }

  try {
    const upstream = await fetch(`${backend}/${path}${incoming.search}`, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(30000),
    });
    const responseHeaders = new Headers({ 'Cache-Control': 'no-store' });
    for (const name of ['content-type', 'content-disposition']) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    for (const cookie of upstream.headers.getSetCookie()) {
      responseHeaders.append('set-cookie', cookie);
    }
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json({
      success: false,
      message: 'Unable to reach the backend. The save could not be confirmed; refresh the list before retrying.',
    }, { status: 502 });
  }
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE, forward as HEAD };
