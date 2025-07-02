function waitUntil(f) {
    let i;
    return [
        new Promise((v) => {
            i = setInterval(() => {
                if (f()) {
                    clearInterval(i);
                    v();
                }
            }, 10);
        }),
        i,
    ];
}

async function safeEval(code, path = "/", args = [], shell, has_lifetime = true) {
    const iframe = document.createElement("iframe");
    document.body.appendChild(iframe);

    const sandboxedWindow = iframe.contentWindow;

    for (let [k, v] of Object.entries(safeEval.expose)) {
        if (v?.type === "func") v = v.func(sandboxedWindow, shell);
        sandboxedWindow[k] = v;
    }
    let flags = [];
    if (args[0]?.toString().startsWith("-")) {
        flags.push(...args.shift().toString().slice(1));
    }
    sandboxedWindow.flags = flags;
    sandboxedWindow.dir = path;
    sandboxedWindow.args = args;
    sandboxedWindow.Shell = shell;

    const [p, i] = waitUntil(() => shell.exit === true);
    try {
        // Use Function constructor to evaluate code in the sandbox
        const result = await Promise.race([
            sandboxedWindow.eval(`(async ()=>{
                ${code}
            })()`),
            p,
        ]);
        if(has_lifetime) shell.onExit();
        return result;
    } catch (error) {
        console.error("Error in sandboxed eval:", error, "\n" + code);
        return error.toString();
    } finally {
        // Clean up: remove the iframe after execution
        document.body.removeChild(iframe);
    }
}

safeEval.expose = {
    parent: null,
    opener: null,
    top: null,
    console,
    fetch,
};

safeEval.add = (obj, call) => {
    for (const [k, v] of Object.entries(obj)) {
        safeEval.expose[k] = v;
    }
};

safeEval.fromWindow = (func) => {
    return {
        type: "func",
        func: (win, shell) => {
            return (...args) => {
                return func(win, shell, ...args);
            };
        },
    };
};
