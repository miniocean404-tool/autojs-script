import { rollupBuild, copyWebsite } from "./rollup.mjs"
import { execSync } from "child_process"

execSync("npm run build", { stdio: "inherit" })
await rollupBuild()

copyWebsite()
