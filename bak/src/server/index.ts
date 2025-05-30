import { EventEmitter } from 'events';
import ws from 'websocket';
import http from 'http';
import querystring from 'querystring';
import url from 'url';
import fs from 'fs';
import Adb, { DeviceClient, Forward } from '@devicefarmer/adbkit';
import Tracker from '@devicefarmer/adbkit/dist/src/adb/tracker';
import ADBDevice from '@devicefarmer/adbkit/dist/src/Device';
import internal from "stream";
import buffer from "buffer";
import { Project, ProjectObserser } from './project';
const DEBUG = false;
const HANDSHAKE_TIMEOUT = 10 * 1000;



export class Device extends EventEmitter {
  public name: string;
  public type: string;
  public id: string;
  private connection?: ws.connection | null;
  public attached: boolean = false;
  public projectObserser: ProjectObserser;

  constructor (connection: ws.connection, type: string, id: string) {
    super();
    this.type = type;
    this.id = id;
    this.connection = connection;
    this.read(this.connection);
    this.on('data:hello', data => {
      console.log("on client hello: ", data);
      this.attached = true;
      this.name = data['device_name'];
      let message_id = `${Date.now()}_${Math.random()}`;

      let appVersionCode = data['app_version_code'];

      let returnData: any, version = "1.109.0"; // 扩展版本
      if (appVersionCode >= 629) {
        returnData = { message_id, data: "ok", version, debug: DEBUG, type: 'hello' };
      } else {
        returnData = { message_id, data: "连接成功", debug: DEBUG, type: 'hello' };
      }
      console.log("return data: ", returnData);
      this.connection?.sendUTF(JSON.stringify(returnData));
      this.emit("attach", this);
    });
    this.on('data:ping', data => {
      console.log("on client ping: ", data);
      // let message_id = `${Date.now()}_${Math.random()}`;
      const returnData = JSON.stringify({ type: 'pong', data: data });
      console.log("pong: ", returnData);
      this.connection?.sendUTF(returnData);
    });
    setTimeout(() => {
      if (!this.attached) {
        console.log("handshake timeout");
        this.connection?.close();
        this.connection = null;
      }
    }, HANDSHAKE_TIMEOUT);
  }

  close() {
    let message_id = `${Date.now()}_${Math.random()}`;
    let closeMessage = JSON.stringify({ message_id, data: "close", debug: false, type: 'close' });
    this.connection?.sendUTF(closeMessage);
    this.connection?.close();
    this.connection = null;
  }

  send(type: string, data: any): void {
    let message_id = `${Date.now()}_${Math.random()}`;
    console.log(data);
    this.connection?.sendUTF(JSON.stringify({
      type: type,
      message_id,
      data: data
    }));
  }

  sendBytes(bytes: Buffer): void {
    this.connection?.sendBytes(bytes);
  }

  sendBytesCommand(command: string, md5: string, data: object = {}): void {
    data = Object(data);
    data['command'] = command;
    let message_id = `${Date.now()}_${Math.random()}`;
    this.connection?.sendUTF(JSON.stringify({
      type: 'bytes_command',
      message_id,
      md5: md5,
      data: data
    }));
  }

  sendCommand(command: string, data: object): void {
    data = Object(data);
    data['command'] = command;
    this.send('command', data);
  }

  public toString = (): string => {
    if (!this.name) {
      return `设备 (${this.type}: ${this.id})`;
    }
    return `设备 ${this.name}(${this.type}: ${this.id})`;
  };

  private read(connection: ws.connection) {
    connection.on('message', message => {
      console.log("消息到达: ", message);
      if (message.type == 'utf8') {
        try {
          let json = JSON.parse(message.utf8Data);
          console.log("json: ", json);
          this.emit('message', json);
          this.emit('data:' + json['type'], json['data']);
        } catch (e) {
          console.log(e);
        }
      }
    });
    connection.on('close', (reasonCode, description) => {
      console.log(`关闭: 设备 = ${this}, 原因 = ${reasonCode}, 描述 = ${description}`);
      this.connection = null;
      this.emit('disconnect');
    });
  }

}

export class AutoJsDebugServer extends EventEmitter {
  public isHttpServerStarted = false;
  private httpServer: http.Server;
  public adbClient = Adb.createClient();
  private tracker?: Tracker;
  public readonly port: number;
  public devices: Array<Device> = [];
  public project?: Project | null = null;
  private fileFilter = (relativePath: string, absPath: string, stats: fs.Stats) => {
    if (!this.project) {
      return true;
    }
    return this.project.fileFilter(relativePath, absPath, stats);
  };

  constructor (port = 9317) {
    super();
    this.port = port;
    this.httpServer = http.createServer((request, response) => {
      console.log(new Date() + ' Received request for ' + request.url);
      if (request.url) {
        const urlObj = url.parse(request.url);
        const query = urlObj.query;
        if (query) {
          const queryObj = querystring.parse(query);
          if (urlObj.pathname == "/exec") {
            response.writeHead(200);
            response.end("this commond is:" + queryObj.cmd + "-->" + queryObj.path);
            this.emit('cmd', queryObj.cmd, queryObj.path);
            console.log(queryObj.cmd, queryObj.path);
            return;
          }
        }
      }
      response.writeHead(404);
      response.end();
    });
    let wsServer = new ws.server({ httpServer: this.httpServer, keepalive: true, keepaliveInterval: 10000 });
    wsServer.on('request', request => {
      let connection = request.accept();
      if (!connection) {
        return;
      }
      this.newDevice(connection, "tcp", connection.socket.remoteAddress + ":" + connection.socket.remotePort);
    });
  }

  getDeviceById(id: string): Device | undefined {
    return this.devices.find((value) => {
      return value.id == id;
    });
  }

  private newDevice(connection: ws.connection, type: string, id: string) {
    let device = new Device(connection, type, id);
    console.log("新设备进入", id, type), connection;
    device
      .on("attach", (device) => {
        this.attachDevice(device);
        this.emit('new_device', device);
        console.log("设备连接:", device);
      }).on("message", (data) => {
        this.emit("message", data, device);
      });
  }

  async adbShell(device: DeviceClient, command: string): Promise<string> {
    let duplex: internal.Duplex = await device.shell(command);
    let brandBuf: buffer.Buffer = await Adb.util.readAll(duplex);
    return brandBuf.toString();
  }

  private connectAutoxjsByADB(port: Number, deviceId: string) {
    let autoJsDebugServer = this;
    let url = `ws://localhost:${port}/`;

    const client = new ws.client();

    client.on("connectFailed", function (error) {
      let err = '连接错误: ' + error.toString();
      console.log(err);
    });

    client.on("connect", function (connection) {
      console.log("connected to " + url);
      autoJsDebugServer.newDevice(connection, "adb", deviceId);
    });
    client.connect(url);
  }

  listen(): void {
    if (this.isHttpServerStarted) {
      this.emit("connected");
      return;
    }
    this.httpServer.on('error', (e) => {
      this.isHttpServerStarted = false;
      console.log('server error: ', e);
    });
    this.httpServer.listen(this.port, '0.0.0.0', () => {
      this.isHttpServerStarted = true;
      const address: any = this.httpServer.address();
      const localAddress = this.getIPAddress();
      // console.log(`服务开始监听: ${localAddress}:${address.port} / ${address.address}:${address.port}`);
      this.emit("connect");
    });
  }


  async listADBDevices(): Promise<ADBDevice[]> {
    return this.adbClient.listDevices();
  }

  async trackADBDevices() {
    let thisServer = this;
    let devices = await thisServer.adbClient.listDevices();
    for (let device0 of devices) {
      await thisServer.connectDevice(device0.id);
    }
    if (this.tracker) {
      this.emit("adb:tracking_started");
      return;
    }
    try {
      let tracker = await thisServer.adbClient.trackDevices();
      thisServer.tracker = tracker;
      tracker.on('add', async function (device0) {
        console.log("adb device " + device0.id + " added");
        const device = thisServer.adbClient.getDevice(device0.id);
        await device.waitForDevice();
        await thisServer.connectDevice(device0.id, device);
      });
      tracker.on('remove', function (device) {
        console.log("adb device " + device.id + " removed");
        let wsDevice = thisServer.getDeviceById(device.id);
        if (wsDevice) {
          wsDevice.close();
        }

      });
      tracker.on('end', function () {
        thisServer.tracker = undefined;
        console.log('ADB Tracking stopped');
        thisServer.emit("adb:tracking_stop");
      });
    } catch (err: any) {
      this.tracker = undefined;
      thisServer.emit("adb:tracking_error");
      console.log('ADB error: ', err.stack);
    }

    this.emit("adb:tracking_start");
  }

  async connectDevice(id: string, device?: DeviceClient) {
    if (!device) device = this.adbClient.getDevice(id);
    let wsDevice = this.getDeviceById(id);
    if (wsDevice && wsDevice.attached) return;
    let forwards: Forward[] = await this.listForwards(device, id);
    if (forwards.length == 0) {
      let forwarded = await device.forward(`tcp:0`, `tcp:9317`);
      if (forwarded) {
        forwards = await this.listForwards(device, id);
      }
    }
    if (forwards.length > 0) {
      let forward = forwards[0];
      console.log(`forward ${id}: local -> ${forward.local}, remote -> ${forward.remote}`);
      let port = Number(forward.local.replace("tcp:", ""));
      this.connectAutoxjsByADB(port, id);
    }
  }

  private async listForwards(device: DeviceClient, id: string): Promise<Forward[]> {
    let forwards: Forward[] = await device.listForwards();
    return forwards.filter((forward) => {
      return forward.serial == id && forward.remote == "tcp:9317";
    });
  }

  stopTrackADBDevices() {
    if (this.tracker) {
      this.tracker.end();
      this.tracker = undefined;
    }
  }

  send(type: string, data: any): void {
    this.devices.forEach(device => {
      device.send(type, data);
    });
  }

  sendBytes(data: Buffer): void {
    this.devices.forEach(device => {
      device.sendBytes(data);
    });
  }

  sendBytesCommand(command: string, md5: string, data: object = {}): void {
    this.devices.forEach(device => {
      device.sendBytesCommand(command, md5, data);
    });
  }
  // 保存项目 sendProjectCommand( save_project, 项目路径)
  // 运行项目 sendProjectCommand( run_project)

  sendProjectCommand(folder: string, command: string) {
    // const startTime = new Date().getTime();
    this.devices.forEach(device => {
      if (device.projectObserser == null || device.projectObserser.folder != folder) {
        device.projectObserser = new ProjectObserser(folder, this.fileFilter);
      }
      device.projectObserser.diff()
        .then(result => {
          device.sendBytes(result.buffer);
          device.sendBytesCommand(command, result.md5, {
            'id': device.id,
            'name': this.project?.config.name
          });
          // console.log(`发送项目耗时: ${(new Date().getTime() - startTime) / 1000} 秒`);
        });
    });
  }

  sendCommand(command: string, data: object = {}): void {
    this.devices.forEach(device => {
      device.sendCommand(command, data);
    });
  }

  disconnect(): void {
    this.httpServer.close();
    this.isHttpServerStarted = false;
    this.emit("disconnect");
    this.devices.forEach((device) => {
      device.close();
    });
  }

  /** 获取本地IP */
  getIPAddress(): string | undefined {
    const interfaces = require('os').networkInterfaces();
    for (let devName in interfaces) {
      const iface = interfaces[devName];
      for (let i = 0; i < iface.length; i++) {
        const alias = iface[i];
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
          // console.log("本机ip信息:", alias);
          return alias.address;
        }
      }
    }
    console.log("没有获取到本机IP信息");
  }
  /** 获取本地IP */
  getIPs(): string[] {
    const ips: string[] = [];
    const interfaces = require('os').networkInterfaces();
    for (let devName in interfaces) {
      const iface = interfaces[devName];
      for (let i = 0; i < iface.length; i++) {
        const alias = iface[i];
        console.log("---", alias);
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
          ips.push(alias.address);
        }
      }
    }
    return ips;
  }

  /** 获取服务运行端口 */
  getPort(): number {
    return this.port;
  }

  private attachDevice(device: Device): void {
    this.devices.push(device);
    device.on('data:log', data => {
      console.log(data['log']);
      this.emit('log', data['log']);
    });
    device.on('disconnect', this.detachDevice.bind(this, device));
  }
  /** 分离设备? */
  private detachDevice(device: Device): void {
    this.devices.splice(this.devices.indexOf(device), 1);
    console.log("detachDevice: " + device);
  }
}
