if (!args[0] || !args[1]) return "expected at 2 args";
const url = args[0].toString();
const path = args[1].toPath();

try {
    const r = await fetch(url);
    if (!r.ok) return "failed";

    const c = await (async () => {
        const type = r.headers.get("Content-Type");
        if(type === null) {
            return await r.text()
        }
        if (type.startsWith("text/") || type.endsWith("/json")) return await r.text();
        const blob = await r.blob();
        return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result); 
            };
            reader.readAsDataURL(blob);
        });
    })();
    FS.addFile(path, c);
    return "done";
} catch (e) {
    console.error(e);
    return "failed";
}
