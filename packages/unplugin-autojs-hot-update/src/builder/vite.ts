import type { Plugin } from "vite"
import { AutojsHotUpdateOptions } from "@/types/builder"
import { zip, MD5 } from "@/utils"
import path from "path"
import slash from "slash"
import { AutojsTcpCommand } from "@/core/tcp"

export const builderVitePlugin = ({ ip, port }: AutojsHotUpdateOptions): Plugin => {
  let root = slash(process.cwd())
  let output = ""

  return {
    name: "unplugin-autojs-hot-update",
    enforce: "post", // 强制插件排序 pre：在 Vite 核心插件之前调用该插件 post：在 Vite 构建插件之后调用该插件(默认)
    configResolved(options) {
      const { root: configRoot } = options
      // 获取项目根目录
      if (configRoot && root !== configRoot) root = configRoot
    },
    // 获取 rollup 的 options hook
    options(options) {
      const { input } = options
      if (typeof input === "string" && input && input !== root) root = path.resolve(path.dirname(input))
    },
    outputOptions(options) {
      const { dir } = options
      if (dir) output = path.join(root, dir)
    },
    async closeBundle() {
      if (!output) return

      const buffer = await zip(output)
      const md5 = MD5(buffer)
      const command = AutojsTcpCommand.ins({ ip, port })

      command.project({ md5, root, buffer })
    },
  }
}
