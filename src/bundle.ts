// represents a single bundle, i.e. the aggregated content of all properties files of a given scope

import path from "path";
import fs from "fs/promises";
import { BundleEntry } from "./bundle-entry";
import { type Property } from "./properties/property";
import { PropertiesEditor } from "./properties/editor";
import type { ImportOptions } from "./io";
import { SharedEmitter } from "./emitter";


interface ResourceMap {
    [key : string] : BundleEntry
}

/**
 * A `Bundle` represents a single resource bundle within a given cartridge,
 * i.e. all the resource keys related to a specific part of the application 
 * and their respective translations. 
 */
export class Bundle {

    private emitter = SharedEmitter.getInstance();

    readonly name : string;
    private locales : string[] = [];
    private entries : ResourceMap = {};
    
    constructor(name : string, locale ?: string, resources ?: Property[]) {
        this.name = name;
        if(locale && resources) {
            this.addTranslations(locale, resources);
        }
    }

    public addTranslations(locale : string, resources : Property[]) : void {
        
        this.registerLocales([locale]);

        resources.forEach(resource => {
            var entry = this.entries[resource.key];
            if(!entry) {
                entry = new BundleEntry(resource.key, locale, resource);
            } else {
                entry.registerProperty(locale, resource);
            }
            this.entries[resource.key] = entry;
        })
    }

    public queueEntry(entry : BundleEntry) {
        this.registerLocales(entry.getLocales());
        this.entries[entry.key] = entry;
    }

    private registerLocales(locales : string[]) {
        this.locales = [...new Set([...this.locales, ...locales])]
    }

    public getLocales() : string[] {
        return this.locales;
    }

    public getEntries() : BundleEntry[] {
        return Object.values(this.entries);
    }

    public async save(directory : string, options : ImportOptions) {

        for(const locale of this.locales) {
            // construct file path
            // open read/write buffer
            // create PropertiesEditor
            // iterate over entries, extract value for the current locale and upsert
            // save and close

            const fileName = this.name + (locale != 'default' ? '_' + locale : '') + '.properties'
            const fullPath = path.join(directory, 'templates', 'resources', fileName)

            this.emitter.emit('import:beforeFile', { path : fullPath });

            const buffer = await fs.readFile(fullPath, { flag: 'a+' })    // 'a+' flag -> read access and creates the file if not exists
            const editor = new PropertiesEditor(buffer.toString());

            let changes = 0;
            for(const key in this.entries) {
                let text = this.entries[key].getTranslation(locale, '');
                if(text.length > 0 || !options.ignoreIfEmpty) {
                    editor.upsert(key, text, { escapeSpecial: false });  // TODO rework escape rules in properties submodule so we don't need the option (or let consumer choose)
                    changes++;
                }
            }

            fs.writeFile(fullPath, editor.format().trim());

            this.emitter.emit('import:afterFile', { path : fullPath, upsertCount: changes });
        }
    }

    public getEntryCount() : number {
        return this.getEntries().length;
    }
}