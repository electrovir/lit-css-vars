import {check} from '@augment-vir/assert';
import {
    addPrefix,
    combineErrorMessages,
    mapObjectValues,
    stringify,
    type Values,
} from '@augment-vir/common';
import {css, CSSResult, unsafeCSS} from 'lit';
import {cssPropertyRegistry} from './css-property-registry.js';
import {setCssVarValue} from './setters-and-getters.js';
import {CssVarSyntaxName, type CssVarSyntax} from './syntax.js';

/**
 * Lower, kebab case requirement for CSS var names.
 *
 * @category Internal
 */
export type CssVarName = `${Lowercase<string>}-${Lowercase<string>}`;

/**
 * The possible values for defining a CSS var's default value.
 *
 * @category Internal
 */
export type CssVarValueInit = string | number | CSSResult;

/**
 * A native CSS property definition.
 *
 * @category Internal
 */
export type CssPropertyDefinition = {
    /** The syntax allowed for this CSS var. This must be set for the var to be animatable. */
    syntax?: CssVarSyntax;
    /**
     * The initial value of this CSS var when it hasn't been applied. This is only used when calling
     * `CSS.registerProperty`. The CSS engine requires this to be computationally independent (it
     * cannot use other CSS vars in its value).
     *
     * If this is not supplied, `default` is used.
     */
    initialValue?: CssVarValueInit;
    /**
     * The fallback for when this CSS var is with `myCssVars['var-name'].value` to interpolate into
     * CSS with `var()`. This can use other CSS vars in calculations.
     */
    default: CssVarValueInit;
};

/**
 * Base type for defineCssVars's input.
 *
 * @category Internal
 */
export type CssVarsSetup = Readonly<Record<CssVarName, CssVarValueInit | CssPropertyDefinition>>;

/**
 * A single CSS var definition.
 *
 * @category Internal
 */
export type SingleCssVarDefinition = {
    name: CSSResult;
    value: CSSResult;
    syntax: string;
    default: string;
};

/**
 * Output for defineCssVars.
 *
 * @category Internal
 */
export type CssVarDefinitions<SpecificSetup extends CssVarsSetup> = {
    [KeyName in keyof SpecificSetup]: SingleCssVarDefinition;
};

/**
 * Creates an easy-to-use-in-lit mapping of the given CSS Var names and defaults. The input
 * determines the CSS var names and their default values. The output is a mapping of the CSS var
 * names to name and value objects that can be easily interpolated into lit's css keyed template
 * strings.
 *
 * @category Main
 * @example
 *
 * ```ts
 * import {defineCssVars} from 'lit-css-vars';
 *
 * // creates a CSS var with name 'my-var' and default value of 50px.
 * const myVars = defineCssVars({'my-var': '50px'});
 * // using the CSS var name: this will be '--my-var'
 * myVars['my-var'].name;
 * // accessing the CSS var value for CSS; this will be: 'var(--my-var, 50px)'
 * myVars['my-var'].value;
 * ```
 */
export function defineCssVars<const SpecificVars extends CssVarsSetup>(
    /**
     * The CSS var setup input. Keys of this input object become the CSS var names. Values of this
     * input become the default value of the CSS vars.
     */
    setup: SpecificVars | CssVarDefinitions<SpecificVars>,
): CssVarDefinitions<SpecificVars> {
    const cssVarDefinitions: CssVarDefinitions<CssVarsSetup> = mapObjectValues(
        setup,
        (key, rawInputValue): Values<CssVarDefinitions<any>> => {
            assertValidCssVarName(key);
            const value = rawInputValue as Values<CssVarsSetup>;

            const isCssPropertyDefinition = check.isObject(value) && !(value instanceof CSSResult);

            const defaultValue: string =
                check.isString(value) || check.isNumber(value) || value instanceof CSSResult
                    ? String(value)
                    : String(value.default);
            const initialValue: string =
                check.isString(value) || check.isNumber(value) || value instanceof CSSResult
                    ? String(value)
                    : String(value.initialValue || value.default);

            const cssVarNameCssResult = unsafeCSS(
                addPrefix({
                    value: key.replace(/^-+/, ''),
                    prefix: '--',
                }),
            );

            const finalDefinition: SingleCssVarDefinition = {
                name: cssVarNameCssResult,
                value: css`var(${cssVarNameCssResult}, ${unsafeCSS(defaultValue)})`,
                syntax:
                    check.isString(value) || check.isNumber(value) || value instanceof CSSResult
                        ? CssVarSyntaxName.Any
                        : createSyntaxString(value.syntax),
                default: defaultValue,
            };

            const cssPropertyName = String(finalDefinition.name);

            if (!initialValue) {
                throw new Error(`Initial value for CSS var ${cssPropertyName} cannot be empty.`);
            }

            if (
                isCssPropertyDefinition &&
                cssPropertyRegistry.registerProperty({
                    inherits: true,
                    name: cssPropertyName,
                    initialValue,
                    syntax: finalDefinition.syntax,
                })
            ) {
                const documentElement = (
                    globalThis.document as typeof globalThis.document | undefined
                )?.documentElement;

                if (documentElement) {
                    setCssVarValue({
                        forCssVar: finalDefinition,
                        onElement: globalThis.document.documentElement,
                        toValue: defaultValue,
                    });
                }
            }

            return finalDefinition;
        },
    );

    return cssVarDefinitions as any;
}

/**
 * Asserts that the given string can be a valid CSS var name (excluding the `--` prefix).
 *
 * @category Internal
 */
export function assertValidCssVarName(value: unknown): asserts value is string {
    try {
        if (!check.isString(value)) {
            throw new TypeError('Must be string.');
        } else if (!value.includes('-')) {
            throw new Error('Must have at least one dash (-).');
        } else if (value.toLowerCase() !== value) {
            throw new Error('Must be lowercase.');
        }
    } catch (error) {
        throw new Error(
            combineErrorMessages('Invalid CSS var name.', error, `Got '${stringify(value)}'`),
        );
    }
}

/**
 * Create a CSS engine compatible syntax string.
 *
 * @category Internal
 */
export function createSyntaxString(syntax: CssVarSyntax | undefined): string {
    if (!syntax) {
        return CssVarSyntaxName.Any;
    } else if (check.isString(syntax)) {
        return syntax;
    } else if (syntax.union) {
        return syntax.union.map((innerSyntax) => createSyntaxString(innerSyntax)).join(' | ');
    } else if (syntax.list) {
        return `${createSyntaxString(syntax.list.values)}${syntax.list.separator}`;
    } else {
        return syntax.raw;
    }
}
