import {defineCssVars} from '../index.js';

export const myCssVars = defineCssVars({
    // good: kebab-lower-case
    'my-var-name': 'green',
    'my-var': 'green',
    // bad: has upper case letters
    'My-Var': 'red',
    // bad: not kebab case, must have at least one dash (-)
    thing: 'red',
});
