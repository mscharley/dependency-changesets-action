import * as path from "path"

export const generatePossiblesParentsPackages = function(patchFilename: string) {
  const generator = function*() {
    if(patchFilename === 'package.json' || patchFilename.endsWith('/package.json')) {
      yield patchFilename;
      return;
    };
  
    let cursor = patchFilename;
  
    do {
      cursor = path.dirname(cursor);
      const packageJson = path.join(cursor, "package.json");
      yield packageJson;
    } while(path.dirname(cursor) !== cursor);
  }

  return Array.from(generator())
}
