// http://noisehack.com/generate-noise-web-audio-api/ !

var Noises = (function() {
    var audioContext = new webkitAudioContext();

    var masterVolume = audioContext.createGain();
    masterVolume.connect(audioContext.destination);
    masterVolume.gain.value = 1;

    function Noise(noiseFunction) {
        var bufferSize = 2 * audioContext.sampleRate,
          noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate),
          output = noiseBuffer.getChannelData(0);

        for (var i = 0; i < bufferSize; i++) {
            output[i] = noiseFunction(i);
        }

        var noise = audioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        // ok let's dress this up a bit
        this.noise = noise;

        var volumeNode = audioContext.createGain();
        volumeNode.connect(masterVolume);
        volumeNode.gain.value = 1;
        this.noise.connect(volumeNode);

        this.start = function() { this.noise.start(0); return this; }
        this.setVolume = function(level) { volumeNode.gain.value = level; return this; }
    }

    var noises = {
        white: new Noise(function() { return Math.random() * 2 - 1; }),

        pink: (function() {
            var b0, b1, b2, b3, b4, b5, b6;
            b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
            var noise = new Noise(function(i) {
                var white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                var output = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                output *= 0.11; // (roughly) compensate for gain
                b6 = white * 0.115926;
                return output
            })
            return noise;
        })(),

        brown: (function() {
            var lastOut = 0;
            var noise = new Noise(function(i) {
                var white = Math.random() * 2 - 1;
                var output = (lastOut + (0.02 * white)) / 1.02;
                lastOut = output;
                output *= 3.5; // (roughly) compensate for gain
                return output;
            })
            return noise;
        })()
    }

    var exports = {
        startAll: function() {
            for (var id in noises) { noises[id].start(); }
            return this;
        },

        // TODO: need to compensate for gain

        set: function(volumes) {
            console.log('setting volumes:', volumes)
            if (!volumes) return this;

            for (var id in volumes) {
                if (!(id in noises)) {
                    console.warn('No noise with id ' + id);
                }
                noises[id].setVolume(volumes[id]);
            }
            return this;
        },

        allOff: function() {
            for (var id in noises) { noises[id].setVolume(0); }
            return this;
        }
    }

    return exports;
})()
