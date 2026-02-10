import {addPrefix, getObjectTypedEntries} from '@augment-vir/common';
import {type CssVarName, type SingleCssVarDefinition} from './define-css-vars.js';

/**
 * Set the given CSS var to the given value on the given element. Allows numeric values but converts
 * them to strings (since the style.setProperty API only allows strings).
 *
 * @category Main
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
 *
 * Note: this is a slow operation. Do not run this for many CSS vars at once. Instead, prefer
 * {@link applyCssVarsViaStyleElement} for bulk CSS var setting.
 *
 * @category Main
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
 * Create the global `<style>` element used by {@link applyCssVarsViaStyleElement} to set many CSS
 * var values at once.
 *
 * @category Internal
 */
export function createCssVarStyleElement(
    /** The id for the `<style>` element. This should, ideally, be a kebab-case string. */
    styleKey: string,
    /**
     * Customize where the `<style>` element is attached.
     *
     * @default document.head
     */
    context: Element = document.head,
): HTMLStyleElement {
    if (styleKey.match(/\s/)) {
        throw new Error(`Cannot use a style key with white space in it: '${styleKey}'`);
    }

    const existingElement = context.querySelector(`style#${styleKey}`);

    if (existingElement instanceof HTMLStyleElement) {
        return existingElement;
    } else {
        const newStyleElement = globalThis.document.createElement('style');
        newStyleElement.id = styleKey;
        context.append(newStyleElement);

        return newStyleElement;
    }
}

/**
 * Efficiently sets many CSS var values via a `<style>` element.
 *
 * @category Main
 * @returns The created or existing `<style>` element in case you wish to reuse it.
 */
export function applyCssVarsViaStyleElement(
    /**
     * The CSS Var values to apply. The keys of this object are the CSS Var names and they will be
     * set to the given values. `undefined` values will not be omitted (not set). The keys may
     * include or omit the CSS required `'--'` prefix.
     */
    cssVarValues: Record<CssVarName, string | number | undefined>,
    /** The id for the `<style>` element. This should, ideally, be a kebab-case string. */
    styleKey: string,
    /**
     * Customize where the `<style>` element is attached.
     *
     * @default document.head
     */
    context: Element = document.head,
) {
    const styleElement = createCssVarStyleElement(styleKey, context);

    const cssVarDeclarations: string[] = getObjectTypedEntries(cssVarValues).flatMap(
        ([
            cssVarName,
            value,
        ]) => {
            if (value == undefined || value === '') {
                return [];
            }

            const key = addPrefix({value: cssVarName, prefix: '--'});

            return [
                `    ${key}: ${value};`,
            ];
        },
    );

    styleElement.textContent = `:root {\n    ${cssVarDeclarations.join('\n    ')}\n}`;

    return styleElement;
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
 *
 * @category Main
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
