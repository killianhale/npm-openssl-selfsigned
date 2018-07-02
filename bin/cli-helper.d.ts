import { OpenSslOptions } from './openssl';
export interface SslCommandAction {
    (certName: string, cname: string, path: string, alt_names?: string[], options?: OpenSslOptions): void;
}
export declare class CliHelper {
    constructor();
    private loadCli();
    registerFileCommand(name: string, description: string, action: SslCommandAction): void;
    process(): any;
    private getOptions(obj);
}
