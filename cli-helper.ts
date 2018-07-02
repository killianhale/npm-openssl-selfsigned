import * as commander from 'commander'
import * as _ from 'underscore'

import { OpenSslHelper, OpenSslOptions } from './openssl';

var $pkg = require('./package.json');

var $ssl = new OpenSslHelper();

export interface SslCommandAction {
    (certName: string, cname: string, path: string, alt_names?: string[], options?: OpenSslOptions): void;
}

export class CliHelper {

    constructor() {
        this.loadCli();
    }

    private loadCli() {
        commander
            .version($pkg.version, '-v, --version')
            .description($pkg.description)
            .option('-d, --debug', 'Show debug output')
            .option('-s, --summarize', 'Summarize console output')
            .option('--no-warnings', 'Hide warning messages');
    }

    public registerFileCommand(name: string, description: string, action: SslCommandAction) {
        commander
            .command(name)
            .description(description)
            .option('--cname <value>', 'Set the current working directory')
            .option('--name <value>', 'Set the search glob')
            .option('--path <path>', 'Set the destination directory')
            .option('--alt-names <names>', 'Set the destination directory')
            //.option('-a, --all', 'Clones packages by adding a search glob for all files. (Search glob \'**\')')
            .action((cmd: commander.Command) => {
                let options = this.getOptions(cmd.parent);

                let obj: any = cmd;

                let certName: string = obj.name;
                let cname: string = obj.cname;
                let path: string = obj.path;
                let alt_names: string[] | undefined = (obj.altNames == undefined)
                    ? undefined
                    : obj.altNames.split(',');

                if(options.IsDebug) {
                    console.log();
                    console.dir(options);
                    console.log();
                    console.log(`cert name: ${certName}`);
                    console.log(`cname: ${cname}`);
                    console.log(`path: ${path}`);
                    console.log('alt names: ', alt_names);
                }

                action(
                    certName,
                    cname,
                    path,
                    alt_names,
                    options
                );
            });
    }

    public process(): any {
        return commander.parse(process.argv);
    }

    private getOptions(obj: any): OpenSslOptions {
        return new OpenSslOptions(
            obj.debug,
            obj.summarize,
            !obj.warnings
        );
    }
}