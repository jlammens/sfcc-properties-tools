# SFCC Properties Tools #

A small toolset specifically designed for working with  `.properties` files in Salesforce Commerce Cloud B2C projects.

> [!WARNING]
> This project is still very much Work In Progress !

## Features ##

* Export/import properties bundles to/from a more human-readable format to streamline translation phases
* more to come 🙂

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
Install via NPM :
```
npm install sfcc-properties-tools
```
You can also install globally to have the `sfcc-props` command available in your path :
```
npm install -g sfcc-properties-tools
```

## Commands ##
`sfcc-properties-tools` will most often be used in CLI mode via the `sfcc-props` command (although a Javascript API is also available).

> [!TIP]
> You can run `sfcc-props --help` (or simply `sfcc-props`) to view the list of available subcommands and options. You can also use `sfcc-props <subcommand> --help` for help on a specific subcommand.

### Export ###

To be completed

### Import ###

To be completed

## Javascript API ##

In addition to the CLI, `sfcc-properties-tools` is usable as a NodeJS library that you can include in your own projects to build onto.
The main export is a `ResourcePack` class which exposes all the required methods to interact with properties bundles the same way you would with the CLI, with additional capabilities.
The module provides type definitions and is fully documented, so check your IDE for a detailed list of method and options.

### Example ###
```javascript
import { ResourcePack } from 'sfcc-properties-tools';

// packs all .properties files found in the current folder hierarchy
var pack = await ResourcePack.fromCartridges();
```

### Events ###
You can attach event listeners to the `ResourcePack` class, to be notified of progress and/or errors encountered during a process. 

To be completed

## ToDo List ##
- support more file formats (JSON, XLSX, XLIFF...)
- additional commands
- tests

## Credits ##

At the core of this project is a slightly modified version of the awesome [properties-file](https://github.com/Avansai/properties-file) package (Copyright (c) 2022 Avansai). 