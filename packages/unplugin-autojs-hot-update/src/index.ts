import { builderVitePlugin } from "./builder/vite"
import { builderWebpackPlugin } from "./builder/webpack"
import type { UnpluginFactory } from "unplugin"
import { createUnplugin } from "unplugin"
import type { AutojsHotUpdateOptions } from "@/types/builder"

const unpluginFactory: UnpluginFactory<AutojsHotUpdateOptions | undefined> = (options, meta) => {
  console.log("当前打包框架：", meta.framework)
  if (!options) throw new Error("options 必填")

  return {
    name: "unplugin-autojs-hot-update",
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

const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)
export default unplugin
