import { type Bundle } from './bundle';
import { ImportOptions } from './io';

interface BundleMap {
    [bundleName : string] : Bundle
}

export interface CartridgeSummary {
    bundleCount: number, 
    resourceCount: number,
    locales: string[]
}

/**
 * A `Cartrdige` represents a single SFCC cartridge, which may include
 * zero or more resource bundles
 */
export class Cartridge {
    
    readonly name : string;
    readonly path !: string;
    
    private bundles : BundleMap = {};

    constructor(name : string, path ?: string) {
        this.name = name;
        if(path) {
            this.path = path;
        }
    }

    public getBundles() : Bundle[] {
        return Object.values(this.bundles);
    }

    public getBundle(name : string) : Bundle|undefined {
        return this.bundles[name];
    }

    public addBundle(bundle : Bundle) : void {
        this.bundles[bundle.name] = bundle
    }

    public save(options: ImportOptions) {
        for(const bundleName in this.bundles) {
            this.bundles[bundleName].save(this.path, options);
        }
    }

    public getSummary() {
        var summaryObj : CartridgeSummary = { 
            bundleCount: 0, 
            resourceCount: 0,
            locales: [] 
        };

        return Object.values(this.bundles).reduce((acc, bundle) => {
            
            acc.bundleCount++;
            acc.resourceCount += bundle.getEntryCount();
            
            bundle.getLocales().forEach(locale => {
                if(acc.locales.indexOf(locale) < 0) {
                    acc.locales.push(locale);
                }
            })

            return acc;
        }, summaryObj);
    }
}