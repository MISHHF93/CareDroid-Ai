const fs = require('fs');
const en = JSON.parse(fs.readFileSync('src/i18n/en.json','utf8'));
const langs = ['es','fr','de','pt','zh','ja','ar','he'];

function deepMerge(enObj, oldObj) {
  const result = {};
  for (const key of Object.keys(enObj)) {
    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      result[key] = deepMerge(enObj[key], (oldObj && oldObj[key]) || {});
    } else {
      result[key] = (oldObj && oldObj[key] !== undefined) ? oldObj[key] : enObj[key];
    }
  }
  return result;
}

for (const lang of langs) {
  const oldFile = JSON.parse(fs.readFileSync('src/i18n/' + lang + '.json', 'utf8'));
  const merged = deepMerge(en, oldFile);
  fs.writeFileSync('src/i18n/' + lang + '.json', JSON.stringify(merged, null, 2) + '\n');
  console.log(lang + '.json: written');
}
console.log('Done');
