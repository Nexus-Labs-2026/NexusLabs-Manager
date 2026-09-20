// TypeScript source scaffold.
// The included app.js is directly runnable without a build step.
// If you want a typed build, move the logic from app.js here and compile with tsc.

export interface ServerProfile {
  id: string;
  name: string;
  host: string;
  protocol: "RDP" | "SSH" | "VNC" | "WinRM";
  port: number;
  group: string;
  status: "online" | "offline" | "warning";
  latency?: number | null;
  notes?: string;
}
