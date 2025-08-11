return async (code, dir = "", args = []) => {
    code = code.split("\n").map((v) => v.trim());
    const _vars = {
        dir,
        ...args,
        args: args.join(" "),
    };
    const vars = new Proxy(_vars, {
        get(target, p) {
            if(p.startsWith("$")) {
                return Shell.localVars[p.slice(1)];
            }
            return target[p];
        }
    })
    for (const l of code) {
        if (!l || l.startsWith("#")) continue;
        const r = await Shell.run(
            l
            .replaceAll(/(?<!\\)\$([A-Za-z0-9]+)/gm, (_, name) => {
                return vars[name];
            })
            .replaceAll(/\\\$([A-Za-z0-9]+)/gm, (_, name) => {
                return "$" + name;
            })
        );
        if (r) Shell.terminal.add(r + "\n");
    }
};
