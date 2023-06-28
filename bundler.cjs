const AdmZip = require('adm-zip');
const join = require('path').join;

async function packageExtension(filename = 'texpand.zip') {
  const zip = new AdmZip();
  zip.addLocalFolder('./dist');
  zip.writeZip(join(process.cwd(), 'extension', filename));
  console.log();
  console.log(`Created ${filename} successfully`);
}

packageExtension();