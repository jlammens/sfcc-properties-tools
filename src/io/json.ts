import { ExportOptions, Exporter, type Parser } from "./common";
import { ResourcePack } from "../resource-pack";

export type JsonExportOptions = ExportOptions;

/**
 * A `JsonExporter` provides methods to export the content of a resource pack into a 
 * single JSON file.
 */
export class JsonExporter extends Exporter<Object> {
    
    public export(pack: ResourcePack) : Object {

        const obj : { [cartridgeName: string] : { [bundleName : string] : { [key : string] : { [locale:  string] : string } } }} = {};

        pack.getCartridges().forEach(cartridge => {
            cartridge.getBundles().forEach(bundle => {
                bundle.getEntries()
                //.filter(this.shouldInclude)
                .forEach(entry => {
                    if(this.shouldInclude(entry)) {
                        obj[cartridge.name] = obj[cartridge.name] || {};
                        obj[cartridge.name][bundle.name] = obj[cartridge.name][bundle.name] || {};
                        obj[cartridge.name][bundle.name][entry.key] = {}
                        entry.getLocales().forEach(locale => {
                            let text = entry.getTranslation(locale);
                            if(text != null) {
                                obj[cartridge.name][bundle.name][entry.key][locale] = text;
                            }
                        })
                    }
                })
            })
        })

        return obj;
    }

}

/**
 * A `JsonParser` provides methods to read and convert the content of 
 * a JSON file into the equivalent `ResourcePack` object
 */
export class JsonParser implements Parser<Object> {
    public parse(file: Object, baseDir: string) : ResourcePack | Promise<ResourcePack> {
        // TODO
        return new ResourcePack();
    };
    
}