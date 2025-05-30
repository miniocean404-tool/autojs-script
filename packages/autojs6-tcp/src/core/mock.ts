// hello
const hello = { id: 1, type: "hello", data: { extensionVersion: "1.0.0" } }

// 运行项目
const run = {
  id: 2,
  type: "command",
  data: { id: 2, name: "script.js", script: "console.show()", command: "run" },
}

const runProject = {
  type: "bytes_command",
  md5: "c45c4504c0d91d8167533b92a1356eb9",
  data: {
    id: "/Users/daihaiyang/Desktop/my-code/test/test-autojs",
    name: "/Users/daihaiyang/Desktop/my-code/test/test-autojs",
    deletedFiles: [],
    override: false,
    command: "run_project",
  },
}

const saveProject = {
  type: "bytes_command",
  md5: "5d94581d7c86a92add81ddf2da65e9b5",
  data: {
    id: "/Users/daihaiyang/Desktop/my-code/test/test-autojs",
    name: "/Users/daihaiyang/Desktop/my-code/test/test-autojs",
    deletedFiles: [],
    override: true,
    command: "save_project",
  },
}
