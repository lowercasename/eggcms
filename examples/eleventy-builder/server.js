const http = require('http')
const { spawn } = require('child_process')

let building = false
let queued = false

function build() {
  if (building) { queued = true; return }
  building = true
  console.log('[build] Starting')
  const proc = spawn('npx', ['@11ty/eleventy'], {
    cwd: '/app/site',
    stdio: 'inherit',
  })
  proc.on('close', (code) => {
    console.log(`[build] Exited with code ${code}`)
    building = false
    if (queued) { queued = false; build() }
  })
}

http.createServer((req, res) => {
  if (req.method === 'POST') {
    build()
    res.writeHead(200)
    res.end('ok')
  } else {
    res.writeHead(405)
    res.end()
  }
}).listen(8080, () => console.log('Listening on :8080'))
