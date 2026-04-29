<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title inertia>{{ config('app.name') }}</title>
        @routes
        @php
            $hotFile = public_path('hot');
            $hotUrl = is_file($hotFile) ? trim((string) file_get_contents($hotFile)) : null;

            if ($hotUrl) {
                $parsedHotUrl = parse_url($hotUrl);
                $viteScheme = $parsedHotUrl['scheme'] ?? request()->getScheme();
                $vitePort = isset($parsedHotUrl['port']) ? ':' . $parsedHotUrl['port'] : '';
                $viteBaseUrl = sprintf('%s://%s%s', $viteScheme, request()->getHost(), $vitePort);
            }
        @endphp

        @if (! empty($viteBaseUrl ?? null))
            <script type="module">
                import RefreshRuntime from '{{ $viteBaseUrl }}/@react-refresh';

                RefreshRuntime.injectIntoGlobalHook(window);
                window.$RefreshReg$ = () => {};
                window.$RefreshSig$ = () => (type) => type;
                window.__vite_plugin_react_preamble_installed__ = true;
            </script>
            <script type="module" src="{{ $viteBaseUrl }}/@@vite/client"></script>
            <link rel="stylesheet" href="{{ $viteBaseUrl }}/resources/css/app.css" />
            <script type="module" src="{{ $viteBaseUrl }}/resources/js/app.tsx"></script>
        @else
            @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @endif
        @inertiaHead
    </head>
    <body class="font-sans text-ink-900 antialiased">
        @inertia
    </body>
</html>
