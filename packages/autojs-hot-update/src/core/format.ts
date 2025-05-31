import { TcpHeaderType, ServerType } from "./const"

export function jsonify(data: Record<string, any>) {
  const data_string = JSON.stringify(data)

  const header = Buffer.alloc(TcpHeaderType.SERVER_HEADER_SIZE)
  header.write(data_string.length.toString(), 0)
  header.write(ServerType.JSON.toString(), TcpHeaderType.SERVER_HEADER_SIZE - 2)

  const buffer_data = Buffer.alloc(TcpHeaderType.SERVER_HEADER_SIZE + data_string.length)
  header.copy(buffer_data, 0, 0, TcpHeaderType.SERVER_HEADER_SIZE)
  buffer_data.write(data_string, TcpHeaderType.SERVER_HEADER_SIZE)

  return buffer_data
}
