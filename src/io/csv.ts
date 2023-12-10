import { Readable } from 'stream';

import Zip from 'adm-zip';
import { glob } from 'fast-glob';
import parseCSV from 'csv-parser';

import { type ExportOptions, Exporter, type Parser, type ImportOptions } from "./common";
import { ResourcePack } from '../resource-pack';
import { Bundle } from '../bundle';
import { BundleEntry } from '../bundle-entry';
import { isValidLocale } from '../util';
import { SharedEmitter } from '../emitter';

const DEFAULT_KEY_HEADER = 'Resource key';



interface CsvFileOptions {
    fieldSeparator : string,
    escapeCharacter : string,
    quoteCharacter : string,
    eolCharacter : string
}

export type CSVExportOptions = ExportOptions & CsvFileOptions;
export type CSVParseOptions = CsvFileOptions & {
    encoding : BufferEncoding,
    baseDirectory : string
};
export type CSVImportOptions = ImportOptions & CSVParseOptions;

/**
 * A `CsvExporter` provides methods to export the content of a resource pack into a 
 * zipped archive of CSV files. The archive has a folder for each cartridge, and each
 * folder contains one or more CSV files, each representing a single resource bundle.
 * Inside the CSV, each row represents a single resource and each column is a locale
 */
export class CsvExporter extends Exporter<Zip> {

    private filename : string;
    private separator : string;
    private quote : string;
    private escape : string;
    private eol : string;

    /**
     * Instanciates a new `CsvExporter` with the provided options
     * @param options 
     */
    constructor(options : CSVExportOptions) {
        super(options)
        this.filename = options.outFile;
        this.separator = options.fieldSeparator;
        this.quote = options.quoteCharacter;
        this.escape = options.escapeCharacter;
        this.eol = options.eolCharacter;
    }

    /**
     * Exports the given resource pack into a zipped archive of CSV files, using 
     * the options provided to the constructor
     * @param pack the resource pack to export
     * @returns a {@link Zip} object which can be e.g. saved to disk
     */
    export(pack : ResourcePack) : Zip {

        const outFile = new Zip()
    
        pack.getCartridges().forEach(cartridge => {
            cartridge.getBundles().forEach(bundle => {
                if(bundle.getEntryCount() > 0) {
                    
                    const lines = this.toCSVContent(bundle);

                    // we can still receive an empty content depending on filtering options
                    if(lines.length > 0) {
                        const buff = Buffer.from(lines.join(this.eol), "utf8");
                        outFile.addFile(this.filename + '/' + cartridge.name + '/' + bundle.name + '.csv', buff)
                    }
                }
            })
        })

        return outFile;
    }

    /**
     * Converts a single bundle into the equivalent CSV representation
     * @param bundle 
     * @returns 
     */
    private toCSVContent(bundle : Bundle) : string[] {
        
        const lines = bundle.getEntries()
            .filter(entry => this.shouldInclude(entry) )
            .map( entry => this.toCSVLine(entry, bundle.getLocales()) );
       
        if(lines.length > 0) {
            lines.unshift(DEFAULT_KEY_HEADER + this.separator + bundle.getLocales().join(this.separator));
        }

        return lines;
    }

    /**
     * Converts a single bundle entry into its equivalent CSV representation
     * @param entry 
     * @param locales 
     * @returns 
     */
    private toCSVLine(entry : BundleEntry, locales : string[]) : string {

        const labels = locales.map(locale => this.escapeStr(entry.getTranslation(locale, '')) )
        return entry.key + this.separator + labels.join(this.separator);
        
    }

    /**
     * Escapes a string to comply with CSV formatting rules for the current options
     * @param str 
     * @returns 
     */
    private escapeStr(str : string|null) : string|null {

        if(str != null && (str.indexOf(this.separator) > 0 || str.indexOf(this.eol) > 0 || str.indexOf(this.quote))) {
            // first escape the quotation character if found in the string
            str = str.replace(new RegExp(this.quote, 'g'), this.escape + this.quote);
            
            // then enclose the string using specified quotation character
            str = this.quote + str + this.quote;
        }
        return str;
    }
}

/**
 * A `CsvParser` provides methods to extract, read and convert the content of 
 * a CSV package into the equivalent `ResourcePack` object
 */
export class CsvParser implements Parser<Zip> {

    private emitter = SharedEmitter.getInstance();

    private separator : string;
    private quote : string;
    private escape : string;
    private eol : string;
    private encoding : BufferEncoding;
    private baseDir : string;


    /**
     * Instanciates a new `CsvExporter` with the provided options
     * @param options 
     */
    constructor(options : CSVParseOptions) {
        this.separator = options.fieldSeparator;
        this.quote = options.quoteCharacter;
        this.escape = options.escapeCharacter;
        this.eol = options.eolCharacter;
        this.encoding = options.encoding;
        this.baseDir = options.baseDirectory;
    }

    public async parse(archive : Zip) : Promise<ResourcePack> {

        var pack = new ResourcePack();

        let parts, cartridgeName, bundleName;

        const invalidCartridges = []

        for(const zipEntry of archive.getEntries()) {
            
            parts = zipEntry.entryName.match(/.+\/(.+)\/(.+).csv/)
            
            if(parts == null || parts.length !== 3) {
                this.emitter.emit('unpack:invalidEntry', { entry: zipEntry.entryName });
                continue;
            }

            cartridgeName = parts[1].trim();
                
            if(invalidCartridges.indexOf(cartridgeName) >= 0) {
                continue;
            }

            let cartridge = pack.getCartridge(cartridgeName);

            if(!cartridge) {
                // attempt to locate the cartridge on the file system, relative to the baseDir
                var paths = await glob(this.baseDir + '/**/' + cartridgeName + '/cartridge', { onlyFiles: false, objectMode: false })

                if(paths.length == 0) {
                    this.emitter.emit('unpack:unknownCartridge', { cartridge: cartridgeName, directory: this.baseDir });
                    invalidCartridges.push(cartridgeName);
                    continue;
                } else if(paths.length > 1) {
                    // TODO create an option to solve ambiguity, such as a regex that the path must / must not match
                    this.emitter.emit('unpack:ambiguousCartridge', { cartridge: cartridgeName, directory: this.baseDir, matches: paths });
                    invalidCartridges.push(cartridgeName);
                    continue;
                }

                cartridge = pack.createCartridge(cartridgeName, paths[0]);
            }
            
            this.emitter.emit('unpack:beforeParseEntry', { entry: zipEntry.entryName, cartridge: cartridgeName, bundle: bundleName });

            bundleName = parts[2].trim();
            const bundle = await this.toBundle(bundleName, zipEntry.getData(), zipEntry.entryName);
            cartridge.addBundle(bundle);

            this.emitter.emit('unpack:afterParseEntry', { entry: zipEntry.entryName, cartridge: cartridgeName, bundle: bundleName, resourceCount : bundle.getEntryCount() });
        }

        return pack;
    }

    private toBundle(bundleName : string, csvContent : Buffer, entryName : string) : Promise<Bundle> {

        const bundle = new Bundle(bundleName);
        
        const stream = Readable.from(csvContent, { encoding: this.encoding });
        let locales: string[] = [], keyField : string;

        const transformer = parseCSV({ separator : this.separator, quote: this.quote, escape: this.escape });

        return new Promise((resolve, reject) => {
        stream.pipe(transformer)
            .on('headers', headers => {
                locales = [];
                keyField = headers[0];
                headers.slice(1).forEach((headerValue: string) => {
                    if (isValidLocale(headerValue)) {
                        locales.push(headerValue);
                    } else {
                        this.emitter.emit('unpack:invalidLocale', { locale : headerValue, entry: entryName });
                    }
                });
            })
            .on('data', fields => {
                const key = fields[keyField]
                let resource = new BundleEntry(key)
                for(const locale of locales) {
                    resource.queueTranslation(locale, fields[locale] || '')
                }
                bundle.queueEntry(resource);
            })
            .on('end', () => { 
                resolve(bundle);
            }).on('error', error => {
                reject(error);
            });
        })
    }
}

export const adapter = {
    exporter: CsvExporter,
    parser : CsvParser
}