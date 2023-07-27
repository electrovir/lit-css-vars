import {
    camelCaseToKebabCase,
    isObject,
    isRuntimeTypeOf,
    mapObjectValues,
    PropertyValueType,
} from '@augment-vir/common';
import {css, CSSResult, unsafeCSS} from 'lit';

/** Lower, kebab case requirement for CSS var names. */
export type CssVarName = `${Lowercase<string>}-${Lowercase<string>}` | Lowercase<string>;

export type CssVarValue = string | number | CSSResult;

/**
 * Base type for defineCssVars's input. This needs to be looser than the types accepted by
 * defineCssVars.
 */
export type CssVarsSetup = {[name: CssVarName]: CssVarValue | CssVarsSetup};

export type SingleCssVarDefinition = {
    name: CSSResult;
    value: CSSResult;
    default: string;
};

export type CheckCssVarsDefinitionOutput<
    SpecificSetup extends CssVarsSetup | CssVarNamesNonKebabError | CssVarNamesTooGenericError,
> = CssVarNamesNonKebabError extends SpecificSetup
    ? CssVarNamesNonKebabError
    : CssVarNamesTooGenericError extends SpecificSetup
    ? CssVarNamesTooGenericError
    : SpecificSetup extends CssVarsSetup
    ? CssVarDefinitions<SpecificSetup>
    : never;

/** Output for defineCssVars. */
export type CssVarDefinitions<SpecificSetup extends CssVarsSetup> = {
    [KeyName in keyof SpecificSetup]: Exclude<
        SpecificSetup[KeyName],
        CSSResult
    > extends CssVarsSetup
        ? CssVarDefinitions<Exclude<SpecificSetup[KeyName], CSSResult>>
        : SingleCssVarDefinition;
};

export type CssVarNamesTooGenericError =
    "Error: input CSS var names are too generic. See 'lit-css-vars' package documentation for details.";
export type CssVarNamesNonKebabError = 'Error: all CSS var names must be lower-kebab-case.';

export type ValidateCssVarsSetup<SpecificVars extends CssVarsSetup> = SpecificVars extends never
    ? never
    : keyof SpecificVars extends CssVarName
    ? CssVarName extends keyof SpecificVars
        ? CssVarNamesTooGenericError
        : CssVarNamesTooGenericError extends ValidateCssVarsSetup<
              Extract<Exclude<PropertyValueType<SpecificVars>, CssVarValue>, CssVarsSetup>
          >
        ? CssVarNamesTooGenericError
        : CssVarNamesNonKebabError extends ValidateCssVarsSetup<
              Extract<Exclude<PropertyValueType<SpecificVars>, CssVarValue>, CssVarsSetup>
          >
        ? CssVarNamesNonKebabError
        : SpecificVars
    : CssVarNamesNonKebabError;

export type ValidateCssVarsSetup2<SpecificVars extends CssVarsSetup> =
    keyof SpecificVars extends CssVarName
        ? CssVarName extends keyof SpecificVars
            ? CssVarNamesTooGenericError
            : SpecificVars
        : CssVarNamesNonKebabError;

/**
 * Creates an easy-to-use-in-lit mapping of the given CSS Var names and defaults. The input
 * determines the CSS var names and their default values. The output is a mapping of the CSS var
 * names to name and value objects that can be easily interpolated into lit's css keyed template
 * strings.
 *
 * @example
 *     // creates a CSS var with name 'my-var' and default value of 50px.
 *     const myVars = defineCssVars({'my-var': '50px'});
 *     // using the CSS var name: this will be '--my-var'
 *     myVars['my-var'].name;
 *     // accessing the CSS var value for CSS; this will be: 'var(--my-var, 50px)'
 *     myVars['my-var'].value;
 */
export function defineCssVars<const SpecificVars extends CssVarsSetup>(
    /**
     * The CSS var setup input. Keys of this input object become the CSS var names. Values of this
     * input become the default value of the CSS vars.
     */
    setup: ValidateCssVarsSetup<SpecificVars>,
): CheckCssVarsDefinitionOutput<ValidateCssVarsSetup<SpecificVars>> {
    return internalDefineCssVars(setup, []) as CheckCssVarsDefinitionOutput<
        ValidateCssVarsSetup<SpecificVars>
    >;
}

function internalDefineCssVars(
    setup: CssVarsSetup | string,
    parentKeys: string[],
): CssVarDefinitions<CssVarsSetup> {
    if (isObject(setup)) {
        const cssVarDefinitions: CssVarDefinitions<any> = mapObjectValues(
            setup,
            (key, rawInputValue): PropertyValueType<CssVarDefinitions<any>> => {
                if (!isRuntimeTypeOf(key, 'string')) {
                    throw new Error(
                        `Invalid CSS var name '${String(
                            key,
                        )}' given. CSS var names must be strings.`,
                    );
                }

                if (
                    isRuntimeTypeOf(rawInputValue, 'object') &&
                    !('_$cssResult$' in rawInputValue)
                ) {
                    return internalDefineCssVars(rawInputValue, [
                        ...parentKeys,
                        key,
                    ]);
                } else {
                    const kebabKey = camelCaseToKebabCase(key).toLowerCase();
                    if (kebabKey !== key) {
                        throw new Error(
                            `Invalid CSS var name '${key}' given. CSS var names must be in lower kebab case.`,
                        );
                    }

                    const defaultValue = rawInputValue as string | number | CSSResult;

                    if (!defaultValue) {
                        throw new Error(`Default value for css var setup key '${key}' is empty.`);
                    }

                    const varName = [
                        ...parentKeys,
                        key,
                    ].join('-');

                    const cssVarNameCssResult = varName.startsWith('--')
                        ? unsafeCSS(varName)
                        : varName.startsWith('-')
                        ? css`-${unsafeCSS(varName)}`
                        : css`--${unsafeCSS(varName)}`;

                    const varDefinition: SingleCssVarDefinition = {
                        name: cssVarNameCssResult,
                        value: css`var(${cssVarNameCssResult}, ${unsafeCSS(defaultValue)})`,
                        default: String(defaultValue),
                    };

                    return varDefinition as PropertyValueType<CssVarDefinitions<CssVarsSetup>>;
                }
            },
        );

        return cssVarDefinitions as CssVarDefinitions<CssVarsSetup>;
    } else {
        throw new Error(`Invalid setup input for '${defineCssVars.name}' function.`);
    }
}
