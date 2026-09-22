import 'dotenv/config';
import { createApp } from './app';

function resolvePort(): number {
  const raw = process.env.PORT;
  if (!raw) return 3000;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 3000;
  return parsed;
}

const PORT = resolvePort();

const app = createApp();

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});