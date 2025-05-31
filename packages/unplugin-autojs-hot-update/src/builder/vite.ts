import type { Plugin } from "vite"
import { Options } from "../index"
import { zip } from "@/utils"

export const builderVitePlugin = (options: Options): Plugin => {
  return {
    name: "unplugin-autojs-hot-update",
    writeBundle(builderOptions, bundle) {
      const { dir } = builderOptions
      if (dir) {
        console.log("🚀 ~ writeBundle ~ dir:", dir)
        // zip(dir, `${dir}.zip`)
      }
      // console.log("🚀 ~ writeBundle ~ output:", output)
      // console.log("🚀 ~ writeBundle ~ builderOptions:", builderOptions)
      // console.log("🚀 ~ writeBundle ~ bundle:", bundle)
    },
  }
}
