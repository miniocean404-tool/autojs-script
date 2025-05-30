import { createVitePlugin } from "@/builder/vite"
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
    name: "autojs6-tcp",
    // watchChange(id, change) {
    //   console.log("🚀 ~ watchChange ~ id:", id)
    //   console.log("🚀 ~ watchChange ~ change:", change)
    // },
    writeBundle(this) {},
    vite: createVitePlugin(options),
    rollup: {},
    rolldown: {},
    webpack(compiler) {},
    rspack(compiler) {},
    esbuild: {},
    farm: {},
  }
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)
export default unplugin
