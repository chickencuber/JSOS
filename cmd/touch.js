if(!args[0]) return "expected 1 arg";
const path = args[0].toPath();
if(FS.exists(path)) return "path already exists";
let c = "";
if(args.length > 1) {
  args.shift();
  c = args.join(" ");
}
FS.addFile(path, c);