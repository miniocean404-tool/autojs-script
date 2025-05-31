import { builderVitePlugin } from "@/builder/vite"
import { builderWebpackPlugin } from "@/builder/webpack"
import type { UnpluginFactory } from "unplugin"
import { createUnplugin } from "unplugin"

export interface Options {
  ip: string
  port: number
}

export const unpluginFactory: UnpluginFactory<Options | undefined> = (
  options = { ip: "127.0.0.1", port: 9317 },
  meta,
) => {
  console.log("当前打包框架：", meta.framework)

  return {
    name: "autojs-hot-update",
    // watchChange(id, change) {
    //   console.log("🚀 ~ watchChange ~ id:", id)
    //   console.log("🚀 ~ watchChange ~ change:", change)
    // },
    writeBundle(this) {},
    vite: builderVitePlugin(options),
    rollup: {},
    rolldown: {},
    webpack: builderWebpackPlugin(options),
    rspack(compiler) {},
    esbuild: {},
    farm: {},
  }
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)
export default unplugin
