import {ensureErrorAndPrependMessage, stringify} from '@augment-vir/common';

/**
 * Class for storing CSS property registrations. An instance is automatically constructed at
 * {@link cssPropertyRegistry}.
 *
 * @category Internal
 */
export class CssPropertyRegistry {
    public static readonly cssPropertyDefinitionSupported = !!(
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        (globalThis.CSS && globalThis.CSS.registerProperty)
    ) satisfies boolean as boolean;

    public readonly registry = new Map<string, PropertyDefinition>();

    constructor() {
        /* node:coverage ignore next 4 */
        const originalRegisterProperty: typeof globalThis.CSS.registerProperty | undefined =
            CssPropertyRegistry.cssPropertyDefinitionSupported
                ? globalThis.CSS.registerProperty.bind(globalThis.CSS)
                : undefined;

        if (originalRegisterProperty) {
            globalThis.CSS.registerProperty = (definition: PropertyDefinition): void => {
                cssPropertyRegistry.registry.set(definition.name, definition);
                return originalRegisterProperty(definition);
            };
        }
    }

    /**
     * Detects if the name can be registered. Also checks if `globalThis.CSS.registerProperty` is
     * supported at all.
     */
    public canRegisterCssProperty(name: string): boolean {
        return CssPropertyRegistry.cssPropertyDefinitionSupported && !this.registry.has(name);
    }

    /**
     * Register a property only if registration is supported and if the CSS var has not already been
     * registered.
     *
     * @returns `true` if the definition was registered, `false` otherwise.
     */
    public registerProperty(definition: Readonly<PropertyDefinition>): boolean {
        if (!this.canRegisterCssProperty(definition.name)) {
            return false;
        }

        try {
            globalThis.CSS.registerProperty(definition);
            return true;
        } catch (error) {
            throw ensureErrorAndPrependMessage(
                error,
                `Failed to define CSS var: ${stringify(definition, 4)}\n\n`,
            );
        }
    }
}

/**
 * An instance of {@link CssPropertyRegistry}.
 *
 * @category Internal
 */
export const cssPropertyRegistry = new CssPropertyRegistry();
