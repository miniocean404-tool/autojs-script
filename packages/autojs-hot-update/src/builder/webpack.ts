import { Options } from "../index"
import type { Compiler } from "webpack"

export function builderWebpackPlugin(options: Options) {
  const pluginName = "autojs-hot-update"

  // 实际上是 apply 函数
  return (compiler: Compiler) => {
    const isWebpack5 = Boolean(compiler.webpack?.version?.startsWith("5"))

    if (isWebpack5) {
      compiler.hooks.compilation.tap(pluginName, (compilation) => {
        compilation.hooks.processAssets.tap(
          {
            name: pluginName,
            stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
          },
          (assets) => {
            for (const name in assets) {
            }
          },
        )
      })
    } else {
      // ✅ Webpack 4 fallback, 可以支持，但是目前不支持
      throw new Error("Webpack 4 is not supported")
    }
  }
}
