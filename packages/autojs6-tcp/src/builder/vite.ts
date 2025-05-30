import type { Plugin } from "vite"
import { Options } from "../index"

export const createVitePlugin = (options: Options): Plugin => {
  return {
    name: "autojs6-tcp",
    writeBundle(options, bundle) {
      console.log("🚀 ~ writeBundle ~ this:", options, bundle)
    },
  }
}
