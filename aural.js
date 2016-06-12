// rule name > sound mapping
// priority lowest to highest
window.ruleSoundsLevel1 = {};
window.ruleSoundsLevel2 = {};
function setRuleSoundGroup(ruleSounds, ruleNameArray, sound) {
    ruleNameArray.forEach(function(ruleName) { ruleSounds[ruleName] = sound; });
}

// LEVEL 1: broader context. Use noise sounds for these
ruleSoundsLevel1['IfStatement'] = 'pink';
ruleSoundsLevel1['FunctionExpression'] = 'brown';
ruleSoundsLevel1['FormalParameterList'] = 'pink';
ruleSoundsLevel1['ArgumentList'] = 'pink';
ruleSoundsLevel1['ReturnEnd'] = 'pinktone';

// boring.
ruleSoundsLevel1['Program'] = 'lowlevel';


// LEVEL 2: more specific statements and literals. Use tones for these 

// High alert on strings (the equivalent of a bright annoying color in syntax highlighting)
ruleSoundsLevel2['String'] = 'devil';

// here's a bunch of variable-assigning-related rules
setRuleSoundGroup(ruleSoundsLevel2, [
    'JScriptVarStatement',
    'VariableStatement',
    'VariableDeclaration',
    'VariableDeclarationList',
    //'AssignmentExpression',
], 'fifth');

// boring.
ruleSoundsLevel2['Program'] = 'lowlevel';

// NOISE DEFINITIONS - superposition of white, pink, and brown noise
window.noiseSets = {
    // background noise
    'lowlevel' : { white: 0.01, pink: 0.01, brown: 0.01 },

    // some tones!
    'octave' : { 'A3': 0.8, 'A4':0.4, brown: 0.1 },
    'fifth' : { 'D4': 0.8, 'A4':0.4, brown: 0.5 },
    'fourth' : { 'E4': 0.8, 'A4':0.4, brown: 0.5 },
    'majorsixth' : { 'C4': 0.8, 'A4':0.4, brown: 0.5 },
    'minorsixth' : { 'C#4': 0.8, 'A4':0.4, brown: 0.5 },
    'majorthird' : { 'F4': 0.8, 'A4':0.4, brown: 0.5 },
    'minorthird' : { 'F#4': 0.8, 'A4':0.4, brown: 0.5 },
    'majorsecond' : { 'G4': 0.8, 'A4':0.4, brown: 0.5 },
    'minorsecond' : { 'G#4': 0.8, 'A4':0.4, brown: 0.2 },
    'seventh' : { 'B3': 0.8, 'A4':0.4, pink: 0.1 },
    'devil' : { 'D#4': 0.8, 'A4':0.4, white: 0.05 },

    // Mostly noise but with a bit of tone
    'pinktone'  : { pink: 1, 'A3': 0.5 },

    // basic noises
    'white' : { white: 0.6, pink: 0, brown: 0 }, // white tends to appear louder
    'pink'  : { white: 0, pink: 1, brown: 0 },
    'brown' : { white: 0, pink: 0, brown: 1 },
    'niceblended' : { white: 0.1, pink: 0.3, brown: 0.5 },

}

// create editor
window.editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/javascript");

// display rules and sounds, and let person change them
window.ruleDisplay1 = document.getElementById('rules1');
window.ruleDisplay2 = document.getElementById('rules2');
window.soundDisplay = document.getElementById('sounds');

window.onload = function() {
    Noises.startAll().allOff();
    
    // Display rules and sounds and let person change them
    ruleDisplay1.value = JSON.stringify(ruleSoundsLevel1, null, '  ');
    ruleDisplay2.value = JSON.stringify(ruleSoundsLevel2, null, '  ');
    soundDisplay.value = JSON.stringify(noiseSets, null, '  ');

    // Set up the parsing
    auralParse('');
    editor.getSession().selection.on('changeCursor', function(e) {
        refreshCodeSounds();
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

    refreshCodeSounds();
}

function refreshCodeSounds() {
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
}

function auralParse(code) {
    var parser = new nearley.Parser(grammar.ParserRules, grammar.ParserStart);
    parser.feed(code);

    // turn off all sounds
    Noises.allOff();

    // turn on just these ones
    var rulesToUse = [];
    var latestStates = parser.table[parser.table.length - 1];

    latestStates.forEach(function(state) {
        if (state.isComplete()) return;

        if (rulesToUse.indexOf(state.rule.name) !== -1) return; // keep the array unique
        rulesToUse.push(state.rule.name);
    });

    console.log('\nAllowed but incomplete rules for: `' + code.replace(/\n/g, ' ') + '`');
    console.log(rulesToUse);


    // Go in order of this list of rules, to preserve priority
    var noiseArray = [ruleSoundsLevel1, ruleSoundsLevel2].map(function(ruleSounds) {
        var noise = noiseSets.lowlevel;
        var rulesWithSounds = []; // *** just for logging purposes
        for (var rule in ruleSounds) {
            if (rulesToUse.indexOf(rule) > -1) {
                rulesWithSounds.push(rule);
                noise = noiseSets[ruleSounds[rule]];
            } 
        }
        console.log('...with sounds:', rulesWithSounds);
        return noise;
    })

    Noises.set(noiseCombine(noiseArray));
}

//  noiseCombine([
//    {white: 0.5, brown: 0.5},
//    {white: 0.3, pink: 1}
//  ])
//  =>
//  {white: 0.8, brown: 0.5, pink: 1}
function noiseCombine(noiseSetArray) {
    var combined = {};
    noiseSetArray.forEach(function(noiseSet) {
        for (var noiseId in noiseSet) {
            if (!(noiseId in combined)) combined[noiseId] = 0;
            combined[noiseId] += noiseSet[noiseId];
        }
    })
    return combined;
}
