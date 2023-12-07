# SFCC Properties Tools #

A small toolset specifically designed for working with  `.properties` files in Salesforce Commerce Cloud B2C projects.

> [!WARNING]
> This project is still very musch Work In Progress !

## Features ##

* Export/import properties bundles to/from a human-readable format to streamline translation phases
* more to come :-)

## Installation ##

> [!WARNING]
> npm module not available yet: if you wish to use, clone the repo and run `npm run build`, then `npm link` to register it

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
The module provides type definitions and is fully documented so you should find all relevant information 

### Events ###
You can attach event listeners to the `ResourcePack` class, to be notified of progress and/or errors encountered during 

## Credits ##

At the core of this project is a slightly modified version of [properties-file](https://github.com/Avansai/properties-file) (Copyright (c) 2022 Avansai). 