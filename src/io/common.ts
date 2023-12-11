import { BundleEntry } from "../bundle-entry";
import { ResourcePack } from "../resource-pack";

/* TODO support more import/export formats, such as JSON, XLSX or XLIFF */
export enum FileFormat {
    CSV
}

export interface ExportOptions {
    outFile : string,
    ifNotLocales ?: string[]
}

export interface ImportOptions {
    ignoreIfEmpty : boolean
}

export abstract class Exporter<T> {

    // all options which influence the outcome of shouldInclude must be defined here
    protected excludeIfAll : string[] = []

    constructor(options : ExportOptions) {
        if (options.ifNotLocales) {
            this.excludeIfAll = options.ifNotLocales;
        }
    
    }

    /**
     * Determines whether a given `BundleEntry` should be included in the exported
     * package based on the current export options
     * @param entry 
     * @returns 
     */
    protected shouldInclude(entry : BundleEntry) : boolean {
        let include = true;

        // Other filtering options may be checked here in the future
        if(this.excludeIfAll.length > 0) {
            include = !entry.hasAllLocales(this.excludeIfAll)
        }
        return include;
    }

    /**
     * Exports (converts) the given `ResourcePack` to the expected format
     * @param pack the `ResourcePack` to export
     */
    abstract export(pack : ResourcePack) : T|Promise<T>;
}

export interface Parser<T> {
    parse: (file : T, baseDir : string) => ResourcePack|Promise<ResourcePack>
}