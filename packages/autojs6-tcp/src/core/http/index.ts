interface SendCmdOptions {
  ip: string
  port: number
  cmd: string
  path: string
}

export async function sendCmd({ ip, port, cmd, path }: SendCmdOptions) {
  path = encodeURI(path)

  try {
    const res = await fetch(`http://${ip}:${port}/exec?cmd=${cmd}&path=${path}`)
    const text = await res.text()
    return text
  } catch (error) {
    throw new Error("HTTP 命令发送失败，请检查 Auto.js 服务是否启动")
  }
}
