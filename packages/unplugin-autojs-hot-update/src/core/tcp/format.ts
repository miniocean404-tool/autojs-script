import { TcpHeaderType, ServerType } from "@/const/core"

export function jsonify(data: Record<string, any>) {
  const data_string = JSON.stringify(data)

  const buffer_data = Buffer.alloc(TcpHeaderType.SERVER_HEADER_SIZE + data_string.length)
  buffer_data.write(data_string.length.toString(), 0)
  buffer_data.write(ServerType.JSON.toString(), TcpHeaderType.SERVER_HEADER_SIZE - 2)
  buffer_data.write(data_string, TcpHeaderType.SERVER_HEADER_SIZE)

  return buffer_data
}

export function bytesify(buffer: Buffer) {
  let data = buffer.toString("latin1")

  let header = Buffer.alloc(TcpHeaderType.SERVER_HEADER_SIZE)
  header.write(String(data.length), 0)
  header.write(String(ServerType.BYTES), TcpHeaderType.SERVER_HEADER_SIZE - 2)

  return {
    header,
    data,
  }
}
