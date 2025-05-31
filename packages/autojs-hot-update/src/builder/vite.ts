import type { Plugin } from "vite"
import { Options } from "../index"
import { zip } from "@/utils"

export const builderVitePlugin = (options: Options): Plugin => {
  return {
    name: "autojs-hot-update",
    writeBundle(options, bundle) {
      const { dir } = options
      if (dir) {
        zip(dir, `${dir}.zip`)
      }
      // console.log("🚀 ~ writeBundle ~ output:", output)
      // console.log("🚀 ~ writeBundle ~ options:", options)
      // console.log("🚀 ~ writeBundle ~ bundle:", bundle)
    },
  }
}
