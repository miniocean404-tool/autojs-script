import { builtinModules } from "module"
import { fileURLToPath } from "url"
import { defineConfig } from "vite"
import type { UserConfig } from "vite"
import pkg from "./package.json"
import dts from "vite-plugin-dts"

export default defineConfig((config) => {
  const isProd = config.mode === "production"
  const isDev = config.mode === "development"

  return {
    plugins: [
      dts({
        entryRoot: "src",
        // 输出目录
        outDir: ["dist"],
        // 是否将源码里的 .d.ts 文件复制到 `outDir`
        copyDtsFiles: true,
        // 将动态引入转换为静态（例如：`import('vue').DefineComponent` 转换为 `import { DefineComponent } from 'vue'`）
        staticImport: true,
        // 将所有的类型合并到一个文件中
        rollupTypes: false,
        tsconfigPath: "./tsconfig.json",
      }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: {
      minify: isProd, // boolean | 'terser' | 'esbuild'
      sourcemap: isDev, // 输出单独 source文件
      cssCodeSplit: true, // 拆分 css 文件，并且 preserveModulesRoot 保留目录结构
      lib: {
        // 指定入口文件
        entry: ["./src/index.ts", "./src/vite.ts", "./src/webpack.ts", "./src/rollup.ts"],
        // 模块名
        name: "AUTOJS6_TCP",
        // 输出文件名
        // fileName: (format, entryName) => `${entryName}.${format}.js`,
      },
      rollupOptions: {
        // 将模块排除在打包文件之外
        external: [
          ...Object.keys(pkg.devDependencies).map((d) => `${d}`),
          ...builtinModules.map((m) => [`node:${m}`, m]).flat(),
        ],
        output: [
          {
            format: "esm",
            entryFileNames: "[name].js",
            // 打包目录和开发目录对应
            preserveModules: true,
            // 输出目录
            dir: "dist",
            // 指定保留模块结构的根目录
            preserveModulesRoot: "src",
            exports: "named",
          },
        ],
      },
    },
  } as UserConfig
})
