import {wrapNarrowTypeWithTypeCheck} from '@augment-vir/common';
import {CssVarsSetup, defineCssVars} from '..';

/**
 * This fails because assigning the object to type CssVarsSetup kills the specific 'my-var-name' key
 * name and instead assigns the object a generic CssVarName key (the key requirement for
 * CssVarsSetup).
 */
const BAD_VARS_SETUP_DO_NOT_USE: CssVarsSetup = {
    'my-var-name': 'blue',
};
// this errors because defineCssVars knows its input is too broad
// @ts-expect-error
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
const goodVarsSetup = wrapNarrowTypeWithTypeCheck<CssVarsSetup>()({
    'my-var-name': 'blue',
});
export const myGoodVars2 = defineCssVars(goodVarsSetup);
