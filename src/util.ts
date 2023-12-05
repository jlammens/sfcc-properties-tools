import { EventEmitter } from 'stream';
import { type Property } from './properties/property';

export const restoreLineBreaks = function(property : Property, eolChar : string) : string {
    if(property.newlinePositions && property.newlinePositions.length > 0
            && property.separatorPosition && property.separatorLength) {

        var chunks = []
        var previousIndex = property.separatorPosition + property.separatorLength
        
        property.newlinePositions.forEach(position => {
            chunks.push(property.linesContent.slice(previousIndex, position))
            previousIndex = position
        })
        chunks.push(property.linesContent.slice(previousIndex))
        return chunks.join(eolChar)
    }
    return property.value
}

/**
 * Detremines whether the given `locale` is a valid value for SFCC
 * @param locale the locale to assess
 * @returns true if `locale` is a valid value for SFCC
 */
export const isValidLocale = function(locale : string) {
    return locale && /^default|[a-z]{2}(?:_[A-Z]{2})?$/.test(locale)
}
