import {type RequireExactlyOne} from 'type-fest';

/**
 * All CSS formats supported by `@property`, at of the time of this writing.
 *
 * This is generated from the following script, run at
 * https://developer.mozilla.org/docs/Web/CSS/Reference/At-rules/%40property/syntax:
 *
 * ```js
 * console.log(
 *     Array.from(document.querySelectorAll('[aria-labelledby="values"] > dl > *'))
 *         .reverse()
 *         .reduce((accum, current) => {
 *             if (!(current instanceof HTMLElement)) {
 *                 console.warn('not HTMLElement', current);
 *                 return accum;
 *             } else if (current.tagName.toLowerCase() === 'dt') {
 *                 const syntax = current.innerText.replaceAll('"', '');
 *                 const keySplits = syntax.replaceAll('<', '').replaceAll('>', '').split('-');
 *
 *                 const key = [
 *                     keySplits[0]?.[0]?.toUpperCase(),
 *                     keySplits[0]?.slice(1),
 *                     ...keySplits.slice(1).map((entry) => {
 *                         return [
 *                             entry[0]?.toUpperCase(),
 *                             entry.slice(1),
 *                         ].join('');
 *                     }),
 *                 ].join('');
 *
 *                 return accum + '\n' + `    ${key} = '${syntax}',`;
 *             } else if (current.tagName.toLowerCase() === 'dd') {
 *                 const contents = current
 *                     .querySelector('p')
 *                     ?.innerHTML.replaceAll('&lt;', '<')
 *                     .replaceAll('&gt;', '>')
 *                     .replaceAll('/en-US/', 'https://developer.mozilla.org/');
 *
 *                 if (contents) {
 *                     const comment = contents
 *                         .replaceAll(/<code>(.+?)<\/code>/g, '`$1`')
 *                         .replaceAll(/<a href="(.+?)">(.+?)<\/a>/g, '[$2]($1)');
 *
 *                     return accum + '\n' + `    /** ${comment} *\/`;
 *                 }
 *             }
 *
 *             console.warn('No match', current);
 *
 *             return accum;
 *         }, 'export enum CssPropertySyntax {') + '\n};\n',
 * );
 * ```
 *
 * @category Internal
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/At-rules/%40property/syntax#values
 */
export enum CssVarSyntaxName {
    /**
     * Accepts any valid
     * [`<url>`](https://developer.mozilla.org/docs/Web/CSS/Reference/Values/url_value) value.
     */
    Url = '<url>',
    /**
     * Accepts a list of valid
     * [`<transform-function>`](https://developer.mozilla.org/docs/Web/CSS/Reference/Values/transform-function)
     * values. It is equivalent to `"<transform-function>+"`.
     */
    TransformList = '<transform-list>',
    /**
     * Accepts any valid
     * [`<transform-function>`](https://developer.mozilla.org/docs/Web/CSS/Reference/Values/transform-function)
     * value.
     */
    TransformFunction = '<transform-function>',
    /**
     * Accepts any valid
     * [`<time>`](https://developer.mozilla.org/docs/Web/CSS/Reference/Values/time) value.
     */
    Time = '<time>',
    /**
     * Accepts any valid
     * [`<string>`](https://developer.mozilla.org/docs/Web/CSS/Reference/Values/string) value.
     */
    String = '<string>',
    /**
     * Accepts any valid
     * [`<resolution>`](https://developer.mozilla.org/docs/Web/CSS/Reference/Values/resolution)
     * value.
     */
    Resolution = '<resolution>',
    /**
     * Accepts any valid
     * [`<percentage>`](https://developer.mozilla.org/docs/Web/CSS/Reference/Values/percentage)
     * value.
     */
    Percentage = '<percentage>',
    /**
     * Accepts any valid
     * [`<number>`](https://developer.mozilla.org/docs/Web/CSS/Reference/Values/number) value.
     */
    Number = '<number>',
    /**
     * Accepts any valid
     * [`<length>`](https://developer.mozilla.org/docs/Web/CSS/Reference/Values/length) or
     * [`<percentage>`](https://developer.mozilla.org/docs/Web/CSS/Reference/Values/percentage)
     * value and any valid
     * [`calc()`](https://developer.mozilla.org/docs/Web/CSS/Reference/Values/calc) expression
     * combining `<length>` and `<percentage>` values.
     */
    LengthPercentage = '<length-percentage>',
    /**
     * Accepts any valid
     * [`<length>`](https://developer.mozilla.org/docs/Web/CSS/Reference/Values/length) value.
     */
    Length = '<length>',
    /**
     * Accepts any valid
     * [`<integer>`](https://developer.mozilla.org/docs/Web/CSS/Reference/Values/integer) value.
     */
    Integer = '<integer>',
    /**
     * Accepts any valid
     * [`<image>`](https://developer.mozilla.org/docs/Web/CSS/Reference/Values/image) value.
     */
    Image = '<image>',
    /**
     * Accepts any valid
     * [`<custom-ident>`](https://developer.mozilla.org/docs/Web/CSS/Reference/Values/custom-ident)
     * value.
     */
    CustomIdent = '<custom-ident>',
    /**
     * Accepts any valid
     * [`<color>`](https://developer.mozilla.org/docs/Web/CSS/Reference/Values/color_value) value.
     */
    Color = '<color>',
    /**
     * Accepts any valid
     * [`<angle>`](https://developer.mozilla.org/docs/Web/CSS/Reference/Values/angle) value.
     */
    Angle = '<angle>',
    Any = '*',
}

/**
 * Possible value for the separator in a list of CSS values.
 *
 * @category Internal
 */
export enum CssVarSyntaxSeparator {
    /** Values are separated by a space. */
    Space = '+',
    /** Values are separated by a comma. */
    Comma = '#',
}

/**
 * Options for defining a CSS var's syntax.
 *
 * @category Internal
 */
export type CssVarSyntax =
    | CssVarSyntaxName
    | RequireExactlyOne<{
          /** Allowed possible syntaxes. Joined together with `|`. */
          union: CssVarSimpleValueSyntax[];
          /** The raw syntax string. This will be passed directly to the CSS engine. */
          raw: string;
          /** Specifies that this syntax requires a list of values. */
          list: {
              /** The values in the list. */
              values: CssVarSimpleValueSyntax;
              /** The list separator. */
              separator: CssVarSyntaxSeparator;
          };
      }>;

/**
 * Allowed values for unions and lists.
 *
 * @category Internal
 */
export type CssVarSimpleValueSyntax =
    | CssVarSyntaxName
    | {
          raw: string;
      };
