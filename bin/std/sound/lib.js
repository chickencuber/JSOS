const M = {}; //Ive spent too much time doing nvim plugins

let ctx;
function getCtx() {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") {
        return ctx.resume().then(() => ctx);
    }
    return Promise.resolve(ctx);
}

M.loadsound = async function(url, {pitch = 1, volume = 1, speed = 1, loop = false} = {}) {
    const ctx = await getCtx();

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = speed * pitch;
    source.loop = loop;

    const gainNode = ctx.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.isended = false;
    let ret;
    source.ended = new Promise(r => {ret = r});
    source.onended = function() {
        source.isended = true;
        ret();
    }
    return source;
}

M.playsound = async function(url, {pitch = 1, volume = 1, speed = 1, loop = false} = {}) {
    const ctx = await getCtx();

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = speed * pitch;
    source.loop = loop;

    const gainNode = ctx.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.isended = false;
    let ret;
    source.ended = new Promise(r => {ret = r});
    source.onended = function() {
        source.isended = true;
        ret();
    }
    source.start();
    return source;
}

M.wave = {
    Sine: "sine", 
    Square: "square",
    Sawtooth: "sawtooth", 
    Triangle: "triangle",
};

M.playtone = async function(frequency, {volume = 1, duration = 1000, type = M.wave.Sine} = {}) {
    const ctx = await getCtx();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;

    gainNode.gain.value = volume;

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    await new Promise(r => {
        setTimeout(() => {
            r();
        }, duration)
    });
    osc.stop();
    osc.disconnect();
    gainNode.disconnect();
}

return M;
