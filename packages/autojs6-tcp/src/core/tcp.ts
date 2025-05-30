// import { Socket } from "net"
// import { jsonify } from "./format"

// const tcp = new Socket()

// tcp.connect(7347, "192.168.31.115", () => {
//   console.log("已经连接到服务器")
// })

// tcp.on("data", (data) => {
//   console.log("接收到数据:", data.toString())
// })

// tcp.on("close", () => {
//   console.log("连接已关闭")
// })

// tcp.on("error", (err) => {
//   console.error("连接错误:", err)
// })

// export function runCode() {
//   const data = {
//     id: 2,
//     type: "command",
//     data: { id: 2, name: "script.js", script: "console.show()", command: "run" },
//   }

//   tcp.write(jsonify(data))
// }
