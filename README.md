# SFCC Properties Tools #

A small toolset specifically designed for working with  `.properties` files in Salesforce Commerce Cloud B2C projects.

> [!WARNING]
> This project is still very much Work In Progress !

## Features ##

* Export/import properties bundles to/from a more human-readable format to streamline translation phases
* more to come :-)

## Supported file formats for Import and Export ##

### CSV ###
The "CSV pack" format is a s Zip archive with the following structure :
```javascript
// filename.zip
- filename/
    - cartridge1/
        - bundleA.csv
        - bundleB.csv
        - ...
    - cartridge2/
        - bundleA.csv
        - bundleC.csv
        - ...
    - .../
```
Each CSV file inside the archive is named after the corresponding bundle, and contains all the translations for one or more resource keys inside the cartridge/bundle combination :

```javascript
// checkout.csv
Resource key;default;fr_FR;ja_JP
action.customer.login;"Sign in";;
action.shipping.form;"Shipping";"Livraison";"配送"
action.have.gift.certificate;"Have a Gift Certificate?";"Vous avez un chèque-cadeau ?";"ギフト券をおもちですか?"
action.edit.step;"Edit";"Modifier";"編集"
```


## Installation ##

> [!WARNING]
> npm module not available yet: if you wish to use, clone the repo and execute `npm run build`, then `npm link` to add it to your NPM registry

Install globally via `npm` to use the CLI via the `sfcc-props` command
```
npm install -g sfcc-properties-tools
```

In addition to the CLI, `sfcc-properties-tools` is also usable as a NodeJS library that you can include in your own projects
```
npm install --save sfcc-properties-tools
```

## Commands ##

> [!TIP]
> If you use the CLI, you can run `sfcc-props --help` (or simply `sfcc-props`) to view the list of available commands and options. You can also use `sfcc-props <command> --help` for help on a specific command.

### Export ###


### Import ###

## Javascript API ##

In addition to the CLI, `sfcc-properties-tools` is also usable as a NodeJS library. The main export is a `ResourcePack` class which exposes all the required methods to interact with properties bundles the same way you would with the CLI.
The module provides type definitions and is fully documented, so check your IDE for a detailed list of method and options.

```javascript
import { ResourcePack } from 'sfcc-properties-tools'
```

### Events ###
You can attach event listeners to the `ResourcePack` class (or instance thereof, depending on your need), to be notified of progress and/or errors encountered during a process. 


#### Pack events ####

```javascript
// when the .properties files to pack have been resolved
ResourcePack.on('pack.start', ({ fileCount }) => {
    // fileCount : the total number of .properties files which have been selected for packing
});

// before a .properties files is parsed and added to the pack
ResourcePack.on('pack.beforeFile', ({ filePath, cartridge, bundle, locale, fileIndex }) => {
    // filePath : the path of the properties file on the file system
    // cartridge: the name of the cartridge the file belong to
    // bundle : the name of the bundle the file is part of
    // locale: the locale provided by the file
    // fileIndex : the index of the file within the pack
});

// after a .properties file is added to the pack
ResourcePack.on('pack.afterFile', ({ filePath, cartridge, bundle, locale, fileIndex, propertiesCount }) => {
    // filePath : the path of the properties file on the file system
    // cartridge: the name of the cartridge the file belongs to
    // bundle : the name of the bundle the file is part of
    // locale: the locale provided by the file
    // fileIndex : the index of the file within the pack
    // propertiesCount: the number of resources added to the pack
});

// when the packing process is finished
ResourcePack.on('pack.complete', () => {});
```

#### Export events ####
```javascript
// when the conversion process to the target file format starts
ResourcePack.on('export.start', () => {});

// when the conversion process is finished
ResourcePack.on('export:complete', () => {});
```

#### Unpack events ####

```javascript
// when the unpacking process starts
ResourcePack.on('unpack.start', () => {});

// when an invalid entry is found in the pack
// e.g. when a zip archive does not have the expected structure
ResourcePack.on('unpack:invalidEntry', ({ entry }) => {
    // entry : the full name of the entry
});

// when the pack contains a cartridge name which does not exist in the working directory
ResourcePack.on('unpack:unknownCartridge', ({ cartridge, directory }) => {
    // cartridge : the name of the cartridge
    // directory : the path of the working directory on the file system
});

// when more than one cartridge with a given name are found in the working directory
ResourcePack.on('unpack:ambiguousCartridge', ({ cartridge, directory, matches }) => {
    // cartridge : the name of the cartridge
    // directory : the path of the working directory on the file system
    // matches : an array of matching cartridge paths on the file syetem
});

// before a packed entry is parsed
ResourcePack.on('unpack:beforeParseEntry', ({ entry, cartridge, bundle }) => {
    // entry : the full name of the entry
    // cartridge : the cartridge this entry belongs to
    // bundle : the bundle this entry represents
});

// after a packed entry has been parsed
ResourcePack.on('unpack:afterParseEntry', ({ entry, cartridge, bundle, resourceCount }) => {
    // entry : the full name of the entry
    // cartridge : the cartridge this entry belongs to
    // bundle : the bundle this entry represents
    // resourceCount : the number of individual resources found in the entry
});

// when an invalid locale is found in an entry
ResourcePack.on('unpack:invalidLocale', ({ locale, entry }) => {
    // locale : the invalid locale
    // entry : the full name of the entry where the locale was found
});

// when the unpacking process is finished
ResourcePack.on('unpack.complete', () => {});
```

#### Import events ####
```javascript

```

## TODO ##
- support more file formats (JSON, XLSX, XLIFF...)
- additional commands
- tests

## Credits ##

At the core of this project is a slightly modified version of the awesome [properties-file](https://github.com/Avansai/properties-file) package (Copyright (c) 2022 Avansai). 