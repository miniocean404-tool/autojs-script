import type { AutojsHotUpdateOptions } from "@/types/builder"

export interface ProjectCommandParams {
  md5: string
  // 项目根路径
  root: string
  // zip 文件 buffer
  buffer: Buffer
}

export type AutojsTcpOptions = Pick<AutojsHotUpdateOptions, "ip" | "port">
