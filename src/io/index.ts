import { EventEmitter } from 'events';
import { ResourcePack } from "../resource-pack"

export interface Exporter<T> {
    export: (pack : ResourcePack) => T|Promise<T>
}

export interface Parser<T> {
    parse: (file : T, baseDir : string) => ResourcePack|Promise<ResourcePack>
}

/* TODO support more import/export formats, such as JSON, XLSX or XLIFF */
export enum FileFormat {
    CSV
}

interface ExportOptions {
    outFile : string,
    ifNotLocales ?: string[]
}

export interface ImportOptions {
    ignoreIfEmpty : boolean
}

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
