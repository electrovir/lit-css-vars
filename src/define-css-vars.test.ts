import {assert} from '@augment-vir/assert';
import {describe, it, testWeb} from '@augment-vir/test';
import {css, html} from 'lit';
import {
    CssVarName,
    CssVarNamesTooGenericError,
    CssVarsSetup,
    defineCssVars,
} from './define-css-vars.js';

describe('CssVarName', () => {
    it('restricts strings', () => {
        assert.tsType<'my-var'>().matches<CssVarName>();
        assert.tsType<'My-VaR'>().notMatches<CssVarName>();
        assert.tsType<'myVar'>().notMatches<CssVarName>();
        assert.tsType<'my'>().notMatches<CssVarName>();
    });
});

describe(defineCssVars.name, () => {
    it('maintains input keys', () => {
        const examplesCssVars = defineCssVars({
            'my-var': 5,
            'my-var-2': 1,
        });
        assert.tsType<keyof typeof examplesCssVars>().equals<'my-var' | 'my-var-2'>();
    });

    it('creates error type when input names are too generic', () => {
        const exampleSetup: CssVarsSetup = {
            'my-var': 5,
            'my-var-2': 1,
        };
        // @ts-expect-error: error expected if the input is too generic
        const examplesCssVars = defineCssVars(exampleSetup);
        assert.tsType(examplesCssVars).equals<CssVarNamesTooGenericError>();
    });

    it('errors if you actually input the error string', () => {
        assert.throws(
            () =>
                defineCssVars(
                    "Error: input CSS var names are too generic. See 'lit-css-vars' package documentation for details.",
                ),
            {matchConstructor: Error},
        );
    });

    it('errors if a non-string CSS var name key is given', () => {
        assert.throws(
            () => {
                // @ts-expect-error: expect an error because the types catch that this input is invalid
                return defineCssVars({
                    [Symbol('bad key')]: '4px',
                });
            },
            {matchConstructor: Error},
        );
    });

    it('errors if a non-kebab-lower CSS var name key is given', () => {
        assert.throws(
            () => {
                // @ts-expect-error: expect an error because the types catch that this input is invalid
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
        assert.strictEquals(String(exampleValidCssVars['my-color'].name), '--my-color');
        assert.strictEquals(String(exampleValidCssVars['my-color'].value), 'var(--my-color, blue)');

        assert.strictEquals(String(exampleValidCssVars['my-size'].name), '--my-size');
        assert.strictEquals(String(exampleValidCssVars['my-size'].value), 'var(--my-size, 40px)');
    });

    it('handles leading dashes if they exist for some reason', () => {
        const exampleValidCssVars = defineCssVars({
            '--my-color-with-double-dash': 'red',
            '-my-size-with-single-dash': '2px',
        });
        assert.strictEquals(
            String(exampleValidCssVars['--my-color-with-double-dash'].name),
            '--my-color-with-double-dash',
        );
        assert.strictEquals(
            String(exampleValidCssVars['--my-color-with-double-dash'].value),
            'var(--my-color-with-double-dash, red)',
        );

        assert.strictEquals(
            String(exampleValidCssVars['-my-size-with-single-dash'].name),
            '--my-size-with-single-dash',
        );
        assert.strictEquals(
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

        const wrapperElement: HTMLDivElement = await testWeb.render(html`
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
        `);

        const shouldBeBlue = wrapperElement.querySelector('.defaulted');
        const shouldBeRed = wrapperElement.querySelector('.overridden');

        assert.instanceOf(shouldBeBlue, HTMLSpanElement);
        assert.instanceOf(shouldBeRed, HTMLSpanElement);

        assert.strictEquals(
            globalThis.getComputedStyle(shouldBeBlue).getPropertyValue('color'),
            'rgb(0, 0, 255)',
        );
        assert.strictEquals(
            globalThis.getComputedStyle(shouldBeRed).getPropertyValue('color'),
            'rgb(255, 0, 0)',
        );
    });
});
