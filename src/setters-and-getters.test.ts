import {assert} from '@augment-vir/assert';
import {addPx, randomInteger, randomString} from '@augment-vir/common';
import {describe, it, testWeb} from '@augment-vir/test';
import {html, type TemplateResult} from 'lit';
import {type CssVarName, defineCssVars} from './define-css-vars.js';
import {
    applyCssVar,
    applyCssVarsViaStyleElement,
    readCssVarValue,
    setCssVarValue,
} from './setters-and-getters.js';

const exampleCssVars = defineCssVars({
    /**
     * If this default value is just 0 then the browser will automatically append "px" to
     * padding-top when we read the computed value inside the tests below. That messes up our
     * assertions.
     */
    'my-var': '0px',
});

const exampleProperty = 'padding-top';

describe(setCssVarValue.name, () => {
    it('sets css var values', async () => {
        const wrapperElement: HTMLDivElement = await testWeb.render(html`
            <div
                style=${`${exampleProperty}: ${exampleCssVars['my-var'].value}`}
                class="fixture-wrapper"
            ></div>
        `);

        const beforeSetCssVarValue = globalThis
            .getComputedStyle(wrapperElement)
            .getPropertyValue(exampleProperty);

        const newValue = addPx(
            randomInteger({
                min: 1,
                max: 100,
            }),
        );

        setCssVarValue({
            forCssVar: exampleCssVars['my-var'],
            onElement: wrapperElement,
            toValue: newValue,
        });

        const afterSetCssVarValue = globalThis
            .getComputedStyle(wrapperElement)
            .getPropertyValue(exampleProperty);

        assert.strictEquals(
            beforeSetCssVarValue,
            exampleCssVars['my-var'].default,
            'CSS var default value was not defaulted to',
        );
        assert.notStrictEquals(
            beforeSetCssVarValue,
            afterSetCssVarValue,
            'CSS var value did not change after set',
        );
        assert.strictEquals(afterSetCssVarValue, newValue, 'CSS var was not set to give value');
    });
});

describe(applyCssVar.name, () => {
    it("uses the CSS var's value", async () => {
        const initialValue = addPx(
            randomInteger({
                min: 1,
                max: 100,
            }),
        );
        const wrapperElement: HTMLDivElement = await testWeb.render(html`
            <div style=${`${exampleProperty}: ${initialValue};`} class="fixture-wrapper"></div>
        `);

        const beforeApplyingCssVar = globalThis
            .getComputedStyle(wrapperElement)
            .getPropertyValue(exampleProperty);

        applyCssVar({
            forProperty: exampleProperty,
            onElement: wrapperElement,
            toCssVar: exampleCssVars['my-var'],
        });

        const afterApplyingCssVarComputedValue = globalThis
            .getComputedStyle(wrapperElement)
            .getPropertyValue(exampleProperty);
        const afterApplyingCssVarDirectValue =
            wrapperElement.style.getPropertyValue(exampleProperty);

        const newValue = addPx(
            randomInteger({
                min: 1,
                max: 100,
            }),
        );

        setCssVarValue({
            forCssVar: exampleCssVars['my-var'],
            onElement: wrapperElement,
            toValue: newValue,
        });

        const afterSetCssVarValue = globalThis
            .getComputedStyle(wrapperElement)
            .getPropertyValue(exampleProperty);

        assert.strictEquals(
            beforeApplyingCssVar,
            initialValue,
            'initial style value was overwritten too early',
        );
        assert.notStrictEquals(
            initialValue,
            exampleCssVars['my-var'].default,
            "initial value should not be identical to the default CSS var value cause then we can't test it",
        );
        assert.strictEquals(
            afterApplyingCssVarComputedValue,
            exampleCssVars['my-var'].default,
            'after applying the CSS var, its default value was not used',
        );
        assert.strictEquals(
            afterApplyingCssVarDirectValue,
            'var(--my-var, 0px)',
            'CSS var value did not change after set',
        );
        assert.strictEquals(
            afterSetCssVarValue,
            newValue,
            'CSS var value did not propagate to recently applied property',
        );
    });
});

describe(readCssVarValue.name, () => {
    async function createFixtureTestWithChild() {
        const cssVarValue = addPx(
            randomInteger({
                min: 1,
                max: 100,
            }),
        );
        const wrapperElement: HTMLDivElement = await testWeb.render(html`
            <div
                style=${`${exampleCssVars['my-var'].name}: ${cssVarValue};`}
                class="fixture-wrapper"
            >
                <div class="child-element"></div>
            </div>
        `);

        const childElement = wrapperElement.querySelector('.child-element');

        assert.instanceOf(childElement, HTMLDivElement);

        return {
            childElement,
            wrapperElement,
            cssVarValue,
        };
    }

    it('directly reads CSS var values', async () => {
        const {wrapperElement, cssVarValue} = await createFixtureTestWithChild();

        const readVarValue = readCssVarValue({
            forCssVar: exampleCssVars['my-var'],
            onElement: wrapperElement,
        });

        assert.strictEquals(readVarValue, cssVarValue);
    });

    it('does not read cascaded values if includeCascade is false', async () => {
        const {childElement} = await createFixtureTestWithChild();

        const readVarValue = readCssVarValue({
            forCssVar: exampleCssVars['my-var'],
            onElement: childElement,
        });

        assert.strictEquals(readVarValue, '', 'cascaded value should not have been read');
    });

    it('reads cascaded values if includeCascade is true', async () => {
        const {childElement, cssVarValue} = await createFixtureTestWithChild();

        const readVarValue = readCssVarValue({
            forCssVar: exampleCssVars['my-var'],
            onElement: childElement,
            includeCascade: true,
        });

        assert.strictEquals(
            readVarValue,
            cssVarValue,
            'cascaded value was not read when it should have been',
        );
    });
});

describe(applyCssVarsViaStyleElement.name, () => {
    async function renderWithCssVars(
        template: TemplateResult,
        cssVarValues: Record<CssVarName, string | number | undefined>,
    ) {
        const wrapperElement: HTMLDivElement = await testWeb.render(template);
        const styleKey = `test-${randomString()}`;
        const styleElement = applyCssVarsViaStyleElement(cssVarValues, styleKey, wrapperElement);

        return {
            wrapperElement,
            styleElement,
            styleKey,
        };
    }

    it('creates a style element with CSS var values', async () => {
        const cssVarValue = addPx(
            randomInteger({
                min: 1,
                max: 100,
            }),
        );

        const {styleElement} = await renderWithCssVars(
            html`
                <div class="fixture-wrapper">
                    <div class="child-element"></div>
                </div>
            `,
            {
                'my-var': cssVarValue,
            },
        );

        assert.isTrue(
            styleElement.textContent.includes('--my-var'),
            'style element should contain the CSS var name with -- prefix',
        );
        assert.isTrue(
            styleElement.textContent.includes(cssVarValue),
            'style element should contain the CSS var value',
        );
    });

    it('handles CSS var names that already have the -- prefix', async () => {
        const cssVarValue = '20px';

        const {styleElement} = await renderWithCssVars(
            html`
                <div class="fixture-wrapper"></div>
            `,
            {
                '--already-prefixed': cssVarValue,
            },
        );

        assert.isTrue(
            styleElement.textContent.includes('--already-prefixed'),
            'should contain the CSS var name',
        );
        assert.isFalse(
            styleElement.textContent.includes('----already-prefixed'),
            'should not double the -- prefix',
        );
    });

    it('skips undefined and empty values', async () => {
        const {styleElement} = await renderWithCssVars(
            html`
                <div class="fixture-wrapper"></div>
            `,
            {
                'valid-var': '10px',
                'undefined-var': undefined,
                'empty-var': '',
            },
        );

        assert.isTrue(
            styleElement.textContent.includes('--valid-var'),
            'should contain valid CSS var',
        );
        assert.isFalse(
            styleElement.textContent.includes('--undefined-var'),
            'should not contain undefined CSS var',
        );
        assert.isFalse(
            styleElement.textContent.includes('--empty-var'),
            'should not contain empty CSS var',
        );
    });

    it('reuses existing style element with same key', async () => {
        const wrapperElement: HTMLDivElement = await testWeb.render(html`
            <div class="fixture-wrapper"></div>
        `);

        const styleKey = 'test-css-vars-reuse';

        applyCssVarsViaStyleElement(
            {
                'first-var': '5px',
            },
            styleKey,
            wrapperElement,
        );
        applyCssVarsViaStyleElement(
            {
                'second-var': '10px',
            },
            styleKey,
            wrapperElement,
        );

        const styleElements = wrapperElement.querySelectorAll(`style#${styleKey}`);
        assert.strictEquals(styleElements.length, 1, 'should only have one style element');

        const styleElement = styleElements[0];
        assert.instanceOf(styleElement, HTMLStyleElement);
        assert.isTrue(
            styleElement.textContent.includes('--second-var'),
            'should contain the second CSS var',
        );
        assert.isFalse(
            styleElement.textContent.includes('--first-var'),
            'should have replaced the first CSS var content',
        );
    });

    it('accepts numeric values', async () => {
        const {styleElement} = await renderWithCssVars(
            html`
                <div class="fixture-wrapper"></div>
            `,
            {
                'numeric-var': 42,
            },
        );

        assert.isTrue(
            styleElement.textContent.includes('--numeric-var: 42'),
            'should contain the numeric value as a string',
        );
    });

    it('applies CSS var values to the DOM', async () => {
        const cssVarValue = addPx(
            randomInteger({
                min: 1,
                max: 100,
            }),
        );

        const wrapperElement: HTMLDivElement = await testWeb.render(html`
            <div class="fixture-wrapper">
                <style>
                    .test-element {
                        padding-top: var(--applied-var);
                    }
                </style>
                <div class="test-element"></div>
            </div>
        `);

        const testElement = wrapperElement.querySelector('.test-element');
        assert.instanceOf(testElement, HTMLElement);

        const beforeValue = globalThis
            .getComputedStyle(testElement)
            .getPropertyValue('padding-top');

        applyCssVarsViaStyleElement(
            {
                'applied-var': cssVarValue,
            },
            'test-applied',
            wrapperElement,
        );

        const afterValue = globalThis.getComputedStyle(testElement).getPropertyValue('padding-top');

        assert.strictEquals(beforeValue, '0px', 'CSS var should not be set initially');
        assert.strictEquals(afterValue, cssVarValue, 'CSS var value should be applied to the DOM');
    });

    it('throws an error when style key contains whitespace', async () => {
        const wrapperElement: HTMLDivElement = await testWeb.render(html`
            <div class="fixture-wrapper"></div>
        `);

        assert.throws(
            () =>
                applyCssVarsViaStyleElement(
                    {
                        'my-var': '10px',
                    },
                    'invalid key',
                    wrapperElement,
                ),
            {
                matchMessage: 'Cannot use a style key with white space in it',
            },
        );
    });
});
