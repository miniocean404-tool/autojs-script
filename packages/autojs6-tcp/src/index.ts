import type { UnpluginFactory } from "unplugin"
import { createUnplugin } from "unplugin"

export interface Options {
  ip: string
  port: number
}

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options, meta) => {
  console.log(meta.framework) // vite rollup webpack esbuild rspack...

  return {
    name: "autojs6-tcp",
    transform: {
      // an additional hook is needed for better perf on webpack and rolldown
      filter: {
        // id: /main\.ts$/,
      },
      handler(code) {
        return code
      },
    },
    watchChange(id, change) {
      console.log(id, change)
    },
    vite: {
      // Vite plugin
      configureServer(server) {
        // configure Vite server
      },
    },
    rollup: {
      // Rollup plugin
    },
    rolldown: {
      // Rolldown plugin
    },
    webpack(compiler) {
      // Configure webpack compiler
    },
    rspack(compiler) {
      // Configure Rspack compiler
    },
    esbuild: {
      // Change the filter of onResolve and onLoad
      // onResolveFilter?: RegExp,
      // onLoadFilter?: RegExp,
      // Tell esbuild how to interpret the contents. By default Unplugin tries to guess the loader
      // from file extension (eg: .js -> "js", .jsx -> 'jsx')
      // loader?: (Loader | (code: string, id: string) => Loader)
      // Or you can completely replace the setup logic
      // setup?: EsbuildPlugin.setup,
    },
    farm: {
      // Farm plugin
    },
  }
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)
export default unplugin
