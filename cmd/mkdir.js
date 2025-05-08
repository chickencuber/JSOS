if(!args[0]) return "expected 1 arg";
const path = args[0].toPath();
if(await FS.exists(path)) return "path already exists";
await FS.addDir(path);
