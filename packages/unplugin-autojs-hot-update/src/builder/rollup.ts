import type { Plugin } from "rollup"
import { AutojsHotUpdateOptions } from "@/types/builder"

export const builderRollupPlugin = (options: AutojsHotUpdateOptions): Plugin => {
  return {
    name: "unplugin-autojs-hot-update",
    writeBundle(builderOptions, bundle) {
      const { dir } = builderOptions
      if (dir) {
        // zip(dir, `${dir}.zip`)
      }
      // console.log("🚀 ~ writeBundle ~ output:", output)
      // console.log("🚀 ~ writeBundle ~ builderOptions:", builderOptions)
      // console.log("🚀 ~ writeBundle ~ bundle:", bundle)
    },
  }
}
