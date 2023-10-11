import {assertThrows, assertTypeOf} from '@augment-vir/browser-testing';
import {assert, fixture as renderFixture} from '@open-wc/testing';
import {css, html} from 'lit';
import {assertInstanceOf} from 'run-time-assertions';
import {
    CssVarName,
    CssVarNamesTooGenericError,
    CssVarsSetup,
    defineCssVars,
} from './define-css-vars';

describe('CssVarName', () => {
    it('restricts strings', () => {
        assertTypeOf<'my-var'>().toMatchTypeOf<CssVarName>();
        assertTypeOf<'My-VaR'>().not.toMatchTypeOf<CssVarName>();
        assertTypeOf<'myVar'>().not.toMatchTypeOf<CssVarName>();
        assertTypeOf<'my'>().not.toMatchTypeOf<CssVarName>();
    });
});

describe(defineCssVars.name, () => {
    it('maintains input keys', () => {
        const examplesCssVars = defineCssVars({
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
        const examplesCssVars = defineCssVars(exampleSetup);
        assertTypeOf(examplesCssVars).toEqualTypeOf<CssVarNamesTooGenericError>();
    });

    it('errors if you actually input the error string', () => {
        assertThrows(
            () =>
                defineCssVars(
                    "Error: input CSS var names are too generic. See 'lit-css-vars' package documentation for details.",
                ),
            {matchConstructor: Error},
        );
    });

    it('errors if a non-string CSS var name key is given', () => {
        assertThrows(
            () => {
                // expect an error because the types catch that this input is invalid
                // @ts-expect-error
                return defineCssVars({
                    [Symbol('bad key')]: '4px',
                });
            },
            {matchConstructor: Error},
        );
    });

    it('errors if a non-kebab-lower CSS var name key is given', () => {
        assertThrows(
            () => {
                // expect an error because the types catch that this input is invalid
                // @ts-expect-error
                return defineCssVars({
                    myVar: '4px',
                });
            },
            {matchConstructor: Error},
        );
    });

    it('maps the given setup into useful CSS code', () => {
        const exampleValidCssVars = defineCssVars({
            'my-color': 'blue',
            'my-size': '40px',
        });
        assert.strictEqual(String(exampleValidCssVars['my-color'].name), '--my-color');
        assert.strictEqual(String(exampleValidCssVars['my-color'].value), 'var(--my-color, blue)');

        assert.strictEqual(String(exampleValidCssVars['my-size'].name), '--my-size');
        assert.strictEqual(String(exampleValidCssVars['my-size'].value), 'var(--my-size, 40px)');
    });

    it('handles leading dashes if they exist for some reason', () => {
        const exampleValidCssVars = defineCssVars({
            '--my-color-with-double-dash': 'red',
            '-my-size-with-single-dash': '2px',
        });
        assert.strictEqual(
            String(exampleValidCssVars['--my-color-with-double-dash'].name),
            '--my-color-with-double-dash',
        );
        assert.strictEqual(
            String(exampleValidCssVars['--my-color-with-double-dash'].value),
            'var(--my-color-with-double-dash, red)',
        );

        assert.strictEqual(
            String(exampleValidCssVars['-my-size-with-single-dash'].name),
            '--my-size-with-single-dash',
        );
        assert.strictEqual(
            String(exampleValidCssVars['-my-size-with-single-dash'].value),
            'var(--my-size-with-single-dash, 2px)',
        );
    });

    it('produces valid css vars that cascade properly', async () => {
        const myVars = defineCssVars({
            'my-color': 'blue',
        });
        const myStyles = css`
            p {
                ${myVars['my-color'].name}: red;
            }

            span {
                color: ${myVars['my-color'].value};
            }
        `;

        const wrapperElement: HTMLDivElement = await renderFixture(
            html`
                <div class="fixture-wrapper">
                    <style>
                        ${myStyles}
                    </style>
                    <span class="defaulted">This should be blue, the default CSS var value.</span>
                    <p>
                        <span class="overridden">
                            This should be red, the overridden CSS var value.
                        </span>
                    </p>
                </div>
            `,
        );

        const shouldBeBlue = wrapperElement.querySelector('.defaulted');
        const shouldBeRed = wrapperElement.querySelector('.overridden');

        assertInstanceOf(shouldBeBlue, HTMLSpanElement);
        assertInstanceOf(shouldBeRed, HTMLSpanElement);

        assert.strictEqual(
            globalThis.getComputedStyle(shouldBeBlue).getPropertyValue('color'),
            'rgb(0, 0, 255)',
        );
        assert.strictEqual(
            globalThis.getComputedStyle(shouldBeRed).getPropertyValue('color'),
            'rgb(255, 0, 0)',
        );
    });
});
