import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export async function checkUptime(probe = fetch) {
  const output = {
    code: '000',
    home: '000',
    email: 'unknown',
    auth: 'unknown',
    storage: 'unknown',
  };
  let validHealth = false;
  await Promise.all([
    (async () => {
      try {
        const r = await probe('https://soralink.link/api/health', {
          signal: AbortSignal.timeout(20000),
          redirect: 'error',
        });
        output.code = String(r.status);
        const data = await r.json();
        for (const key of ['email', 'auth', 'storage'])
          if (['ok', 'failing', 'missing', 'unknown'].includes(data?.[key]))
            output[key] = data[key];
        validHealth = r.status === 200 && data?.status === 'ok' && data?.database === 'ok';
      } catch {
        // Transport failures and invalid JSON must produce an incident, too.
      }
    })(),
    (async () => {
      try {
        const r = await probe('https://soralink.link/', {
          signal: AbortSignal.timeout(20000),
          redirect: 'error',
        });
        output.home = String(r.status);
        await r.body?.cancel();
      } catch {}
    })(),
  ]);
  output.failure =
    !validHealth || output.home !== '200' || output.auth !== 'ok' || output.storage !== 'ok'
      ? '1'
      : '0';
  output.email_failure = output.email === 'ok' ? '0' : '1';
  return output;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await checkUptime();
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      Object.entries(result)
        .map(([key, value]) => `${key}=${value}\n`)
        .join(''),
    );
  console.log(JSON.stringify(result));
  // Let the workflow report or close the incident before failing its final step.
}
