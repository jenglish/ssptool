/*
 * This is a thin wrapper around markdown-it.
 */

var MarkdownIt = require('markdown-it')
  , wikilinks = require('markdown-it-wikilinks')
  , md = new MarkdownIt({
    html: true,
    typographer: false
  });

/* Customization:
 * Add 'class=table' to <table> elements for proper Bootstrap display.
 */
md.renderer.rules.table_open = (/* tokens, idx, options, env, self */) => {
    return '<table class="table">\n';
};
md.use(wikilinks({
    baseURL: '/pages/',
    uriSuffix: '.md',
    makeAllLinksAbsolute: true
}));

/**
 * @param {string} markdown - markdown text to parse
 * @return {html} rendered HTML
 */
exports.parse = (markdown) => md.render(markdown);

