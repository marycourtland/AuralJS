// http://noisehack.com/generate-noise-web-audio-api/ !

var Noises = (function() {
    var audioContext = new (window.AudioContext || window.webkitAudioContext)(); 

    var masterVolume = audioContext.createGain();
    masterVolume.connect(audioContext.destination);
    masterVolume.gain.value = 0.5; // don't hurt people's ears...

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

        var volumeNode = VolumeNode();
        this.noise.connect(volumeNode);

        this.start = function() { this.noise.start(0); return this; }
        this.setVolume = function(level) { volumeNode.gain.value = level; return this; }
    }

    function Oscillator(freq) {
        var oscillator = audioContext.createOscillator();
        var volumeNode = VolumeNode();
        oscillator.connect(volumeNode);

        // 'sine' is pretty safe
        // 'square' is okay, but harsh
        // 'triangle' is quite harsh, but effective when very low volume, and high volume noise
        oscillator.type = 'triangle';
        oscillator.frequency.value = freq;

        this.start = function() { oscillator.start(); return this; }
        this.setVolume = function(level) { volumeNode.gain.value = level; return this; }
    }

    function VolumeNode() {
        var volumeNode = audioContext.createGain();
        volumeNode.connect(masterVolume);
        volumeNode.gain.value = 1;
        return volumeNode;
    }

    var noises = {
        "A3": new Oscillator(220.00),
        "A#3": new Oscillator(233.08),
        "B3": new Oscillator(246.94),
        "C4":  new Oscillator(261.63),
        "C#4": new Oscillator(277.18),
        "D4":  new Oscillator(293.66),
        "D#4": new Oscillator(311.13),
        "E4":  new Oscillator(329.63),
        "F4":  new Oscillator(349.23),
        "F#4": new Oscillator(369.99),
        "G4":  new Oscillator(392.00),
        "G#4": new Oscillator(415.30),
        "A4":  new Oscillator(440.00),
        "A#4": new Oscillator(466.16),
        "B4":  new Oscillator(493.88),
        "C5":  new Oscillator(523.25),

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
        },

        masterVolume: function(volume) {
            masterVolume.gain.value = volume;
        }
    }

    return exports;
})()
