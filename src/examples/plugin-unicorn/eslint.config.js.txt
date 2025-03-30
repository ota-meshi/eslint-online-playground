import eslintPluginUnicorn from 'eslint-plugin-unicorn';

export default [
		// …
		eslintPluginUnicorn.configs.recommended,
		{
			rules: {
				'unicorn/better-regex': 'warn',
			},
		},
];