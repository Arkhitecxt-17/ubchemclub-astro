export const prerender = false;

import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, url, locals }) => {
  const runtime = (locals as any).runtime;
  const GITHUB_CLIENT_ID = runtime?.env?.GITHUB_CLIENT_ID ?? import.meta.env.GITHUB_CLIENT_ID;
  const GITHUB_CLIENT_SECRET = runtime?.env?.GITHUB_CLIENT_SECRET ?? import.meta.env.GITHUB_CLIENT_SECRET;
  const BASE_URL = runtime?.env?.SITE_URL ?? import.meta.env.SITE_URL;

  const action = params.action;

  if (action === "login") {
    const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
    githubAuthUrl.searchParams.set("client_id", GITHUB_CLIENT_ID);
    githubAuthUrl.searchParams.set("scope", "repo,user");
    githubAuthUrl.searchParams.set("redirect_uri", `${BASE_URL}/api/auth/callback`);
    return Response.redirect(githubAuthUrl.toString(), 302);
  }

  if (action === "callback") {
    const code = url.searchParams.get("code");
    if (!code) {
      return new Response("Missing code", { status: 400 });
    }

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${BASE_URL}/api/auth/callback`,
      }),
    });

    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
    };

    if (!tokenData.access_token) {
      return new Response(`OAuth failed: ${tokenData.error ?? "unknown"}`, { status: 401 });
    }

    const token = tokenData.access_token;

    const html = `<!DOCTYPE html>
<html>
  <head><title>Authenticating...</title></head>
  <body>
    <script>
      (function() {
        function receiveMessage(e) {
          window.opener.postMessage(
            'authorization:github:success:{"token":"${token}","provider":"github"}',
            e.origin
          );
        }
        window.addEventListener("message", receiveMessage, false);
        window.opener.postMessage("authorizing:github", "*");
      })();
    <\/script>
  </body>
</html>`;

    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  }

  return new Response("Not found", { status: 404 });
};