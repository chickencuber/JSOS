if(!args[0]) return "expected 1 arg";
const path = args[0].toPath();
if(FS.exists(path)) return "path already exists";
FS.addDir(path);