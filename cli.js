#! /usr/bin/env node


const { EOL } = require('os')

const { Command, Argument } = require('commander');
const Spinnies = require('spinnies');
const chalk = require('chalk')

const pkg = require('./package.json');

const program = new Command();
const spinners = new Spinnies();

/*
 * Recommandation for use : 
 $ 1. create a new "translation" branch from the development branch head
 * 2. run the export from this branch
 * 3. work normally while texts are being translated, switching branches as needed
 * 4. when the translations are ready, switch back to the "translation" branch
 * 5. import the file
 * 6. commit (and possibly push) changes
 * 7. compare the "translation" and development branches to identify possible conflicts : these are 
 * labels which have been changed in the project files directly since the export
 * 
 * Instead of 6-7 you can also try to merge the development branch into the "translation" branch and check for conflicts
 */

program
    .description(pkg.description)
    .version(pkg.version);

/*
TODO other useful commands :

ensure <locale> --from <locales...> : ensure all resource keys exist in the given locale, using values 
from the given locale(s) as needed. This is especially useful in heterogenous team where developers do 
not share the same coding practice

audit --ignore <bundles...> : look for missing translations, i.e. resource keys used in the codebase without 
any correspondance in properties files ("ignore" option is useful when Resource Manager is used). Also looks for 
properties which are not found in the code (Note : will yield false positives if resource keys are built dynamically)

*/

program.command('export')
    .summary('Exports resource bundles from one or more cartridges into one or more tabular files')
    .description('Extracts all the resource bundles from the given cartridge(s) into a zipped package of one or more CSV file(s). Each CSV file \
corresponds to a single cartridge/bundle combination, with one resource per line and a dedicated column for each existing locale translation.')
    .addArgument(new Argument('[format]', 'The target file format.').choices(['csv']).default('csv'))
    .argument('[cartridges...]', 'The cartridge(s) to extract resources from. Supports both explicit paths and glob patterns.', './**/cartridge')
    .option('-o, --outfile <filename>', 'name of the resulting package, without extension (defaults to a system-generated unique name)')
    .option('-s, --separator <character>', 'separator character for the CSV fields', ';')
    .option('-q, --quotation <character>', 'character used to enclose special strings, i.e. strings which contains the field separator or a line break', '"')
    .option('-e, --escape <character>', 'character used to escape the quotation character when it is found inside a string', '"')
    .option('-l, --eol <character>', 'character(s) used for end of lines in the resulting CSV files', EOL)
    .option('--if-not <locales...>', 'only extract resource keys which have an empty value for AT LEAST ONE of the given locale(s)', asArray, [])
    .action(async (cartridges, options) => {

        var filename = options.outfile || 'properties_' + Date.now();

        let { ResourcePack } = require('./lib/resource-pack.js');   
        
        ResourcePack.on('pack:start', () => { 
            spinners.add('packStart', {
                text: 'Extraction...',
                succeedColor: 'white'
            })
        }).on('pack:beforeFile', ({ filePath, cartridge, bundle, locale }) => { 
            spinners.add(filePath, {
                text: 'Extracting resources from ' + chalk.blue(cartridge + ' > ' + bundle + ' [' + locale + ']'),
                succeedColor: 'white',
                indent: 2
            })
        }).on('pack:afterFile', ({ filePath }) => { 
            spinners.succeed(filePath)
        }).on('pack:complete', () => { 
            spinners.succeed('packStart')
        });

        var pack = await ResourcePack.fromCartridges(cartridges);
        
        var result = pack.toCsvPack({
            outFile: filename,
            fieldSeparator: options.separator,
            escapeCharacter: options.escape,
            quoteCharacter: options.quotation,
            eolCharacter: options.eol,
            ifNotLocales: options.ifNot
        })
        
        result.writeZip(filename + '.zip');
    });

program.command('import')
    .summary('Creates and/or updates `.properties` files in bulk from a given package')
    .description('Merges translations from the given package file into the corresponding `.properties` files. The package must comply with the expected structure')
    .argument('<file>', 'The file to import')
    .option('-b, --base-dir <path>', 'The root directory where the cartridges to update are located', '.')
    .option('-s, --separator <character>', 'separator character for the CSV fields', ';')
    .option('-q, --quotation <character>', 'character used to enclose special strings, i.e. strings which contains the field separator or a line break', '"')
    .option('-e, --escape <character>', 'character used to escape the quotation character when it is found inside a string', '"')
    .option('-l, --eol <character>', 'character(s) used for end of lines in the resulting CSV files', EOL)
    .option('--encoding <value>', 'The encoding of the file(s) inside the package', 'utf8')
    .option('--ignore-empty', 'Whether a resource with an empty translation in the imported package should be ignored or not', true)
    // TODO options to add : preserve CSV line breaks position in .properties files (purely cosmetic)
    .action(async (filePath, options) => {

        let { ResourcePack } = require('./lib/resource-pack.js');   


        ['unpack:start', 'unpack:complete', 'csv:invalidEntry', 'csv:unknownCartridge', 'csv:ambiguousCartridge', 
        'csv:beforeParseEntry', 'csv:afterParseEntry', 'csv:invalidLocale', 'import:beforeCartridge', 'import:beforeFile',
        'import:afterCartridge', 'import:afterFile'].forEach(event => {
            ResourcePack.on(event, (data) => { 
                console.log(event, data);
            });
        })
        
        var pack = await ResourcePack.fromCsvPack(filePath, {
            fieldSeparator: options.separator, 
            quoteCharacter: options.quotation,
            escapeCharacter: options.escape,
            eolCharacter: options.eol,
            encoding: options.encoding,
            baseDirectory: options.baseDir
        });
        
        console.log(pack.getSummary());

        pack.save({
            ignoreIfEmpty: options.ignoreEmpty
        })
    })

program.parseAsync(process.argv);

function asArray(value, previous) {
    return previous.concat([value]);
}