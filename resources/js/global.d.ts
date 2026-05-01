import { route as routeFn } from 'ziggy-js';
import type { JSX as ReactJSX } from 'react';

declare global {
    const route: typeof routeFn;

    namespace JSX {
        type Element = ReactJSX.Element;
        interface IntrinsicElements extends ReactJSX.IntrinsicElements {}
    }
}

export {};
