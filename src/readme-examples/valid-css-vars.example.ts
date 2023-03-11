import {css} from 'lit';
import {createCssVars} from '..';

// css vars definition
export const myVars = createCssVars({
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
