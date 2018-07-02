"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander = require("commander");
const openssl_1 = require("./openssl");
var $pkg = require('./package.json');
var $ssl = new openssl_1.OpenSslHelper();
class CliHelper {
    constructor() {
        this.loadCli();
    }
    loadCli() {
        commander
            .version($pkg.version, '-v, --version')
            .description($pkg.description)
            .option('-d, --debug', 'Show debug output')
            .option('-s, --summarize', 'Summarize console output')
            .option('--no-warnings', 'Hide warning messages');
    }
    registerFileCommand(name, description, action) {
        commander
            .command(name)
            .description(description)
            .option('--cname <value>', 'Set the current working directory')
            .option('--name <value>', 'Set the search glob')
            .option('--path <path>', 'Set the destination directory')
            .option('--alt-names <names>', 'Set the destination directory')
            .action((cmd) => {
            let options = this.getOptions(cmd.parent);
            let obj = cmd;
            let certName = obj.name;
            let cname = obj.cname;
            let path = obj.path;
            let alt_names = (obj.altNames == undefined)
                ? undefined
                : obj.altNames.split(',');
            if (options.IsDebug) {
                console.log();
                console.dir(options);
                console.log();
                console.log(`cert name: ${certName}`);
                console.log(`cname: ${cname}`);
                console.log(`path: ${path}`);
                console.log('alt names: ', alt_names);
            }
            action(certName, cname, path, alt_names, options);
        });
    }
    process() {
        return commander.parse(process.argv);
    }
    getOptions(obj) {
        return new openssl_1.OpenSslOptions(obj.debug, obj.summarize, !obj.warnings);
    }
}
exports.CliHelper = CliHelper;
//# sourceMappingURL=cli-helper.js.map