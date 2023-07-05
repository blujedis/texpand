const splitExp = /\s(?=(?:(?:[^"']*["']){2})*[^"']*$)/;

const arg = 'invoice other "testing quoted sentence"'

const result = arg.split(splitExp);

console.log(result);