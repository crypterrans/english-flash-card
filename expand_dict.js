const fs = require('fs');
const path = require('path');

const dictPath = path.join(__dirname, 'src', 'flashcardDictionary.json');
const dataPath = path.join(__dirname, 'expansion_data.txt');

const dict = JSON.parse(fs.readFileSync(dictPath, 'utf8'));
const lines = fs.readFileSync(dataPath, 'utf8').split('\n');

lines.forEach(line => {
  const trimmed = line.trim();
  if (!trimmed) return;
  
  const [level, theme, emoji, word, pos, example, hint] = trimmed.split('|');
  
  if (!dict[level]) {
    dict[level] = {};
  }
  
  if (!dict[level][theme]) {
    dict[level][theme] = [];
  }
  
  dict[level][theme].push({
    emoji,
    word,
    partOfSpeech: pos,
    exampleSentence: example,
    hint
  });
});

fs.writeFileSync(dictPath, JSON.stringify(dict, null, 2));
console.log('Dictionary successfully expanded.');
