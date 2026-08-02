const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

async function sha256(value: string) {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
}

async function secretsMatch(received: string, expected: string) {
  const [receivedHash, expectedHash] = await Promise.all([
    sha256(received),
    sha256(expected),
  ]);

  let difference = 0;
  for (let index = 0; index < receivedHash.length; index += 1) {
    difference |= receivedHash[index] ^ expectedHash[index];
  }
  return difference === 0;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }

  const setupToken = Deno.env.get("OAUTH_BOOTSTRAP_TOKEN") ?? "";
  const suppliedToken = request.headers.get("x-setup-token") ?? "";
  if (
    setupToken.length < 32 ||
    suppliedToken.length < 32 ||
    !(await secretsMatch(suppliedToken, setupToken))
  ) {
    return json(401, { error: "unauthorized" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json(503, { error: "server_configuration_error" });
  }

  const oauthAdminUrl = `${supabaseUrl}/auth/v1/admin/oauth/clients`;
  const adminHeaders = {
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };

  const listResponse = await fetch(oauthAdminUrl, {
    headers: adminHeaders,
  });
  if (!listResponse.ok) {
    return json(502, {
      error: "oauth_admin_unavailable",
      status: listResponse.status,
    });
  }

  const listed = await listResponse.json();
  const clients = Array.isArray(listed)
    ? listed
    : Array.isArray(listed?.clients)
      ? listed.clients
      : [];

  const callback =
    "https://ioumcdhslftdxlauqziz.supabase.co/auth/v1/callback";
  const existing = clients.find(
    (client: { name?: string; redirect_uris?: string[] }) =>
      client.name === "BrownGlobal Platforms" ||
      client.redirect_uris?.includes(callback),
  );

  if (existing) {
    return json(409, {
      error: "client_already_exists",
      client_id: existing.client_id ?? existing.id,
    });
  }

  const createResponse = await fetch(oauthAdminUrl, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      name: "BrownGlobal Platforms",
      redirect_uris: [callback],
      client_type: "confidential",
      token_endpoint_auth_method: "client_secret_basic",
    }),
  });

  const created = await createResponse.json().catch(() => ({}));
  return json(createResponse.status, created);
});
