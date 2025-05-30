import { fileURLToPath } from "url"
import { defineConfig } from "vite"
import type { UserConfig } from "vite"
import { unplugin } from "autojs6-tcp"

export default defineConfig((config) => {
  const isProd = config.mode === "production"
  const isDev = config.mode === "development"

  return {
    // plugins: [unplugin.vite({ ip: "192.168.31.115", port: 7347 })],
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
        entry: ["src/index.ts"],
        // 模块名
        name: "AUTOJS6_SCRIPT",
        // 输出文件名
        // fileName: (format, entryName) => `${entryName}.${format}.js`,
      },
      rollupOptions: {
        // 输出配置
        output: [
          {
            // 打包成 commonjs
            format: "cjs",
            // 重命名
            entryFileNames: "[name].cjs",
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
