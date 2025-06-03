if(flags.includes("s")) return eval(`"${args[0].toString() || ""}"`);
return args[0]?.toString() || "";
