import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {CssPropertyRegistry, cssPropertyRegistry} from './css-property-registry.js';

describe(CssPropertyRegistry.name, () => {
    it('tracks external registration', () => {
        const mockPropertyName = '--my-crazy-property-for-test-1';

        assert.isTrue(cssPropertyRegistry.canRegisterCssProperty(mockPropertyName));
        globalThis.CSS.registerProperty({
            name: mockPropertyName,
            inherits: true,
        });
        assert.isFalse(cssPropertyRegistry.canRegisterCssProperty(mockPropertyName));
        assert.isFalse(
            cssPropertyRegistry.registerProperty({
                name: mockPropertyName,
                inherits: true,
            }),
        );
    });
    it('tracks internal registration', () => {
        const mockPropertyName = '--my-crazy-property-for-test-2';

        assert.isTrue(cssPropertyRegistry.canRegisterCssProperty(mockPropertyName));
        assert.isTrue(
            cssPropertyRegistry.registerProperty({
                name: mockPropertyName,
                inherits: true,
            }),
        );
        assert.isFalse(cssPropertyRegistry.canRegisterCssProperty(mockPropertyName));
        assert.isFalse(
            cssPropertyRegistry.registerProperty({
                name: mockPropertyName,
                inherits: true,
            }),
        );
    });
});
