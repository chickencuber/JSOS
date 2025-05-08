if(!args[0] || !args[1]) return "expected 2 arguments"
const from = args[0].toPath();
const to = args[1].toPath();
if(!await FS.exists(from)) {
  return "path doesn't exist";
}
if(await FS.exists(to)) {
  return "path already exists";
}

await FS.copy(from, to)
