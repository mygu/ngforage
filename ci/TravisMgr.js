const fs = require('fs');
const {join, resolve} = require('path');

/** @type {TravisMgr} */
const TravisMgr = (() => {

  class TravisMgr {

    /** @private */
    get root() {
      return resolve(__dirname, '..');
    }

    /** @private */
    get pkgJsonPath() {
      return join(this.root, 'package.json');
    }

    /** @private */
    get version() {
      return this.pkgJsonContents.version;
    }

    /** @private */
    get pkgJsonBak() {
      return join(this.root, 'package.json.bak');
    }

    /** @private */
    get readmePath() {
      return join(this.root, 'README.md');
    }

    get readmeBakPath() {
      return join(this.root, 'README.md.bak');
    }

    backUpReadme() {
      fs.copyFileSync(this.readmePath, this.readmeBakPath);
    }

    restoreReadme() {
      fs.renameSync(this.readmeBakPath, this.readmePath);
    }

    backUpPkg() {
      fs.copyFileSync(this.pkgJsonPath, this.pkgJsonBak);
    }

    restorePkg() {
      fs.renameSync(this.pkgJsonBak, this.pkgJsonPath);
    }

    get CI_NG_VERSION() {
      return process.env.CI_NG_VERSION;
    }

    get matVersion() {
      if (this.CI_NG_VERSION === '4') {
        return '^2.0.0-beta.12';
      }
    }

    get ngVersion() {
      if (this.CI_NG_VERSION === '4') {
        return '^4.4';
      }
    }

    /** @private */
    get pkgJsonContents() {
      return JSON.parse(fs.readFileSync(this.pkgJsonPath, 'utf8'));
    }

    /** @private */
    writePkgJson(json) {
      return fs.writeFileSync(this.pkgJsonPath, JSON.stringify(json, null, 2));
    }

    /** @private */
    get keys() {
      return [
        'dependencies',
        'peerDependencies',
        'devDependencies'
      ];
    }

    /** @private */
    get readmeContents() {
      return fs.readFileSync(this.readmePath, 'utf8');
    }

    updateReadme() {
      let newContents = this.readmeContents.replace(/branch=[^)]+/igm, `branch=${encodeURIComponent(this.version)}`);
      newContents = newContents.replace('ngforage@package-version', `ngforage@${this.version}`);

      fs.writeFileSync(this.readmePath, newContents);
    }

    writeMat() {
      const json = this.pkgJsonContents;
      for (const k of this.keys) {
        for (const pkgName of Object.keys(json[k])) {
          if (pkgName === '@angular/material' || pkgName === '@angular/cdk') {
            json[k][pkgName] = this.matVersion;
          }
        }
      }

      this.writePkgJson(json);
    }

    writeNg() {
      const json = this.pkgJsonContents;
      for (const k of this.keys) {
        for (const pkgName of Object.keys(json[k])) {
          if (pkgName.startsWith('@angular') && pkgName !== '@angular/material' && pkgName !== '@angular/cdk') {
            json[k][pkgName] = this.ngVersion;
          }
        }
      }

      this.writePkgJson(json);
    }
  }

  return new TravisMgr();
})();

function isKnownCommand(cmd) {
  return [
    'backup-pkg',
    'restore-pkg',
    'set-version',
    'backup-readme',
    'restore-readme',
    'update-readme'
  ].includes(cmd);
}

console.log(`CI_NG_VERSION: ${TravisMgr.CI_NG_VERSION || '<not set>'}`);

const cmds = process.argv.slice(2).filter(cmd => !!cmd)
  .map(cmd => {
    if (!isKnownCommand(cmd)) {
      console.error(`Unknown cmd: ${cmd}`);
      process.exit(1);
    }
    return cmd;
  });

if (!cmds.length) {
  console.error('No commands to run');
  process.exit(1);
}

for (const cmd of cmds) {
  console.log(`Running ${cmd}`);
  switch (cmd) {
    case 'backup-readme':
      TravisMgr.backUpReadme();
      break;
    case 'restore-readme':
      TravisMgr.restoreReadme();
      break;
    case 'update-readme':
      TravisMgr.updateReadme();
      break;
    case 'backup-pkg':
      TravisMgr.backUpPkg();
      break;
    case 'restore-pkg':
      TravisMgr.restorePkg();
      break;
    case 'set-version':
      if (TravisMgr.matVersion) {
        console.log(`Setting material version to ${TravisMgr.matVersion}`);
        TravisMgr.writeMat();
      } else {
        console.log(`Skipping material version replacement`);
      }

      if (TravisMgr.ngVersion) {
        console.log(`Setting ng version to ${TravisMgr.ngVersion}`);
        TravisMgr.writeNg();
      } else {
        console.log(`Skipping ng version replacement`);
      }
      break;
  }
}
