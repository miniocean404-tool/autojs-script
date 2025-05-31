import { Socket } from "net"
import { bytesify, jsonify } from "./format"
import type { AutojsTcpOptions, ProjectCommandParams } from "@/types/core"

export class AutojsTcpCommand {
  static #instance: AutojsTcpCommand | null = null

  #tcp = new Socket()
  ip: string
  port: number

  private constructor(options: AutojsTcpOptions) {
    this.ip = options.ip
    this.port = options.port
    this.#init()
  }

  static ins(options: AutojsTcpOptions) {
    if (!this.#instance) this.#instance = new AutojsTcpCommand(options)
    return this.#instance
  }

  #init() {
    this.#tcp.connect(this.port, this.ip, () => {
      console.log("已经连接到服务器")
    })

    this.#tcp.on("data", (data) => {
      console.log("接收到数据:", data.toString())
    })

    this.#tcp.on("close", () => {
      console.log("连接已关闭")
    })

    this.#tcp.on("error", (err) => {
      console.error("连接错误:", err)
    })
  }

  hello() {
    const data = { id: 1, type: "hello", data: { extensionVersion: "1.0.0" } }
    this.#tcp.write(jsonify(data))
  }

  // 运行单个代码，需要传入脚本内容
  run() {
    const data = {
      id: 2,
      type: "command",
      data: { id: 2, name: "script.js", script: "console.show()", command: "run" },
    }

    this.#tcp.write(jsonify(data))
  }

  project(params: ProjectCommandParams) {
    const { md5, root, buffer } = params

    const data = {
      type: "bytes_command",
      md5,
      data: {
        id: root,
        name: root,
        deletedFiles: [],
        override: false,
        command: "run_project",
      },
    }

    const { header, data: data_string } = bytesify(buffer)
    this.#tcp.write(header)
    this.#tcp.write(data_string)
    this.#tcp.write(jsonify(data))
  }

  save(params: ProjectCommandParams) {
    const { md5, root, buffer } = params

    const data = {
      type: "bytes_command",
      md5,
      data: {
        id: root,
        name: root,
        deletedFiles: [],
        override: true,
        command: "save_project",
      },
    }

    const { header, data: data_string } = bytesify(buffer)
    this.#tcp.write(header)
    this.#tcp.write(data_string)
    this.#tcp.write(jsonify(data))
  }

  reRun() {
    const data = {
      id: 2,
      type: "command",
      data: {
        id: "/Users/daihaiyang/Desktop/my-code/test/test-autojs/main.js",
        command: "stop",
      },
    }

    this.#tcp.write(jsonify(data))
    this.run()
  }
}
