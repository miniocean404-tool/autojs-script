import { FileObserver, FileFilter } from "./diff";
import archiver from 'archiver';
import * as streamBuffers from 'stream-buffers';
import * as fs from "fs";
import * as path from 'path';
import * as cryto from 'crypto';
import * as walk from 'walk';
export interface obj {
  [key: string]: any;
}
export class Project {
  config: ProjectConfig;
  fpath: string;
  fileFilter = (relativePath: string, absPath: string, stats: fs.Stats) => {
    return this.config.ignore.filter(p => {
      const fullPath = path.join(this.fpath, p);
      return absPath.startsWith(fullPath);
    }).length == 0;
  };
  // private watcher: vscode.FileSystemWatcher;

  constructor (configPath: string, config: obj) {
    this.fpath = configPath;
    this.config = ProjectConfig.fromJsonFile(config);
    // console.error("创建了Project对象, 需要监听项目文件变化");
  }

  dispose() {
    // this.watcher.dispose();
    console.error("执行了处理");
  }

}


export class ProjectObserser {
  folder: string;
  private fileObserver: FileObserver;
  private fileFilter: FileFilter;

  constructor (folder: string, filter: FileFilter) {
    this.folder = folder;
    this.fileFilter = filter;
    this.fileObserver = new FileObserver(folder, filter);
  }

  diff(): Promise<{ buffer: Buffer, md5: string; }> {
    return this.fileObserver.walk()
      .then(changedFiles => {
        const zip = archiver('zip');
        const streamBuffer: any = new streamBuffers.WritableStreamBuffer();
        zip.pipe(streamBuffer);
        changedFiles.forEach(relativePath => {
          zip.append(fs.createReadStream(path.join(this.folder, relativePath)), { name: relativePath });
        });
        zip.finalize();
        return new Promise<Buffer>((res, rej) => {
          zip.on('finish', () => {
            streamBuffer.end();
            res(streamBuffer.getContents());
          });
        });
      })
      .then(buffer => {
        const md5 = cryto.createHash('md5').update(buffer).digest('hex');
        return {
          buffer: buffer,
          md5: md5
        };
      });
  }

  zip(): Promise<{ buffer: Buffer, md5: string; }> {
    return new Promise<{ buffer: Buffer, md5: string; }>((res, rej) => {
      const walker = walk.walk(this.folder);
      const zip = archiver('zip');
      const streamBuffer: any = new streamBuffers.WritableStreamBuffer();
      zip.pipe(streamBuffer);
      walker.on("file", (root, stat, next) => {
        const filePath = path.join(root, stat.name);
        const relativePath = path.relative(this.folder, filePath);
        if (!this.fileFilter(relativePath, filePath, stat)) {
          next();
          return;
        }
        zip.append(fs.createReadStream(path.join(this.folder, relativePath)), { name: relativePath });
        next();
      });
      walker.on("end", () => {
        zip.finalize();
        return new Promise<Buffer>((res, rej) => {
          zip.on('finish', () => {
            streamBuffer.end();
            res(streamBuffer.getContents());
          });
        });
      });
    });

  }
}

export class LaunchConfig {
  hideLogs: boolean;
}

export class ProjectConfig {
  name: string;
  icon: string;
  packageName: String;
  main: String;
  versionCode: number;
  versionName: string;
  ignore: string[];
  launchConfig: LaunchConfig;

  save(path: string) {
    return new Promise((res, rej) => {
      const json = JSON.stringify(this, null, 4);
      fs.writeFile(path, json, function (err) {
        if (err) {
          rej(err);
          return;
        }
        res(path);
      });
    });
  }

  static fromJson(text: string): ProjectConfig {
    const config = JSON.parse(text) as ProjectConfig;
    config.ignore = (config.ignore || []).map(p => path.normalize(p));
    return config;
  }

  static fromJsonFile(config: obj): ProjectConfig {
    config.ignore = (config.ignore || []);
    return config as ProjectConfig;
  }
}