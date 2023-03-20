import {SingleCssVarDefinition} from './define-css-vars';

/**
 * Set the given CSS var to the given value on the given element. Allows numeric values but converts
 * them to strings (since the style.setProperty API only allows strings).
 */
export function setCssVarValue({
    onElement,
    toValue,
    forCssVar,
}: {
    onElement: HTMLElement;
    toValue: string | number;
    forCssVar: SingleCssVarDefinition;
}) {
    onElement.style.setProperty(String(forCssVar.name), String(toValue));
}

/**
 * Set the given property's value to the given CSS var on the given element, using
 * "element.style.setProperty".
 */
export function applyCssVar({
    onElement,
    forProperty,
    toCssVar,
}: {
    onElement: HTMLElement;
    forProperty: string;
    toCssVar: SingleCssVarDefinition;
}) {
    onElement.style.setProperty(forProperty, String(toCssVar.value));
}

/**
 * Read the given CSS var's value on the given element. If "includeCascade" is set to true, the
 * given elements styles are computed to retrieve cascaded CSS var values. If "includeCascade" is
 * false, the CSS var is read directly off the element, which will only read values from the element
 * on which the CSS var was directly set.
 *
 * WARNING: "includeCascade: true" is less performant because it runs "globalThis.getComputedStyle".
 * However, in practice I've yet to actually see this be an issue (unless you're running this in an
 * immediate infinite loop but of course don't do that).
 */
export function readCssVarValue({
    onElement,
    forCssVar,
    includeCascade,
}: {
    onElement: HTMLElement;
    forCssVar: SingleCssVarDefinition;
    includeCascade?: boolean;
}): string {
    const styleRoot = includeCascade ? globalThis.getComputedStyle(onElement) : onElement.style;

    return styleRoot.getPropertyValue(String(forCssVar.name)).trim();
}
