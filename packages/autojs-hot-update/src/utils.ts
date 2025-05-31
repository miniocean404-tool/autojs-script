import os from "os"
import archiver from "archiver"
import crypto from "crypto"
import type { Buffer } from "buffer"

export function getIPAddress() {
  const interfaces = os.networkInterfaces()
  for (let devName in interfaces) {
    const iface = interfaces[devName]
    if (!iface) continue

    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i]
      if (alias.family === "IPv4" && alias.address !== "127.0.0.1" && !alias.internal) {
        // console.log("本机ip信息:", alias);
        return alias.address
      }
    }
  }

  return undefined
}

/**
 * 获取本地IP
 */
export function getIPs(): string[] {
  const ips: string[] = []
  const interfaces = require("os").networkInterfaces()
  for (let devName in interfaces) {
    const iface = interfaces[devName]
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i]
      console.log("---", alias)
      if (alias.family === "IPv4" && alias.address !== "127.0.0.1" && !alias.internal) {
        ips.push(alias.address)
      }
    }
  }
  return ips
}

export function zip(source: string, target: string) {
  const zip = archiver("zip", {
    zlib: { level: 9 },
  })
  zip.finalize()
}

export function md5(data: string | Buffer) {
  return crypto.createHash("md5").update(data).digest("hex")
}
