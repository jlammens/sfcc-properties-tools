import { StdioNull } from "child_process";
import { Property } from "./properties/property";

interface Resource {
    raw ?: Property,
    text: string
}

interface ResourceDict {
    [locale: string] : Resource
}

/**
 * A `BundleEntry` represents a single resource key and all its translations
 */
export class BundleEntry {
    
    readonly key : string;
    private dict : ResourceDict = {}

    constructor(key : string, locale ?: string, property ?: Property) {
        this.key = key;
        if(locale && property) {
            this.registerProperty(locale, property);
        }
    }

    public registerProperty(locale : string, property : Property) {
        this.dict[locale] = {
            raw: property,
            text: property.value
        };
    }

    public queueTranslation(locale : string, text : string) {
        this.dict[locale] = { text };
    }

    public getLocales() : string[] {
        return Object.keys(this.dict);
    }

    public hasAllLocales(locales : string[]) : boolean {
        return locales.every(locale => locale in this.dict);
    }

    public getTranslation<B>(locale : string): string | null
    public getTranslation<B>(locale : string, defaultValue: B): string | B
    public getTranslation<B extends string>(locale : string, defaultValue ?: B) {
        if (locale in this.dict) {
            return this.dict[locale].text; // TODO handle line breaks in value / escaping
        }
        return defaultValue || null;
    }
}