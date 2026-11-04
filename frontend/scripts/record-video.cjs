// Dedicated production entry point; regression suites are unchanged.
const {spawn, spawnSync} = require('node:child_process');
const {resolve, join} = require('node:path');
const {mkdirSync, mkdtempSync, writeFileSync} = require('node:fs');
const {createServer} = require('node:net');
const delay = ms => new Promise(done => setTimeout(done,ms));
async function port() {
  const server=createServer();
  await new Promise((done,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',done);});
  const number=server.address().port;
  await new Promise(done=>server.close(done));
  return number;
}
async function waitReady(url, child) {
  for (let i = 0; i < 150; i++) {
    if (child.exitCode !== null)
      throw Error("Production service exited before startup");
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await delay(100);
  }
  throw Error("Production service did not start: " + url);
}
async function stop(child) {
  if (!child || child.exitCode !== null) return;
  const ended = new Promise((done) => child.once("exit", done));
  child.kill("SIGTERM");
  await Promise.race([ended, delay(3000)]);
  if (child.exitCode === null) {
    child.kill("SIGKILL");
    await ended;
  }
}
(async () => {
  const root = resolve(__dirname, "../..");
  const outputRoot = resolve(process.argv[2] || join(root,'work','video'));
  mkdirSync(outputRoot,{recursive:true});
  const artifacts = mkdtempSync(join(outputRoot,'take-'));
  const directory = join(artifacts,'database');
  for (const name of ['database','raw','frames','edited','final']) mkdirSync(join(artifacts,name));
  console.log('Production directory: '+artifacts);
  writeFileSync(join(outputRoot,'latest.txt'),artifacts);
  const apiPort = await port(),
    frontPort = await port();
  let api, frontend;
  let logs = "";
  try {
    const python =
      process.env.CLASSALL_PYTHON ||
      join(
        root,
        ".venv",
        process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
      );
    const database = join(
      directory,
      "classall-v5-presentation.sqlite3",
    );
    {
      const result = spawnSync(
        python,
        ["-m", "app.presentation", "--database", database],
        {
          cwd: root,
          env: { ...process.env, PYTHONPATH: join(root, "backend") },
          encoding: "utf8",
        },
      );
      if (result.status !== 0)
        throw Error(result.stderr || String(result.error));
    }
    api = spawn(
      python,
      [
        "-m",
        "uvicorn",
        "app.main:app",
        "--app-dir",
        "backend",
        "--host",
        "127.0.0.1",
        "--port",
        String(apiPort),
      ],
      {
        cwd: root,
        env: {
          ...process.env,
          CLASSALL_DB_PATH: database,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    api.on("error", (e) => (logs += String(e)));
    api.stdout.on("data", (s) => (logs += s));
    api.stderr.on("data", (s) => (logs += s));
    await waitReady(`http://127.0.0.1:${apiPort}/api/health`, api);
    const built = spawnSync(process.execPath,[join(root,'frontend/node_modules/vite/bin/vite.js'),'build'],{cwd:join(root,'frontend'),encoding:'utf8'});
    if(built.status !== 0) throw Error(built.stderr || built.stdout || String(built.error));
    frontend = spawn(
      process.execPath,
      [
        join(root, "frontend/node_modules/vite/bin/vite.js"),
        "preview",
        "--host",
        "127.0.0.1",
        "--port",
        String(frontPort),
        "--strictPort",
      ],
      {
        cwd: join(root, "frontend"),
        env: {
          ...process.env,
          CLASSALL_API_TARGET: `http://127.0.0.1:${apiPort}`,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    frontend.on("error", (e) => (logs += String(e)));
    frontend.stdout.on("data", (s) => (logs += s));
    frontend.stderr.on("data", (s) => (logs += s));
    await waitReady(`http://127.0.0.1:${frontPort}`, frontend);
    {
      await require('./video-story.cjs')(`http://127.0.0.1:${frontPort}`,artifacts,true);
      const verified = spawnSync(python,[join(root,'scripts/video/verify.py'),database,artifacts],{cwd:root,encoding:'utf8'});
      if(verified.status !== 0) throw Error(verified.stderr || verified.stdout);
      console.log(verified.stdout);
      return;
    }
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await stop(frontend);
    await stop(api);
    writeFileSync(join(artifacts, "services.log"), logs);
    // Preserve this isolated take and its persisted evidence for QA.
  }
})();
