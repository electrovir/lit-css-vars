import {check} from '@augment-vir/assert';
import {
    addPrefix,
    combineErrorMessages,
    ensureErrorAndPrependMessage,
    mapObjectValues,
    stringify,
    type Values,
} from '@augment-vir/common';
import {css, CSSResult, unsafeCSS} from 'lit';
import {CssVarSyntaxName, type CssVarSyntax} from './syntax.js';

/**
 * Lower, kebab case requirement for CSS var names.
 *
 * @category Internal
 */
export type CssVarName = `${Lowercase<string>}-${Lowercase<string>}`;

/**
 * A native CSS property definition.
 *
 * @category Internal
 */
export type CssPropertyDefinition = {
    /** The syntax allowed for this CSS var. This must be set for the var to be animatable. */
    syntax?: CssVarSyntax;
    /** The default value of this CSS var. This is also called the initial value. */
    default: string | number | CSSResult;
};

/**
 * Base type for defineCssVars's input.
 *
 * @category Internal
 */
export type CssVarsSetup = Readonly<
    Record<CssVarName, string | number | CssPropertyDefinition | CSSResult>
>;

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
    setup: SpecificVars,
): CssVarDefinitions<SpecificVars> {
    const cssVarDefinitions: CssVarDefinitions<CssVarsSetup> = mapObjectValues(
        setup,
        (key, rawInputValue): Values<CssVarDefinitions<any>> => {
            assertValidCssVarName(key);
            const value = rawInputValue as Values<CssVarsSetup>;

            const defaultValue: string =
                check.isString(value) || check.isNumber(value) || value instanceof CSSResult
                    ? String(value)
                    : String(value.default);

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

            /**
             * This check allows this package to be imported in non-browser contexts without
             * crashing.
             */
            if ('CSS' in globalThis) {
                try {
                    globalThis.CSS.registerProperty({
                        inherits: true,
                        name: String(finalDefinition.name),
                        initialValue: finalDefinition.default,
                        syntax: finalDefinition.syntax,
                    });
                } catch (error) {
                    throw ensureErrorAndPrependMessage(
                        error,
                        `Failed to define CSS var: ${stringify(
                            mapObjectValues(finalDefinition, (key, value) => String(value)),
                            4,
                        )}\n\n`,
                    );
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
