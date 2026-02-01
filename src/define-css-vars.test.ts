import {assert} from '@augment-vir/assert';
import {mapObjectValues} from '@augment-vir/common';
import {describe, it, itCases, testWeb} from '@augment-vir/test';
import {css, html} from 'lit';
import {cssPropertyRegistry} from './css-property-registry.js';
import {type CssVarName, defineCssVars} from './define-css-vars.js';
import {CssVarSyntaxName, CssVarSyntaxSeparator} from './syntax.js';

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
    it('blocks empty values', () => {
        assert.throws(
            () =>
                defineCssVars({
                    'invalid-empty-var': '',
                }),
            {
                matchMessage: 'Initial value for CSS var --invalid-empty-var cannot be empty.',
            },
        );
    });
    it('skips registration', () => {
        defineCssVars(
            {
                'unregistered-var': '2px',
            },
            {
                skipRegistration: true,
            },
        );
        assert.isTrue(
            cssPropertyRegistry.registerProperty({
                name: '--unregistered-var',
                inherits: true,
            }),
        );
    });
    it('works with all supported values', () => {
        assert.deepEquals(
            mapObjectValues(
                defineCssVars({
                    'my-sting-var': 'one',
                    'my-number-var': 2,
                    'my-css-var': css`text-align`,
                    'my-object-var': {
                        default: css`3px`,
                        syntax: CssVarSyntaxName.Length,
                    },
                    'my-union-var': {
                        default: '45deg',
                        syntax: {
                            union: [
                                CssVarSyntaxName.Angle,
                                {
                                    raw: 'auto',
                                },
                            ],
                        },
                    },
                    'my-list-var': {
                        default: 'blue',
                        syntax: {
                            list: {
                                separator: CssVarSyntaxSeparator.Comma,
                                values: CssVarSyntaxName.Color,
                            },
                        },
                    },
                    'my-any-var': {
                        default: 'blue',
                    },
                }),
                (key, value) => {
                    return mapObjectValues(value, (innerKey, innerValue) => String(innerValue));
                },
            ),
            {
                'my-css-var': {
                    default: 'text-align',
                    name: '--my-css-var',
                    syntax: '*',
                    value: 'var(--my-css-var, text-align)',
                },
                'my-number-var': {
                    default: '2',
                    name: '--my-number-var',
                    syntax: '*',
                    value: 'var(--my-number-var, 2)',
                },
                'my-object-var': {
                    default: '3px',
                    name: '--my-object-var',
                    syntax: '<length>',
                    value: 'var(--my-object-var, 3px)',
                },
                'my-sting-var': {
                    default: 'one',
                    name: '--my-sting-var',
                    syntax: '*',
                    value: 'var(--my-sting-var, one)',
                },
                'my-union-var': {
                    default: '45deg',
                    name: '--my-union-var',
                    syntax: '<angle> | auto',
                    value: 'var(--my-union-var, 45deg)',
                },
                'my-list-var': {
                    default: 'blue',
                    name: '--my-list-var',
                    syntax: '<color>#',
                    value: 'var(--my-list-var, blue)',
                },
                'my-any-var': {
                    default: 'blue',
                    name: '--my-any-var',
                    syntax: '*',
                    value: 'var(--my-any-var, blue)',
                },
            },
        );
    });
    it('errors on invalid syntax', () => {
        assert.throws(() =>
            defineCssVars({
                'my-invalid-var': {
                    // @ts-expect-error: intentionally invalid syntax
                    syntax: 'invalid',
                },
            }),
        );
    });

    it('maps the given setup into useful CSS code', () => {
        const exampleValidCssVars = defineCssVars({
            'my-color': {
                default: 'blue',
                syntax: CssVarSyntaxName.Color,
            },
            'my-size': {
                default: '40px',
                syntax: CssVarSyntaxName.Length,
            },
        });
        assert.strictEquals(String(exampleValidCssVars['my-color'].name), '--my-color');
        assert.strictEquals(String(exampleValidCssVars['my-color'].value), 'var(--my-color, blue)');

        assert.strictEquals(
            globalThis
                .getComputedStyle(document.body)
                .getPropertyValue(String(exampleValidCssVars['my-color'].name)),
            /** Computed styles always return colors in rgb format. */
            'rgb(0, 0, 255)',
        );

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
            'my-color-2': 'blue',
        });
        const myStyles = css`
            p {
                ${myVars['my-color-2'].name}: red;
            }

            span {
                color: ${myVars['my-color-2'].value};
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
    itCases(defineCssVars<any>, [
        {
            it: 'errors on non-computationally independent initial value',
            inputs: [
                {
                    'bad-var-that-uses-other-vars': {
                        default: 'var(--my-var)',
                        syntax: CssVarSyntaxName.Length,
                    },
                },
            ],
            throws: {
                matchConstructor: Error,
            },
        },
        {
            it: 'allows computationally dependent default value',
            inputs: [
                {
                    'bad-var-that-uses-other-vars-2': {
                        default: 'var(--my-var)',
                        initialValue: '2px',
                    },
                },
            ],
            throws: undefined,
        },
        {
            it: 'rejects uppercase var name',
            inputs: [
                {
                    'My-Var': '3px',
                },
            ],
            throws: {
                matchMessage: 'Must be lowercase',
            },
        },
        {
            it: 'rejects no dash var name',
            inputs: [
                {
                    me: '3px',
                },
            ],
            throws: {
                matchMessage: 'Must have at least one dash',
            },
        },
        {
            it: 'rejects no dash var name',
            inputs: [
                {
                    [Symbol('bad')]: '3px',
                },
            ],
            throws: {
                matchMessage: 'Must be string',
            },
        },
    ]);
});
