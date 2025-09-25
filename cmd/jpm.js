Shell.terminal.scroll.allow = true;
async function request(p) {
  const URL =
    "https://script.google.com/macros/s/AKfycbyhfnfikuaxp9KWKaTUloK0eNtO1m0tEJh_CYA-jdpddLukbbGox7PbcwMdyKoqGaHc/exec";
  const obj = {};
  if (p.GET) {
    const params = Object.entries(p.GET)
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    const r = await fetch(`${URL}?${params}`);
    const c = await r.text();
    obj.GET = c;
  }
  if (p.POST) {
    const params = Object.entries(p.POST)
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    const r = await fetch(`${URL}?${params}`, {
      method: "POST",
    });
    const c = await r.text();
    obj.POST = c;
  }
  return obj;
}

const cmd = flags.join("");

if (cmd === "") return "no command provided";

async function install() {
  if (await FS.exists(`/bin/${args[0]}`)) {
    return "package already installed";
  }
  try {
    const shell = await use("/bin/std/sh");
    const v = (await request({ GET: { name: args[0].toString() } })).GET;
    await shell(
      v
        .split("\n")
        .map((v) => (v.endsWith(".exe.js") ? v.slice(0, -3) : v))
        .join("\n")
    );
    if (await FS.exists(`/bin/${args[0]}/cmd.sh`)) {
      await FS.addFile(`/cmd/${args[0]}.sh`, `/bin/${args[0]}/cmd.sh $args`);
    } else if (await FS.exists(`/bin/${args[0]}/cmd.exe`)) {
      await FS.addFile(`/cmd/${args[0]}.sh`, `/bin/${args[0]}/cmd.exe $args`);
    }
    if (await FS.exists(`/bin/${args[0]}/.depend`)) {
      const d = (await FS.getFromPath(`/bin/${args[0]}/.depend`)).split("\n");
      for (const i of d) {
        await Shell.run(`jpm -d ${i}`);
      }
    }
    if (!await FS.exists(`/user/${args[0]}`)) await FS.addDir(`/user/${args[0]}`);
    if (await FS.exists(`/bin/${args[0]}/start.sh`)) {
      await Shell.run(`/bin/${args[0]}/start.sh`);
    } else if (await FS.exists(`/bin/${args[0]}/start.exe`)) {
      await Shell.run(`/bin/${args[0]}/start.exe`);
    }
    const current = (await FS.getFromPath("/bin/.packages"))
      .split("\n")
      .filter((v) => v !== "");
    current.push(args[0].toString());
    await FS.addFile("/bin/.packages", current.join("\n"));
    return "done";
  } catch (e) {
      console.log(e)
    return "failed";
  }
}

async function remove() {
  const current = (await FS.getFromPath("/bin/.packages"))
    .split("\n")
    .filter((v) => v !== "");
  await FS.addFile(
    "/bin/.packages",
    current.filter((v) => v !== args[0].toString()).join("\n")
  );

  await FS.delete(`/bin/${args[0]}`);
  if (await FS.exists(`/cmd/${args[0]}.sh`)) {
    await FS.delete(`/cmd/${args[0]}.sh`);
  }
}

if (cmd === "i") {
  if (!args[0]) return "expected 1 argument";
  return await install();
} else if (cmd === "u") {
  if (!args[0]) return "expected 1 argument";
  if (!await FS.exists(`/bin/${args[0]}`)) return "package not installed";
  await remove();
  return await install();
} else if (cmd === "r") {
  if (!args[0]) return "expected 1 argument";
  if (!await FS.exists(`/bin/${args[0]}`)) return "package not installed";
  await remove();
  return "done";
} else if (cmd === "?") {
  return `jpm -i [package] //installs a package
jpm -u [package] //updates a package
jpm -r [package] //deletes a package
jpm -d [package] //if it exists, it update, if not, it installs
jpm -sys //updates the system(saves any packages)`;
} else if (cmd === "d") {
  if (await FS.exists(`/bin/${args[0]}`)) {
    return await Shell.run(`jpm -u ${args[0]}`);
  } else {
    return await Shell.run(`jpm -i ${args[0]}`);
  }
} else if (cmd === "sys") {
  await Shell.update();
} else { 
    return "invalid command\n" + await Shell.run("jpm -?")
}
    
