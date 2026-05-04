"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<object | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/openapi")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
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
