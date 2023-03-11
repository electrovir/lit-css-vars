import {isObject, mapObjectValues, PropertyValueType} from '@augment-vir/common';
import {css, CSSResult, unsafeCSS} from 'lit';

/** Lower, kebab case requirement for CSS var names. */
export type CssVarName = `${Lowercase<string>}-${Lowercase<string>}`;

/** Base type for createCssVars's input. */
export type CssVarsSetup = Readonly<Record<CssVarName, string | number | CSSResult>>;

/** Output for createCssVars. */
export type CssVarDefinitions<SpecificSetup extends CssVarsSetup> = {
    [KeyName in keyof SpecificSetup]: {
        name: CSSResult;
        value: CSSResult;
    };
};

export type CssVarNamesTooGenericError =
    "Error: input CSS var names are too generic. See 'lit-css-vars' package documentation for details.";
export type CssVarNamesInvalidError = 'Error: all CSS var names must be lower-kebab-case.';

/**
 * Creates an easy-to-use-in-lit mapping of the given CSS Var names and defaults. The input
 * determines the CSS var names and their default values. The output is a mapping of the CSS var
 * names to name and value objects that can be easily interpolated into lit's css keyed template
 * strings.
 *
 * @example
 *     // creates a CSS var with name 'my-var' and default value of 50px.
 *     const myVars = createCssVars({'my-var': '50px'});
 *     // using the CSS var name: this will be '--my-var'
 *     myVars['my-var'].name
 *     // accessing the CSS var value for CSS; this will be: 'var(--my-var, 50px)'
 *     myVars['my-var'].value
 */
export function createCssVars<SpecificVars extends CssVarsSetup>(
    /**
     * The CSS var setup input. Keys of this input object become the CSS var names. Values of this
     * input become the default value of the CSS vars.
     */
    setup: keyof SpecificVars extends CssVarName
        ? CssVarName extends keyof SpecificVars
            ? CssVarNamesTooGenericError
            : SpecificVars
        : CssVarNamesInvalidError,
): keyof SpecificVars extends CssVarName
    ? CssVarName extends keyof SpecificVars
        ? CssVarNamesTooGenericError
        : CssVarDefinitions<SpecificVars>
    : CssVarNamesInvalidError {
    if (isObject(setup)) {
        const cssVarDefinitions: CssVarDefinitions<CssVarsSetup> = mapObjectValues(
            setup,
            (key, value): PropertyValueType<CssVarDefinitions<any>> => {
                const cssVarNameCssResult = css`--${unsafeCSS(key)}`;

                return {
                    name: cssVarNameCssResult,
                    value: css`var(${cssVarNameCssResult}, ${unsafeCSS(value)})`,
                };
            },
        );

        return cssVarDefinitions as any;
    } else {
        throw new Error(`Invalid setup input for '${createCssVars.name}' function.`);
    }
}