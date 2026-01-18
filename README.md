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
