import {assertThrows, assertTypeOf} from '@augment-vir/browser-testing';
import {assert} from '@open-wc/testing';
import {
    createCssVars,
    CssVarName,
    CssVarNamesTooGenericError,
    CssVarsSetup,
} from './create-css-vars';

describe('CssVarName', () => {
    it('restricts strings', () => {
        assertTypeOf<'my-var'>().toMatchTypeOf<CssVarName>();
        assertTypeOf<'My-VaR'>().not.toMatchTypeOf<CssVarName>();
        assertTypeOf<'myVar'>().not.toMatchTypeOf<CssVarName>();
        assertTypeOf<'my'>().not.toMatchTypeOf<CssVarName>();
    });
});

describe(createCssVars.name, () => {
    it('maintains input keys', () => {
        const examplesCssVars = createCssVars({
            'my-var': 5,
            'my-var-2': 1,
        });
        assertTypeOf<keyof typeof examplesCssVars>().toEqualTypeOf<'my-var' | 'my-var-2'>();
    });

    it('creates error type when input names are too generic', () => {
        const exampleSetup: CssVarsSetup = {
            'my-var': 5,
            'my-var-2': 1,
        };
        /**
         * TS error expected if the input is too generic (which defeats the purpose of using this
         * packaged for typed CSS vars in the first place.
         */
        // @ts-expect-error
        const examplesCssVars = createCssVars(exampleSetup);
        assertTypeOf(examplesCssVars).toEqualTypeOf<CssVarNamesTooGenericError>();
    });

    it('requires properly named keys', () => {
        /**
         * TS error expected if the input has invalid property keys. They must be kebab-lower-case,
         * and the error message indicates that.
         */
        // @ts-expect-error
        createCssVars({
            'My-Var': 5,
            'my-var-2': 1,
        });
    });

    it('throws error if you actually input the error string', () => {
        assertThrows(
            () =>
                createCssVars(
                    "Error: input CSS var names are too generic. See 'lit-css-vars' package documentation for details.",
                ),
            {matchConstructor: Error},
        );
    });

    it('maps the given setup into useful CSS code', () => {
        const exampleValidCssVars = createCssVars({
            'my-size': '40px',
            'my-color': 'blue',
        });
        assert.strictEqual(String(exampleValidCssVars['my-color'].name), '--my-color');
        assert.strictEqual(String(exampleValidCssVars['my-color'].value), 'var(--my-color, blue)');

        assert.strictEqual(String(exampleValidCssVars['my-size'].name), '--my-size');
        assert.strictEqual(String(exampleValidCssVars['my-size'].value), 'var(--my-size, 40px)');
    });
});
