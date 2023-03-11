import {createCssVars} from '..';

// expect errors because we're intentionally passing in invalid CSS var names as an example
// @ts-expect-error
export const myCssVars = createCssVars({
    // good: kebab-lower-case
    'my-var-name': 'green',
    'my-var': 'green',
    // bad: has upper case letters
    'My-Var': 'red',
    // bad: not kebab case, must have at least one dash (-)
    thing: 'red',
});
