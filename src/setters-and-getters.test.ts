import {addPx, randomInteger} from '@augment-vir/browser';
import {typedAssertInstanceOf} from '@augment-vir/browser-testing';
import {assert, fixture as renderFixture} from '@open-wc/testing';
import {html} from 'lit';
import {defineCssVars} from './define-css-vars';
import {applyCssVar, readCssVarValue, setCssVarValue} from './setters-and-getters';

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
        const wrapperElement: HTMLDivElement = await renderFixture(
            html`
                <div
                    style=${`${exampleProperty}: ${exampleCssVars['my-var'].value}`}
                    class="fixture-wrapper"
                ></div>
            `,
        );

        const beforeSetCssVarValue = globalThis
            .getComputedStyle(wrapperElement)
            .getPropertyValue(exampleProperty);

        const newValue = addPx(randomInteger({min: 1, max: 100}));

        setCssVarValue({
            forCssVar: exampleCssVars['my-var'],
            onElement: wrapperElement,
            toValue: newValue,
        });

        const afterSetCssVarValue = globalThis
            .getComputedStyle(wrapperElement)
            .getPropertyValue(exampleProperty);

        assert.strictEqual(
            beforeSetCssVarValue,
            exampleCssVars['my-var'].default,
            'CSS var default value was not defaulted to',
        );
        assert.notStrictEqual(
            beforeSetCssVarValue,
            afterSetCssVarValue,
            'CSS var value did not change after set',
        );
        assert.strictEqual(afterSetCssVarValue, newValue, 'CSS var was not set to give value');
    });
});

describe(applyCssVar.name, () => {
    it("uses the CSS var's value", async () => {
        const initialValue = addPx(randomInteger({min: 1, max: 100}));
        const wrapperElement: HTMLDivElement = await renderFixture(
            html`
                <div style=${`${exampleProperty}: ${initialValue};`} class="fixture-wrapper"></div>
            `,
        );

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

        const newValue = addPx(randomInteger({min: 1, max: 100}));

        setCssVarValue({
            forCssVar: exampleCssVars['my-var'],
            onElement: wrapperElement,
            toValue: newValue,
        });

        const afterSetCssVarValue = globalThis
            .getComputedStyle(wrapperElement)
            .getPropertyValue(exampleProperty);

        assert.strictEqual(
            beforeApplyingCssVar,
            initialValue,
            'initial style value was overwritten too early',
        );
        assert.notStrictEqual(
            initialValue,
            exampleCssVars['my-var'].default,
            "initial value should not be identical to the default CSS var value cause then we can't test it",
        );
        assert.strictEqual(
            afterApplyingCssVarComputedValue,
            exampleCssVars['my-var'].default,
            'after applying the CSS var, its default value was not used',
        );
        assert.strictEqual(
            afterApplyingCssVarDirectValue,
            'var(--my-var, 0px)',
            'CSS var value did not change after set',
        );
        assert.strictEqual(
            afterSetCssVarValue,
            newValue,
            'CSS var value did not propagate to recently applied property',
        );
    });
});

describe(readCssVarValue.name, () => {
    async function createFixtureTestWithChild() {
        const cssVarValue = addPx(randomInteger({min: 1, max: 100}));
        const wrapperElement: HTMLDivElement = await renderFixture(
            html`
                <div
                    style=${`${exampleCssVars['my-var'].name}: ${cssVarValue};`}
                    class="fixture-wrapper"
                >
                    <div class="child-element"></div>
                </div>
            `,
        );

        const childElement = wrapperElement.querySelector('.child-element');

        typedAssertInstanceOf(childElement, HTMLDivElement);

        return {childElement, wrapperElement, cssVarValue};
    }

    it('directly reads CSS var values', async () => {
        const {wrapperElement, cssVarValue} = await createFixtureTestWithChild();

        const readVarValue = readCssVarValue({
            forCssVar: exampleCssVars['my-var'],
            onElement: wrapperElement,
        });

        assert.strictEqual(readVarValue, cssVarValue);
    });

    it('does not read cascaded values if includeCascade is false', async () => {
        const {childElement} = await createFixtureTestWithChild();

        const readVarValue = readCssVarValue({
            forCssVar: exampleCssVars['my-var'],
            onElement: childElement,
        });

        assert.strictEqual(readVarValue, '', 'cascaded value should not have been read');
    });

    it('reads cascaded values if includeCascade is true', async () => {
        const {childElement, cssVarValue} = await createFixtureTestWithChild();

        const readVarValue = readCssVarValue({
            forCssVar: exampleCssVars['my-var'],
            onElement: childElement,
            includeCascade: true,
        });

        assert.strictEqual(
            readVarValue,
            cssVarValue,
            'cascaded value was not read when it should have been',
        );
    });
});
