import { WebpackPluginInstance, Compiler } from "webpack";

// import http from "http";
import { resolve } from "path";
import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from "fs";
import { createHash } from "crypto";
import { AutoJsDebugServer } from "./server";
import { Project } from "./server/project";

export interface AutojsDevWebpackPluginOption {
  /** 部署类型; watch模式的时候，比特位 1 保存项目, 比特位 2 运行项目; 例如: 1:只保存不运行, 2:只运行不保存, 3:保存和运行（默认）*/
  action?: number;
}

/* @Author: 家
 * @QQ: 203118908
 * @QQ交流群: 1019208967
 * @bilibili: 晓宇小凡
 * @versioin: 1.0
 * @Date: 2020-05-03 14:40:27
 * @LastEditTime: 2020-09-20 22:35:50
 * @LastEditors: 家
 * @Description: 用于webpack的loader 预处理autojs格式的文件
 * @学习格言: 即用即学, 即学即用
 */
const loader = {
  替换双花括号(str: string) {
    while (1) {
      if (/\{\{(?!this).*?\}\}/.test(str)) {
        str = str.replace(/\{\{(?!this)(.*?)\}\}/, "$${$1}");
      } else {
        break;
      }
    }
    return str;
  },
  替换双花括号_xml添加反引号(str: string) {
    while (1) {
      if (/<.*\/>(?!`)/.test(str)) {
        str = str.replace(/(<.*\/>)/, "`$1`");
      } else {
        break;
      }
    }
    return str;
  },
  去掉单引号(str: string) {
    while (1) {
      if (/'/.test(str)) {
        str = str.replace(/'/g, "");
      } else {
        break;
      }
    }
    while (1) {
      if (/['"]\s*<.*?>\s*['"]/.test(str)) {
        str = str.replace(/['"]\s*(<.*?>)\s*['"]/g, "$1");
      } else {
        break;
      }
    }
    return str;
  },
  xml添加反引号(result: string) {
    result = result.replace(/ui\.layout\([^()]*?\)/gm, loader.替换双花括号);
    result = result.replace(/floaty\.rawWindow\([^()]*?\)/gm, loader.替换双花括号);
    result = result.replace(/floaty\.window\([^()]*?\)/gm, loader.替换双花括号);
    result = result.replace(/ui\.inflate\(([^()]+?),([^()]+?)\)/gm, loader.替换双花括号);
    result = result.replace(/ui\.inflate\(([^(,)]+?)\)/gm, loader.替换双花括号);
    result = result.replace(/\.prototype\.render ?= ?function ?\(\) ?{([\s\S]*?)}/gm, loader.替换双花括号_xml添加反引号);

    result = result.replace(/ui\.layout\(([^()]+?)\)/gm, "ui.layout(`$1`)");
    result = result.replace(/floaty\.rawWindow\(([^()]+?)\)/gm, "floaty.rawWindow(`$1`)");
    result = result.replace(/floaty\.window\(([^()]+?)\)/gm, "floaty.window(`$1`)");
    result = result.replace(/ui\.inflate\(([^()]+?),([^()]+?)\)/gm, "ui.inflate(`$1`,$2)");
    result = result.replace(/ui\.inflate\(([^(,)]+?)\)/gm, "ui.inflate(`$1`)");


    const reg = /(ui\.inflate\(`\s*['"][^()]*?)'\s*\+\s*([a-zA-Z_]+)\s*\+\s*'([^()]*?['"]\s*`,[^()]+?\))/;
    while (1) {
      if (reg.test(result)) {
        result = result.replace(/(ui\.inflate\(`\s*['"][^()]*?)'\s*\+\s*([a-zA-Z_]+)\s*\+\s*'([^()]*?['"]\s*`,[^()]+?\))/gm, "$1$${$2}$3");
      } else {

        result = result.replace(/ui\.inflate\(`\s*['"][^()]*?`,[^()]+?\)/gm, loader.去掉单引号);

        break;
      }
    }
    return result;
  },
  someAsyncOperation(content: string, callback: (err: any, content: string) => void) {
    return loader.xml添加反引号(content);
  }
};

declare abstract class WebpackLogger {
  getChildLogger: (arg0: string | (() => string)) => WebpackLogger;
  error(...args: any[]): void;
  warn(...args: any[]): void;
  info(...args: any[]): void;
  log(...args: any[]): void;
  debug(...args: any[]): void;
  assert(assertion: any, ...args: any[]): void;
  trace(): void;
  clear(): void;
  status(...args: any[]): void;
  group(...args: any[]): void;
  groupCollapsed(...args: any[]): void;
  groupEnd(...args: any[]): void;
  profile(label?: any): void;
  profileEnd(label?: any): void;
  time(label?: any): void;
  timeLog(label?: any): void;
  timeEnd(label?: any): void;
  timeAggregate(label?: any): void;
  timeAggregateEnd(label?: any): void;
}

export class AutojsDevWebpackPlugin implements WebpackPluginInstance {
  private readonly options: Required<AutojsDevWebpackPluginOption> = {
    action: 3,
  };
  private input = "";
  private output = "";
  private projectName = "";
  private readonly files: { in: string; out: string; md5: string; send: boolean; }[] = [];
  private readonly log: WebpackLogger;
  private readonly server: AutoJsDebugServer;
  private islog = 1;

  constructor (options?: AutojsDevWebpackPluginOption) {
    Object.assign(this.options, options);
    this.server = new AutoJsDebugServer();
    this.server.on("message", p => {
      if (this.log && p.data && p.data.log) {
        try {
          if (this.islog) {
            if (p.data.log.endsWith("rerun.js]")) {
              this.islog = 0;
            } else {
              this.log.info(p.data.log);
            }
          } else if (p.data.log.indexOf("rerun.js") > 0) {
            this.islog = 1;
          }
        } catch (error) {
          this.log.error(error);
        }
      }
    }).on("new_device", p => {
      this.log.status("当前设备:", `${p.name}, ${p.type}, ${p.id}`);
    });
    this.server.listen();
  }
  private getFiles(path: string) {
    const ret: string[] = [];
    readdirSync(path).forEach((file) => {
      const filePath = resolve(path, file), stat = statSync(filePath);
      if (stat.isFile()) {
        // if (!(file.endsWith(".js") || file.endsWith("ts"))) {
        //   ret.push(filePath);
        // }
        ret.push(filePath);
      } else if (stat.isDirectory()) {
        ret.push(...this.getFiles(filePath)); // 递归
      }
    });
    return ret;
  }
  private runProject() {
    if (this.server.devices.length) {
      console.clear();
      this.log.clear();
      switch (this.options.action & 3) {
        case 1: // 保存项目
          // this.log.info("保存项目");
          this.server.sendProjectCommand(this.output, "save_project");
          break;
        case 2: // 运行项目
          // this.log.info("运行项目");
          this.server.sendProjectCommand(this.output, "run_project");
          break;
        case 3: // 保存并运行
          this.log.info("保存并运行");
          this.server.sendProjectCommand(this.output, "save_project");
          this.server.sendCommand("rerun", {
            id: "rerun",
            name: "rerun",
            script: `engines.execScriptFile("/sdcard/脚本/${this.projectName}/main.js");`
          });
          break;

        default:
          break;
      }
    } else {
      this.log.error("等待Autojs 安卓端连接");
    }
  }
  /** 应用初始化 */
  public apply(compiler: Compiler) {
    Object.defineProperty(this, "log", {
      get: () => {
        return compiler.getInfrastructureLogger(this.constructor.name);
      },
    });

    this.log.info("开始初始化");
    compiler.options.entry = { main: { import: ['./src/main.js'] } };
    const path = resolve(compiler.context, "./src/project.json"),
      project = {
        name: "新项目",
        main: "main.js",
        ignore: ["build"],
        packageName: `com.autojs.x${new Date().getTime()}`,
        versionName: "1.0.0",
        versionCode: 100
      };
    this.input = resolve(compiler.context, "./src/");
    compiler.options.output.path = this.output = resolve(compiler.context, "./dist/");
    if (existsSync(path) && statSync(path).isFile()) {
      Object.assign(project, require(path));
    } else {
      writeFileSync(resolve(path), JSON.stringify(project));
    }
    this.projectName = project.name;
    this.server.project = new Project(this.output, project);

    compiler.hooks.thisCompilation.tap(this.constructor.name, (compilation) => {
      compilation.hooks.processAssets.tap(
        { name: this.constructor.name, stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE, },
        (a) => {
          const fk = Object.keys(a).map(e => resolve(this.input, "./" + e));
          this.getFiles(this.input).forEach(p => {
            const i = fk.indexOf(p), o = p.substring(this.input.length);
            let t: any;
            if (i < 0) {
              const c = this.files.find(e => e.in == p);
              if (c) {
                t = createHash("md5").update(readFileSync(p, "utf8")).digest("hex");
                if (t == c.md5) {
                  t = false;
                } else {
                  c.md5 = t;
                  c.send = true;
                }
              } else {
                t = 1;
                const out = resolve(this.output, "./" + o);
                this.files.push({
                  in: p, out,
                  md5: createHash("md5").update(readFileSync(p, "utf8")).digest("hex"),
                  send: true
                });
              }
              if (t) {
                compilation.emitAsset(o, new compiler.webpack.sources.RawSource(readFileSync(p)));
              }
            } else {
              fk.splice(i, 1);
            }
          });
          this.runProject();
        }
      );
    });

    this.log.status("项目正在运行", this.server.port);
  }
}
export default AutojsDevWebpackPlugin;