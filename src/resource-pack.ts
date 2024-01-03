import { EventEmitter } from 'events';
import { readFileSync } from 'fs';

import glob from 'fast-glob';
import Zip from 'adm-zip';

import { Bundle } from './bundle';
import { Cartridge, type CartridgeSummary } from './cartridge';
import { Properties } from './properties'
import { type Property } from './properties/property';
import { type CSVExportOptions, type CSVImportOptions, type ImportOptions, CsvExporter, CsvParser, JsonExporter, ExportOptions, JsonExportOptions } from './io';
import { SharedEmitter } from './emitter';

interface CartridgeMap {
    [cartridgeName : string] : Cartridge,
}

interface CartridgeSumaryMap {
    [cartridgeName : string] : CartridgeSummary,
}

interface PackSummary {
    cartridges : number,
    bundles : number,
    locales : string[],
    resources : number, 
    details : CartridgeSumaryMap
}

const PROPERTIES_FILE_PATTERN = /.+\/(.+)\/cartridge\/templates\/resources\/([^.]+?)(?:_([a-z]{2}(?:_[A-Z]{2})?))?.properties/;

/**
 * A class representing all the resource bundles within a given set of cartridges.
 * This is also the main entry point into this library
 */
export class ResourcePack {

    private cartridges : CartridgeMap = {};

    private emitter = SharedEmitter.getInstance();

    /**
     * creates a new resource pack, optionally  based on provided file(s)
     * @param filePaths the path to a `.properties` file, or an array thereof. If no 
     * path is provided,an empty pack is returned
     */
    constructor(filePaths ?: string|string[]) {
        
        if(filePaths) {

            if (!Array.isArray(filePaths)) filePaths = [filePaths];

            this.emitter.emit('pack:start', { fileCount : filePaths.length });

            filePaths.forEach((filePath, index) => {

                const parts = filePath.match(PROPERTIES_FILE_PATTERN);
                const cartridge = parts ? parts[1] : '';
                const bundle = parts ? parts[2] : '';
                const locale = parts ? parts[3] || 'default' : '';

                this.emitter.emit('pack:beforeFile', { filePath, cartridge, bundle, locale, fileIndex : index });

                const properties = new Properties(readFileSync(filePath))

                this.addProperties(cartridge, bundle, locale, properties.collection);

                this.emitter.emit('pack:afterFile', { filePath, cartridge, bundle, locale, fileIndex : index, propertiesCount: properties.collection.length });
            })

            this.emitter.emit('pack:complete');
        }
    }

    /**
     * Initializes a new `ResourcePack` from all `.properties` files found in the given folder(s)
     * @param paths a path (either absolute or relative, or a glob pattern), or a list thereof. 
     * @returns a promise that resolves with a `ResourcePack` of all the `.properties`
     */
    static async fromCartridges(paths ?: string|string[]): Promise<ResourcePack> {
        if(!paths) {
            paths = [process.cwd()];
        } else if (!Array.isArray(paths)) {
            paths = [paths];
        }

        var propFiles = await glob(
            paths.map(path => path + '/**/templates/resources/*.properties'), 
            { objectMode: true }
        );
        
        return new ResourcePack(propFiles.map(entry => entry.path));
    }

    /**
     * Initializes a new `ResourcePack` from a pack of structure-compliant CSV files
     * @param path 
     * @param options 
     */
    static async fromCsvPack(path: string, options: CSVImportOptions) : Promise<ResourcePack> {
        
        const emitter = SharedEmitter.getInstance();

        emitter.emit('unpack:start');

        const archive = new Zip(path);

        var parser = new CsvParser(options);
        
        var pack = await parser.parse(archive);
    
        emitter.emit('unpack:complete');

        return pack;
    }

    /* TODO 
    static async fromJson(path : string, options : any) : Promise<ResourcePack> {
        
        const emitter = SharedEmitter.getInstance();

        emitter.emit('unpack:start');

        var content = require(path);

        var parser = new JsonParser(options);
        
        var pack = await parser.parse(content);
    
        emitter.emit('unpack:complete');

        return pack;
    }
    */

    /**
     * Registers a new event listener. This gives access to any event emitted during the 
     * import/export process by any of the other objects in this library
     * @param event the event to listen to
     * @param listener callback function to execute when the event is emitted
     * @returns an instance of {@link EventEmitter}, for chaining
     */
    static on(event : string, listener : (... args: any[]) => void) : EventEmitter {
        return SharedEmitter.getInstance().on(event, listener);
    }

    /**
     * Adds a single `.properties` file to the package
     * @param cartridge the name of the cartridge where the file was found
     * @param bundle the name of the bundle this file belongs to
     * @param locale the locale this file provides translations for
     * @param resources the list of resources inside the file
     */
    public addProperties(cartridgeName: string, bundleName: string, locale: string, resources: Property[]) : void{
        
        var cartridge = this.cartridges[cartridgeName];
        
        if (!cartridge) {
            cartridge = new Cartridge(cartridgeName);
        }
        
        let bundle = cartridge.getBundle(bundleName);
        
        if (!bundle) {
            bundle = new Bundle(bundleName, locale, resources)
            cartridge.addBundle(bundle);
        } else {
            bundle.addTranslations(locale, resources);
        }

        this.cartridges[cartridgeName] = cartridge;
    }

    /**
     * Get the list of cartridges inside this pack
     * @returns array of cartridges
     */
    public getCartridges() : Cartridge[] {
        return Object.values(this.cartridges);
    }

    /**
     * Retrieves the `Cartridge` with the given name from the this pack
     * @param name name of the `Cartridge` to return
     * @returns the corresponding `Cartridge` if it exists
     */
    public getCartridge(name : string) : Cartridge|undefined {
        return this.cartridges[name];
    }

    /**
     * Creates a new empty `Cartridge` with the given `name` and adds it to this resource pack
     * @param name name of the `Cartridge` to create
     * @param path the path to the cartridge folder on the file system
     * @returns the newly created `Cartridge`
     */
    public createCartridge(name : string, path ?: string) : Cartridge {
        var cartridge = new Cartridge(name, path);
        this.cartridges[name] = cartridge;
        return cartridge;
    }

    /**
     * Returns aggregated summary of the resource pack
     * @returns an object with both global and per-cartridge stats
     */
    public getSummary() : PackSummary {

        var statsObj : PackSummary = { 
            cartridges: 0,
            bundles: 0,
            locales: [],
            resources: 0,
            details: {}
         }

        return Object.values(this.cartridges)
            .reduce((acc, cartridge) => {
                var cartridgeSummary = cartridge.getSummary();
                acc.cartridges++;
                acc.details[cartridge.name] = cartridgeSummary;
                acc.bundles += cartridgeSummary.bundleCount;
                acc.resources += cartridgeSummary.resourceCount;

                cartridgeSummary.locales.forEach(locale => {
                    if(acc.locales.indexOf(locale) < 0) {
                        acc.locales.push(locale);
                    }
                })

                return acc;
            }, statsObj)
    }

    /**
     * Saves the current resource pack to the corresponding `.properties` file(s), creating them if needed
     * @param options options for saving (allow empty, etc.)
     */
    public save(options : ImportOptions) {
        for(const cartridgeName in this.cartridges) {
            this.emitter.emit('import:beforeCartridge', { cartridge: cartridgeName })

            this.cartridges[cartridgeName].save(options);

            this.emitter.emit('import:afterCartridge', { cartridge: cartridgeName })
        }
    }


    /**
     * Exports the current resource pack as a Zip archive with one or more CSV files
     * @param options 
     * @returns 
     */
    public toCsvPack(options : CSVExportOptions) : Zip {
        
        this.emitter.emit('export:start');

        var result = new CsvExporter(options).export(this);

        this.emitter.emit('export:complete');

        return result;
    }

    public toJson(options : JsonExportOptions) : Object {

        this.emitter.emit('export:start');

        var result = new JsonExporter(options).export(this);

        this.emitter.emit('export:complete', { resources : this.getSummary().resources });

        return result;
    }
}