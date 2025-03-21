module.exports = {
	globDirectory: '_site/',
	globPatterns: [
		'**/*.{html,svg,css,json,scss,woff,woff2,md,png,jpg,jpeg,js,eot,ttf,xml,txt,sh}'
	],
	swDest: '_site/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};