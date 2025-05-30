import fs from 'fs';
// import * as walk from 'walk';
import path from 'path';

export type FileFilter = ((relativePath: string, path: string, stats: fs.Stats) => boolean);

export class FileObserver {

  private dir: string;
  private files = new Map<string, number>();
  private filter: FileFilter;


  constructor (dirPath: string, filter: FileFilter) {
    this.dir = dirPath;
    this.filter = filter;
  }

  walk() {
    return new Promise<string[]>((res, rej) => {
      var changedFiles = [];
      this.getFiels(this.dir, changedFiles, rej);
      res(changedFiles);
      // var walker = walk.walk(this.dir);
      // walker.on("file", (root, stat, next) => {
      //     var filePath = path.join(root, stat.name);
      //     var relativePath = path.relative(this.dir, filePath);
      //     if (this.filter && !this.filter(relativePath, filePath, stat)) {
      //         next();
      //         return;
      //     }
      //     var millis = stat.mtime.getTime();
      //     if (this.files.has(filePath) && this.files.get(filePath)
      //         == millis) {
      //         next();
      //         return;
      //     }
      //     this.files.set(filePath, millis);
      //     changedFiles.push(relativePath);
      //     next();
      // })
      // walker.on("end", () => {
      //     res(changedFiles);
      // });
      // walker.on("nodeError", err => {
      //     rej(err);
      // })
    });

  }
  getFiels(rootPath: string, fileList: string[], rej) {
    let files = fs.readdirSync(rootPath, { withFileTypes: true });
    files.filter((f: any) => {
      var filePath = path.join(rootPath, f.name);
      // console.log(filePath + ":" + this.filter(null, filePath, null))
      return this.filter(null as any, filePath, null as any);
    }).forEach((f: any) => {
      let filePath = path.join(rootPath, f.name);
      let relativePath = path.relative(this.dir, filePath);
      if (f.isDirectory()) {
        // console.log("目录：" + f.name)
        this.getFiels(filePath, fileList, rej);
      } else if (f.isFile()) {
        // console.log("文件：" + f.name)
        fileList.push(relativePath);
      } else {
        // console.log("未知类型：" + f.name)
      }
    });
  }
}