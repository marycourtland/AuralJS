// rule name > sound mapping
// priority lowest to highest
window.ruleSounds = {};
function setRuleSoundGroup(ruleNameArray, sound) {
    ruleNameArray.forEach(function(ruleName) { ruleSounds[ruleName] = sound; });
}

// High alert on strings
ruleSounds['String'] = 'white';

// here's a bunch of variable-assigning-related rules
setRuleSoundGroup([
    'JScriptVarStatement',
    'VariableStatement',
    'VariableDeclaration',
    'VariableDeclarationList',
    //'AssignmentExpression',
], 'niceblended');

ruleSounds['IfStatement'] = 'pink';


// these are boring so make sure we override any sounds
// (TODO: might change how everything works...)
var boringRules = [
    'Statement',
    'Program'
];
setRuleSoundGroup(boringRules, 'lowlevel');

// NOISE DEFINITIONS - superposition of white, pink, and brown noise
window.noiseSets = {
    'lowlevel' : { white: 0.01, pink: 0.01, brown: 0.01 },
    'white' : { white: 1, pink: 0, brown: 0 },
    'pink'  : { white: 0, pink: 1, brown: 0 },
    'brown' : { white: 0, pink: 0, brown: 1 },
    
    'niceblended' : { white: 0.3, pink: 0.8, brown: 0.3 }
}

// create editor
window.editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/javascript");

// display rules and sounds, and let person change them
window.ruleDisplay = document.getElementById('rules');
window.soundDisplay = document.getElementById('sounds');

window.onload = function() {
    useSoundFiles ? loadSounds() : Noises.startAll().allOff();
    
    // Display rules and sounds and let person change them
    ruleDisplay.value = JSON.stringify(ruleSounds, null, '  ');
    soundDisplay.value = JSON.stringify(noiseSets, null, '  ');

    // Set up the parsing
    auralParse('');
    editor.getSession().selection.on('changeCursor', function(e) {
        try {
            var cursor = editor.selection.getCursor();
            
            // Not sure how to use Ace's range constructor... but this will do the trick
            var range = editor.getSelectionRange();
            range.setStart(0, 0);
            range.setEnd(cursor.row, cursor.column);

            var code = editor.session.getTextRange(range);

            auralParse(code);
        }
        catch(e) {
            // meh
            // TODO: a really ugly sound would be nice here
        }
    });
}

function refreshFromDisplay(display, object) {
    var jsonText = display.value;
    var json = null;
    try {
        json = JSON.parse(jsonText);
    }
    catch(e) {
       console.warn('JSON parsing error: ' + e);
       return;
    }
    
    for (var key in object) { delete object[key]; }
    for (var key in json) { object[key] = json[key]; }
 
    display.value = JSON.stringify(json, null, '  ');
}

function auralParse(code) {
    var parser = new nearley.Parser(grammar.ParserRules, grammar.ParserStart);
    parser.feed(code);

    // turn off all sounds
    useSoundFiles ? turnAllOff() : Noises.allOff();

    // turn on just these ones
    var rulesWithSounds = [];
    var latestStates = parser.table[parser.table.length - 1];

    latestStates.forEach(function(state) {
        if (state.isComplete()) return;

        if (rulesWithSounds.indexOf(state.rule.name) !== -1) return; // keep the array unique
        rulesWithSounds.push(state.rule.name);
    });

    var noiseSet = noiseSets.lowlevel; // default sound

    console.log('\nRule sounds for: ' + code.replace(/\n/g, ' '));
    console.log(rulesWithSounds);

    // Go in order of this list of rules, to preserve priority
    for (var rule in ruleSounds) {
        if (rulesWithSounds.indexOf(rule) > -1) {
            noiseSet = noiseSets[ruleSounds[rule]];
        } 
    }

    Noises.set(noiseSet);
}


// sound files - NOT USED
var useSoundFiles = false;
if (useSoundFiles) {
    // this uses SoundJs
    var sounds = {
        pink: {url:"./audiocheck.net_pink_88k_-3dBFS.wav", sound: null},
        white: {url:"./audiocheck.net_white_88k_-3dBFS.wav", sound: null},
    }

    createjs.Sound.on('fileload', function(evt) {
        sounds[evt.id].sound = createjs.Sound.play(evt.id, {loop:1});
        sounds[evt.id].sound.volume = 0;
        console.log('OK', evt.id)
    })

    function turnAllOff() {
        for (var sound_id in sounds) sounds[sound_id].sound.volume = 0;
    }

    function turnOn(sound_id) {
        sounds[sound_id].sound.volume = 1;
    }

    function loadSounds () {
        for (var s in sounds) {
            createjs.Sound.registerSound(sounds[s].url, s);
        }
    }
    loadSounds();
}

