# lit-css-vars

For easily creating and sharing typed CSS vars for the [lit](https://lit.dev) ecosystem.

## Installation

```bash
npm i lit-css-vars
```

## Usage

<!-- example-link: src/readme-examples/valid-css-vars.example.ts -->

```TypeScript
import {css} from 'lit';
import {defineCssVars} from 'lit-css-vars';

// css vars definition
export const myVars = defineCssVars({
    // key is CSS var name
    'my-var-name': 'blue', // value is the CSS var's default value
});

// usage
function renderStyles() {
    return css`
        p {
            /*
                This sets the CSS var's value to red. This works because ".name" is "--my-var-name".
            */
            ${myVars['my-var-name'].name}: red;
        }

        span {
            /*
                This shows how to use the CSS var's value. If a span is within a <p> element, color
                will be set to red. If not, the default value of blue (defined earlier) will be
                applied. This works because ".value" is "var(--my-var-name, blue)".
            */
            color: ${myVars['my-var-name'].value};
        }
    `;
}
```

## Errors

If you see the following error messages in your types, read the explanations below on how to fix them.

### `Error: input CSS var names are too generic.`

This happens if your input to `createCssVars` is too vague. This means that specific var names can't be extracted from the input object. This may happen if your input object has the vague key type of just `string`, like `Record<string, string>`. You need to make sure you use `as const` or somehow prevent TypeScript from broadening your input type.

<!-- example-link: src/readme-examples/keys-too-generic.example.ts -->

```TypeScript
import {CssVarsSetup, defineCssVars} from 'lit-css-vars';

/**
 * This fails because assigning the object to type CssVarsSetup kills the specific 'my-var-name' key
 * name and instead assigns the object a generic CssVarName key (the key requirement for
 * CssVarsSetup).
 */
const BAD_VARS_SETUP_DO_NOT_USE: CssVarsSetup = {
    'my-var-name': 'blue',
};

// @ts-expect-error: this errors because defineCssVars knows its input is too broad
export const BAD_VARS_DO_NOT_USE = defineCssVars(BAD_VARS_SETUP_DO_NOT_USE);

/**
 * This example works wonderfully because defineCssVars does not broaden the input type but still
 * holds it to a specific type requirement.
 */
export const myGoodVars = defineCssVars({
    'my-var-name': 'blue',
});

/**
 * This example works by using a helper function, wrapNarrowTypeWithTypeCheck, that requires the
 * input object to conform to the passed type (CssVarsSetup) without broadening the input type.
 * TypeScript thus knows that the exact key of goodVarsSetup is 'my-var-name' and all is well with
 * defineCssVars below.
 */
const goodVarsSetup = {
    'my-var-name': 'blue',
} satisfies CssVarsSetup;
export const myGoodVars2 = defineCssVars(goodVarsSetup);
```

### `Error: all CSS var names must be lower-kebab-case.`

All CSS var name keys must be in lower-kebab-case:

<!-- example-link: src/readme-examples/invalid-css-var-names.example.ts -->

```TypeScript
import {defineCssVars} from 'lit-css-vars';

// @ts-expect-error: expect errors because we're intentionally passing in invalid CSS var names as an example
export const myCssVars = defineCssVars({
    // good: kebab-lower-case
    'my-var-name': 'green',
    'my-var': 'green',
    // bad: has upper case letters
    'My-Var': 'red',
    // bad: not kebab case, must have at least one dash (-)
    thing: 'red',
});
```
