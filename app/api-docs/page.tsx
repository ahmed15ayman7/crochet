"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

async function loadOpenApiSpec(): Promise<object> {
  const staticRes = await fetch("/openapi.json", { cache: "no-store" });
  if (staticRes.ok) {
    const data = (await staticRes.json()) as object;
    const paths = (data as { paths?: Record<string, unknown> }).paths;
    if (paths && Object.keys(paths).length > 0) return data;
  }
  const apiRes = await fetch("/api/openapi", { cache: "no-store" });
  if (!apiRes.ok) throw new Error(`HTTP ${apiRes.status}`);
  return apiRes.json() as Promise<object>;
}

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<object | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    loadOpenApiSpec()
      .then(setSpec)
      .catch(() => setErr("Failed to load OpenAPI spec"));
  }, []);

  if (err) {
    return <p style={{ padding: 24 }}>{err}</p>;
  }
  if (!spec) {
    return <p style={{ padding: 24 }}>Loading API documentation…</p>;
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <SwaggerUI spec={spec} />
    </div>
  );
}
